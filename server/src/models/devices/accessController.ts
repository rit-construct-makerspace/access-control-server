import { AccessControllerRow, AccessControllerState } from "../../db/tables.js";
import * as EquipmentInstanceRepo from "../../repositories/Equipment/EquipmentInstancesRepository.js";
import * as EquipmentRepo from "../../repositories/Equipment/EquipmentRepository.js";
import * as UserRepo from "../../repositories/Users/UserRepository.js";
import * as RoomRepo from "../../repositories/Rooms/RoomRepository.js";
import { Equipment } from "../equipment/Equipment.js";
import { User } from "../users/User.js";
import * as UnlockAttemptRepo from "../../repositories/Logs/UnlockAtemptRepository.js";
import * as AuditLogRepo from "../../repositories/AuditLogs/AuditLogRepository.js";
import * as DeviceRepo from "../../repositories/Devices/DeviceRepository.js";
import { Device } from "./device.js";

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
  MISSING_SIGN_OFF = "MISSING_SIGN_OFF",
  INSUFFICENT_PRIVILEGE = "INSUFFICENT_PRIVILEGE"
}

export class AccessController implements AccessControllerRow {
  id: number;
  deviceID: number;
  channelID: number;
  state: AccessControllerState;
  tempDuration: number;

  constructor(rawRow: AccessControllerRow) {
    this.id = rawRow.id;
    this.deviceID = rawRow.deviceID;
    this.channelID = rawRow.channelID;
    this.state = rawRow.state;
    this.tempDuration = rawRow.tempDuration;
  }

  async canUnlock(userID: number, log?: boolean): Promise<{ hasAccess: boolean, reason: AccessAttemptReason }> {
    const rawUser = await UserRepo.getUserByIDOrUndefined(userID);
    if (rawUser === undefined) {
      if (log) {
        await UnlockAttemptRepo.createUnlockAttemptLog(undefined, "", undefined, "", false, AccessAttemptReason.UNKNOWN_USER);
        const device = await this.getDevice();
        await AuditLogRepo.createAuditLog(
          `Unknown user failed to activate device {device}`,
          "auth",
          device?.makerspaceID,
          { id: this.deviceID, label: device?.name ?? "UNKNOWN DEVICE" }
        );
      }
      return { hasAccess: false, reason: AccessAttemptReason.UNKNOWN_USER };
    }
    const user = new User(rawUser)

    const instance = await EquipmentInstanceRepo.getInstanceByAccessControllerID(this.id);
    if (instance === undefined) {
      if (log) {
        await UnlockAttemptRepo.createUnlockAttemptLog(undefined, "", user.id, user.ritUsername, false, AccessAttemptReason.UNPAIRED);
        const device = await this.getDevice();
        await AuditLogRepo.createAuditLog(
          `{user} failed to activate unpaired device {device}`,
          "auth",
          device?.makerspaceID,
          { id: user.id, label: `${user.firstName} ${user.lastName}` },
          { id: this.deviceID, label: device?.name ?? "UNKNOWN DEVICE" }
        );
      }
      return { hasAccess: false, reason: AccessAttemptReason.UNPAIRED };
    }

    const rawEquipment = await EquipmentRepo.getEquipmentOrUndefinedByID(instance.equipmentID);
    if (rawEquipment === undefined) {
      if (log) {
        await UnlockAttemptRepo.createUnlockAttemptLog(undefined, "", user.id, user.ritUsername, false, AccessAttemptReason.UNPAIRED);
        const device = await this.getDevice();
        await AuditLogRepo.createAuditLog(
          `{user} failed to activate unpaired device {device}`,
          "auth",
          device?.makerspaceID,
          { id: user.id, label: `${user.firstName} ${user.lastName}` },
          { id: this.deviceID, label: device?.name ?? "UNKNOWN DEVICE" }
        );
      }
      return { hasAccess: false, reason: AccessAttemptReason.UNPAIRED };
    }
    const equipment = new Equipment(rawEquipment);

    const result = await equipment.hasAccess(user);
    if (log) {
      await UnlockAttemptRepo.createUnlockAttemptLog(equipment.id, equipment.name, user.id, user.ritUsername, result.hasAccess, result.reason);
      if (!result.hasAccess) {
        await AuditLogRepo.createAuditLog(
          `{user} failed to activate {equipment} with reason ${result.reason}`,
          "auth",
          await equipment.getMakerspaceID(),
          { id: user.id, label: `${user.firstName} ${user.lastName}` },
          { id: equipment.id, label: `${equipment.name} - ${instance.name}` }
        );
      }
    }
    return result;
  }

  /**
   * Checks if a given user has permission to set the channel to the "Staff States" (IDLE, ALWAYS_ON, LOCKED_OUT)
   * @param userID the userID of the person who's permissions to check
   * @returns true if the given userID has permission, false otherwise
   */
  async canControl(userID: number, targetState: AccessControllerState): Promise<{ canControl: boolean, reason: AccessAttemptReason }> {
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
    var hasAccess = true;
    if (targetState === AccessControllerState.ALWAYS_ON) {
      const result = await this.canUnlock(user.id, false);
      hasAccess = result.hasAccess;
    }

    return { canControl: isStaff, reason: isStaff && hasAccess ? AccessAttemptReason.APPROVED : AccessAttemptReason.INSUFFICENT_PRIVILEGE }
  }

  async getDevice(): Promise<Device | undefined> {
    return await DeviceRepo.getDeviceByID(this.deviceID);
  }

  async startSession(cardTag: string): Promise<void> {
    const rawUser = await UserRepo.getUserByCardTagID(cardTag);
    if (rawUser === undefined) {
      return;
    }

    const instance = await EquipmentInstanceRepo.getInstanceByAccessControllerID(this.id);
    if (instance === undefined) {
      return;
    }

    const rawEquipment = await EquipmentRepo.getEquipmentOrUndefinedByID(instance.equipmentID);
    if (rawEquipment === undefined) {
      return;
    }
    const equipment = new Equipment(rawEquipment);

    await AuditLogRepo.createAuditLog(
      "{user} activated {equipment}",
      "auth",
      await equipment.getMakerspaceID(),
      { id: rawUser.id, label: `${rawUser.firstName} ${rawUser.lastName}` },
      { id: equipment.id, label: `${equipment.name} - ${instance.name}` }
    )
  }

  async endSession(cardTag: string): Promise<void> {
    const rawUser = await UserRepo.getUserByCardTagID(cardTag);
    if (rawUser === undefined) {
      return;
    }

    const instance = await EquipmentInstanceRepo.getInstanceByAccessControllerID(this.id);
    if (instance === undefined) {
      return;
    }

    const rawEquipment = await EquipmentRepo.getEquipmentOrUndefinedByID(instance.equipmentID);
    if (rawEquipment === undefined) {
      return;
    }
    const equipment = new Equipment(rawEquipment);

    await AuditLogRepo.createAuditLog(
      "{user} deactivated {equipment}",
      "auth",
      await equipment.getMakerspaceID(),
      { id: rawUser.id, label: `${rawUser.firstName} ${rawUser.lastName}` },
      { id: equipment.id, label: `${equipment.name} - ${instance.name}` }
    )
  }
}