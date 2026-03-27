import mqtt from "mqtt";
import * as CoreRepo from "../../repositories/Devices/CoreRepository.js";
import * as ACRepo from "../../repositories/Devices/AccessControllerRepository.js"
import { CoreStateChangeReport, CoreStatusReport } from "./ACSFormats.js";
import { AccessControllerState } from "../../db/tables.js";


export default class MQTTACSController {
  private static client: mqtt.MqttClient;

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

    const core = await CoreRepo.getCoreByDeviceID(deviceID);
    if (core === undefined) { return; }

    const statusReport: CoreStatusReport = JSON.parse(payload.toString());
    await core.statusUpdate(statusReport.currentCardTag);

    statusReport.channels.forEach(async (channel) => await core.updateControllerState(channel.channelID, channel.state));
  }

  private static async stateChangeHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");
    const deviceID = Number(topicArray[3]);

    const core = await CoreRepo.getCoreByDeviceID(deviceID);
    if (core === undefined) { return; }

    const stateChangeReport: CoreStateChangeReport = JSON.parse(payload.toString());

    const oldCardTag = core.currentCardTag;

    await core.statusUpdate(stateChangeReport.currentCardTag);

    stateChangeReport.channels.forEach(async (channel) => {
      if (channel.fromState === AccessControllerState.UNLOCKED) {
        // Leaving UNLOCKED, register an end of session message
        (await ACRepo.getAccessControllersByDeviceAndChannelID(deviceID, channel.channelID))?.endSession(oldCardTag ?? "");
      } else if (channel.toState === AccessControllerState.UNLOCKED) {
        // TODO: Register start of session
      }
      await core.updateControllerState(channel.channelID, channel.toState);
    })
  }

  private static async logHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {

  }

  private static async authToRequestHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {

  }

  private static async configReportHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {

  }

  private static async infoRequestHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {

  }
}