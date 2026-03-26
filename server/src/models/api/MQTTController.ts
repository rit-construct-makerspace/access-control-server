import mqtt from "mqtt";


export default class MQTTController {
  private static client: mqtt.MqttClient;

  public static initialize(): boolean {
    if (MQTTController.client !== undefined) {
      return false;
    }

    MQTTController.client = mqtt.connect("ws://localhost:3000/mqtt");

    MQTTController.client.on("connect", (_packet) => {
      MQTTController.client.subscribe("makerspace/+/device/+/status", { qos: 2 });
      MQTTController.client.subscribe("makerspace/+/device/+/cardTag", { qos: 2 });
      MQTTController.client.subscribe("makerspace/+/device/+/stateChange", { qos: 2 });
      MQTTController.client.subscribe("makerspace/+/device/+/log", { qos: 2 });
      MQTTController.client.subscribe("makerspace/+/device/+/authTo/request", { qos: 2 });
      MQTTController.client.subscribe("makerspace/+/device/+/config/report", { qos: 2 });
      MQTTController.client.subscribe("makerspace/+/device/+/info/request", { qos: 2 });
    });

    MQTTController.client.on("message", MQTTController.messageDirecter)

    return true;
  }

  private static messageDirecter(topic: string, payload: Buffer<ArrayBufferLike>, packet: mqtt.IPublishPacket) {
    const topicArray = topic.split("/");

    if (topicArray.length < 5) { return; }
    switch (topicArray[4]) {
      case "status":
        return MQTTController.statusHandler(topic, payload, packet);
      case "cardTag":
        return MQTTController.cardTagHandler(topic, payload, packet);
      case "stateChange":
        return MQTTController.stateChangeHandler(topic, payload, packet);
      case "log":
        return MQTTController.logHandler(topic, payload, packet);
      case "authTo":
        return MQTTController.authToRequestHandler(topic, payload, packet);
      case "config":
        return MQTTController.configReportHandler(topic, payload, packet);
      case "info":
        return MQTTController.infoRequestHandler(topic, payload, packet);
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