
export interface Device {
  id: number;
  name: string;
  SN: string;
  pairTime: Date;
  hardwareVersion: string | undefined;
  firmwareVersion: string | undefined;
  targetFirmware: string | undefined;
  keyCycle: number;
  makerspaceID: number;
}

enum CoreInputMode {
  INSERT = "INSERT",
  TEMP = "TEMP",
  TOGGLE = "TOGGLE"
}

export interface Core {
  deviceID: number;
  channels: number;
  inputMode: CoreInputMode;
  tempDuration: number;
  currentCardTag: string;
  lastStatusTime: Date;
  sessionStartTime: Date;
  device: Device;
}

enum DispenserError {
  CARD_STUCK = "CARD_STUCK",
  OUT_OF_CARDS = "OUT_OF_CARDS"
}

export interface Dispenser {
  deviceID: number;
  cardsLeft: number;
  error: DispenserError;
  device: Device;
}