import mqtt from "mqtt";


export default class MQTTACSController {
  private static client: mqtt.MqttClient;

  public static initialize(): boolean {
    if (MQTTACSController.client !== undefined) {
      return false;
    }

    MQTTACSController.client = mqtt.connect("ws://localhost:3000/mqtt");

    MQTTACSController.client.on("connect", (_packet) => {
      MQTTACSController.client.subscribe("makerspace/+/device/+/status", { qos: 2 });
      MQTTACSController.client.subscribe("makerspace/+/device/+/cardTag", { qos: 2 });
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
      case "cardTag":
        return MQTTACSController.cardTagHandler(topic, payload, packet);
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

  private static statusHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {

  }

  private static cardTagHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {

  }

  private static stateChangeHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {

  }

  private static logHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {

  }

  private static authToRequestHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {

  }

  private static configReportHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {

  }

  private static infoRequestHandler(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {

  }
}