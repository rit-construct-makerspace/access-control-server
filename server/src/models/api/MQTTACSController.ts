import mqtt from "mqtt";
import { CoreAuthToRequest, CoreConfigReport, CoreInfoRequest, CoreLogRequest, CoreStateChangeReport, CoreStatusReport, ServerAuthToResponse, ServerCommand, ServerConfigUpdateRequest, ServerInfoResponse, WelcomeRequest, WelcomeResponse } from "./ACSFormats.js";
import { ACSOrchestrator } from "./ACSOrchestrator.js";
import { ACSController } from "./ACSController.js";
import { Core } from "../devices/core.js";
import * as DeviceRepo from "../../repositories/Devices/DeviceRepository.js";
import { Device } from "../devices/device.js";


export default class MQTTACSController extends ACSController {
  private static client: mqtt.MqttClient;
  private static self: MQTTACSController = new MQTTACSController();

  public static initialize(): boolean {
    if (MQTTACSController.client !== undefined) {
      return false;
    }

    const address = process.env.SERVER_MQTT_ADDRESS;
    if (address === undefined) {
      return false;
    }

    MQTTACSController.client = mqtt.connect(address, {
      username: "SERVER",
      password: process.env.SERVER_MQTT_PASSWORD
    });

    MQTTACSController.client.on("connect", (_packet) => {
      MQTTACSController.client.subscribe("makerspace/+/device/+/status", { qos: 2 });
      MQTTACSController.client.subscribe("makerspace/+/device/+/stateChange", { qos: 2 });
      MQTTACSController.client.subscribe("makerspace/+/device/+/log", { qos: 2 });
      MQTTACSController.client.subscribe("makerspace/+/device/+/authTo/request", { qos: 2 });
      MQTTACSController.client.subscribe("makerspace/+/device/+/config/report", { qos: 2 });
      MQTTACSController.client.subscribe("makerspace/+/device/+/info/request", { qos: 2 });
      MQTTACSController.client.subscribe("makersapce/+/device/+/welcome/request");
    });

    MQTTACSController.client.on("error", (error) => console.log(`[MQTTACSController] Error: ${error}`))

    MQTTACSController.client.on("disconnect", (packet) => {
      console.log(`[MQTTACSController] Disconnected: ${packet}`)
    })

    MQTTACSController.client.on("message", MQTTACSController.messageDirecter);

    return true;
  }

  public getName(): string {
    return "MQTTACSController"
  }

  private static registerDevice(deviceID: number) {
    if (ACSOrchestrator.getDeviceController(deviceID)?.getName() !== MQTTACSController.self.getName()) {
      ACSOrchestrator.registerDevice(deviceID, MQTTACSController.self);
    }
  }

  private static messageDirecter(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");

    if (topicArray.length < 5) { return; }
    switch (topicArray[4]) {
      case "status":
        return MQTTACSController.statusHandler(topic, payload, packet);
      case "stateChange":
        return MQTTACSController.stateChangeHandler(topic, payload, packet);
      case "log":
        return MQTTACSController.logHandler(topic, payload, packet);
      case "authTo":
        return MQTTACSController.authToRequestHandler(topic, payload, packet);
      case "config":
        return MQTTACSController.configReportHandler(topic, payload, packet);
      case "info":
        return MQTTACSController.infoRequestHandler(topic, payload, packet);
      case "welcome":
        return MQTTACSController.welcomeRequestHandler(topic, payload, packet);
      default:
        console.log("UNKOWN TOPIC: ", topicArray[4]);
        return;
    }
  }

  private static async statusHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");
    const SN = topicArray[3];
    const device = await DeviceRepo.getDeviceBySN(SN);
    if (device == undefined) { return; }
    MQTTACSController.registerDevice(device.id);

    const statusReport: CoreStatusReport = JSON.parse(payload.toString());
    // TODO: INPUT VALIDATION

