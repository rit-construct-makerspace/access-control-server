import { AccessControllerRow, AccessControllerState } from "../../db/tables.js";
import * as EquipmentInstanceRepo from "../../repositories/Equipment/EquipmentInstancesRepository.js";
import * as EquipmentRepo from "../../repositories/Equipment/EquipmentRepository.js";
import * as UserRepo from "../../repositories/Users/UserRepository.js";
import * as RoomRepo from "../../repositories/Rooms/RoomRepository.js";
import { Equipment } from "../equipment/Equipment.js";
import { User } from "../users/User.js";
import * as UnlockAttemptRepo from "../../repositories/Logs/UnlockAtemptRepository.js";

export enum AccessAttemptReason {
  APPROVED = "APPROVED",
  ADMIN_BYPASS = "ADMIN_BYPASS",
  MANAGER_BYPASS = "MANAGER_BYPASS",
  EQUIPMENT_TRAINING = "EQUIPMENT_TRAINING",
  ROOM_TRAINING = "ROOM_TRAINING",
  MAKERSPACE_TRAINING = "MAKERSPACE_TRAINING",
  WELCOME = "WELCOME",
  UNPAIRED = "UNPAIRED",
  UNKNOWN_USER = "UNKNOWN_USER",
  ACTIVE_HOLD = "ACTIVE_HOLD",
  ACTIVE_RESTRICTION = "ACTIVE_RESTRICTION",
  ARCHIVED = "ARCHIVED",
  SIGN_OFF = "SIGN_OFF",
  INSUFFICENT_PRIVILEGE = "INSUFFICENT_PRIVILEGE"
}

export class AccessController implements AccessControllerRow {
  id: number;
  deviceID: number;
  channelID: number;
  state: AccessControllerState;

  constructor(rawRow: AccessControllerRow) {
    this.id = rawRow.id;
    this.deviceID = rawRow.deviceID;
    this.channelID = rawRow.channelID;
    this.state = rawRow.state;
  }

  async canUnlock(userID: number, log?: boolean): Promise<{ hasAccess: boolean, reason: AccessAttemptReason }> {
    const rawUser = await UserRepo.getUserByIDOrUndefined(userID);
    if (rawUser === undefined) {
      if (log) { UnlockAttemptRepo.createUnlockAttemptLog(undefined, "NO_USER", undefined, "UNKOWN_USER", false, AccessAttemptReason.UNKNOWN_USER); }
      return { hasAccess: false, reason: AccessAttemptReason.UNKNOWN_USER };
    }
    const user = new User(rawUser)

    const instance = await EquipmentInstanceRepo.getInstanceByAccessControllerID(this.id);
    if (instance === undefined) {
      if (log) { UnlockAttemptRepo.createUnlockAttemptLog(undefined, "UNPAIRED", user.id, user.ritUsername, false, AccessAttemptReason.UNPAIRED); }
      return { hasAccess: false, reason: AccessAttemptReason.UNPAIRED };
    }

    const rawEquipment = await EquipmentRepo.getEquipmentOrUndefinedByID(instance.id);
    if (rawEquipment === undefined) {
      if (log) { UnlockAttemptRepo.createUnlockAttemptLog(undefined, "UNPAIRED", user.id, user.ritUsername, false, AccessAttemptReason.UNPAIRED); }
      return { hasAccess: false, reason: AccessAttemptReason.UNPAIRED };
    }
    const equipment = new Equipment(rawEquipment);

    const result = await equipment.hasAccess(user);
    if (log) {
      UnlockAttemptRepo.createUnlockAttemptLog(equipment.id, equipment.name, user.id, user.ritUsername, result.hasAccess, result.reason);
    }
    return result;
  }

  /**
   * Checks if a given user has permission to set the channel to the "Staff States" (IDLE, ALWAYS_ON, LOCKED_OUT)
   * @param userID the userID of the person who's permissions to check
   * @returns true if the given userID has permission, false otherwise
   */
  async canControl(userID: number): Promise<{ canControl: boolean, reason: AccessAttemptReason }> {
    const rawUser = await UserRepo.getUserByIDOrUndefined(userID);
    if (rawUser === undefined) {
      return { canControl: false, reason: AccessAttemptReason.UNKNOWN_USER };
    }
    const user = new User(rawUser)

    const instance = await EquipmentInstanceRepo.getInstanceByAccessControllerID(this.id);
    if (instance === undefined) {
      return { canControl: false, reason: AccessAttemptReason.UNPAIRED };
    }

    const rawEquipment = await EquipmentRepo.getEquipmentOrUndefinedByID(instance.id);
    if (rawEquipment === undefined) {
      return { canControl: false, reason: AccessAttemptReason.UNPAIRED };
    }

    const rawRoom = await RoomRepo.getRoomByID(rawEquipment.roomID);
    if (rawRoom === null || rawRoom === undefined || rawRoom.makerspaceID === null || rawRoom.makerspaceID === undefined) {
      return { canControl: false, reason: AccessAttemptReason.UNPAIRED };
    }

    const isStaff = await user.isStaffOf(rawRoom.makerspaceID);

    return { canControl: isStaff, reason: isStaff ? AccessAttemptReason.APPROVED : AccessAttemptReason.INSUFFICENT_PRIVILEGE }
  }
}