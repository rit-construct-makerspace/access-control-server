import mqtt from "mqtt";
import * as CoreRepo from "../../repositories/Devices/CoreRepository.js";
import * as ACRepo from "../../repositories/Devices/AccessControllerRepository.js"
import { CoreAuthToRequest, CoreConfigReport, CoreInfoRequest, CoreLogRequest, CoreStateChangeReport, CoreStatusReport, ServerAuthToResponse, ServerCommand, ServerConfigUpdateRequest, ServerInfoResponse } from "./ACSFormats.js";
import { AccessControllerState } from "../../db/tables.js";
import { ACSOrchestrator } from "./ACSOrchestrator.js";
import { ACSController } from "./ACSController.js";
import { Core } from "../devices/core.js";


export default class MQTTACSController extends ACSController {
  private static client: mqtt.MqttClient;
  private static self: MQTTACSController = new MQTTACSController();

  public static initialize(): boolean {
    if (MQTTACSController.client !== undefined) {
      return false;
    }

    MQTTACSController.client = mqtt.connect("ws://localhost:3000/mqtt");

    MQTTACSController.client.on("connect", (_packet) => {
      MQTTACSController.client.subscribe("makerspace/+/device/+/status", { qos: 2 });
      MQTTACSController.client.subscribe("makerspace/+/device/+/stateChange", { qos: 2 });
      MQTTACSController.client.subscribe("makerspace/+/device/+/log", { qos: 2 });
      MQTTACSController.client.subscribe("makerspace/+/device/+/authTo/request", { qos: 2 });
      MQTTACSController.client.subscribe("makerspace/+/device/+/config/report", { qos: 2 });
      MQTTACSController.client.subscribe("makerspace/+/device/+/info/request", { qos: 2 });
    });

    MQTTACSController.client.on("message", MQTTACSController.messageDirecter)

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
    }
  }

  private static async statusHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");
    const deviceID = Number(topicArray[3]);
    MQTTACSController.registerDevice(deviceID);

    const statusReport: CoreStatusReport = JSON.parse(payload.toString());
    // TODO: INPUT VALIDATION

    ACSOrchestrator.handleCoreStatusReport(deviceID, statusReport);
  }

  private static async stateChangeHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");
    const deviceID = Number(topicArray[3]);
    MQTTACSController.registerDevice(deviceID);

    const stateChangeReport: CoreStateChangeReport = JSON.parse(payload.toString());
    // TODO: INPUT VALIDATION

    ACSOrchestrator.handleCoreStateChangeReport(deviceID, stateChangeReport);
  }

  private static async logHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");
    const deviceID = Number(topicArray[3]);
    MQTTACSController.registerDevice(deviceID);

    const logRequest: CoreLogRequest = JSON.parse(payload.toString());
    // TODO: INPUT VALIDATION

    ACSOrchestrator.handleCoreLogRequest(deviceID, logRequest);
  }

  private static async authToRequestHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");
    const deviceID = Number(topicArray[3]);
    MQTTACSController.registerDevice(deviceID);

    const authToRequest: CoreAuthToRequest = JSON.parse(payload.toString());
    // TODO: INPUT VALIDATION

    ACSOrchestrator.handleCoreAuthToRequest(deviceID, authToRequest);
  }

  private static async configReportHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");
    const deviceID = Number(topicArray[3]);
    MQTTACSController.registerDevice(deviceID);

    const configReport: CoreConfigReport = JSON.parse(payload.toString());
    // TODO: INPUT VALIDATION

    ACSOrchestrator.handleCoreConfigReport(deviceID, configReport);
  }

  private static async infoRequestHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");
    const deviceID = Number(topicArray[3]);
    MQTTACSController.registerDevice(deviceID);

    const infoRequest: CoreInfoRequest = JSON.parse(payload.toString());
    // TODO: INPUT VALIDATION

    ACSOrchestrator.handleCoreInfoRequest(deviceID, infoRequest);
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
}