    ACSOrchestrator.handleCoreStatusReport(device.id, statusReport);
  }

  private static async stateChangeHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");
    const SN = topicArray[3];
    const device = await DeviceRepo.getDeviceBySN(SN);
    if (device == undefined) { return; }
    MQTTACSController.registerDevice(device.id);

    const stateChangeReport: CoreStateChangeReport = JSON.parse(payload.toString());
    // TODO: INPUT VALIDATION

    await ACSOrchestrator.handleCoreStateChangeReport(device.id, stateChangeReport);
  }

  private static async logHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");
    const SN = topicArray[3];
    const device = await DeviceRepo.getDeviceBySN(SN);
    if (device == undefined) { return; }
    MQTTACSController.registerDevice(device.id);

    const logRequest: CoreLogRequest = JSON.parse(payload.toString());
    // TODO: INPUT VALIDATION

    ACSOrchestrator.handleCoreLogRequest(device.id, logRequest);
  }

  private static async authToRequestHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");
    const SN = topicArray[3];
    const device = await DeviceRepo.getDeviceBySN(SN);
    if (device == undefined) { return; }
    MQTTACSController.registerDevice(device.id);

    const authToRequest: CoreAuthToRequest = JSON.parse(payload.toString());
    // TODO: INPUT VALIDATION

    ACSOrchestrator.handleCoreAuthToRequest(device.id, authToRequest);
  }

  private static async configReportHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");
    const SN = topicArray[3];
    const device = await DeviceRepo.getDeviceBySN(SN);
    if (device == undefined) { return; }
    MQTTACSController.registerDevice(device.id);

    const configReport: CoreConfigReport = JSON.parse(payload.toString());
    // TODO: INPUT VALIDATION

    ACSOrchestrator.handleCoreConfigReport(device.id, configReport);
  }

  private static async infoRequestHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");
    const SN = topicArray[3];
    const device = await DeviceRepo.getDeviceBySN(SN);
    if (device == undefined) { return; }
    MQTTACSController.registerDevice(device.id);

    const infoRequest: CoreInfoRequest = JSON.parse(payload.toString());
    // TODO: INPUT VALIDATION

    ACSOrchestrator.handleCoreInfoRequest(device.id, infoRequest);
  }

  private static async welcomeRequestHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");
    const makerspaceID = Number(topicArray[1]);
    const SN = topicArray[3];
    const device = await DeviceRepo.getDeviceBySN(SN);
    if (device == undefined) { return; }
    MQTTACSController.registerDevice(device.id);

    const welcomeRequest: WelcomeRequest = JSON.parse(payload.toString());

    ACSOrchestrator.handleWelcomeRequest(makerspaceID, device.id, welcomeRequest.cardTagID);
  }

  sendCoreAuthToResponse(core: Core, response: ServerAuthToResponse): boolean {
    try {
      MQTTACSController.client.publish(`makerspace/${core.makerspaceID}/device/${core.SN}/authTo/response`, JSON.stringify(response), { qos: 2 });
    } catch (_e) {
      return false;
    }
    return true;
  }

  sendCoreConfigUpdate(core: Core, update: ServerConfigUpdateRequest): boolean {
    try {
      MQTTACSController.client.publish(`makerspace/${core.makerspaceID}/device/${core.SN}/config/update`, JSON.stringify(update), { qos: 2 });
    } catch (_e) {
      return false;
    }
    return true;
  }

  sendCoreInfoResponse(core: Core, response: ServerInfoResponse): boolean {
    try {
      MQTTACSController.client.publish(`makerspace/${core.makerspaceID}/device/${core.SN}/info/response`, JSON.stringify(response), { qos: 2 });
    } catch (_e) {
      return false;
    }
    return true;
  }

  sendCoreCommand(core: Core, command: ServerCommand): boolean {
    try {
      MQTTACSController.client.publish(`makerspace/${core.makerspaceID}/device/${core.SN}/command`, JSON.stringify(command), { qos: 2 });
    } catch (_e) {
      return false;
    }
    return true;
  }

  sendWelcomeResponse(device: Device, response: WelcomeResponse): boolean {
    try {
      MQTTACSController.client.publish(`makerspace/${device.makerspaceID}/device/${device.SN}/welcome/response`, JSON.stringify(response), { qos: 2 });
    } catch (_e) {
      return false;
    }
    return true;
  }
}