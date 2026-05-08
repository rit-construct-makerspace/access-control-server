import { EquipmentRow } from "../../knex/tables.js";
import { AccessAttemptReason } from "../devices/accessController.js";
import { User } from "../users/User.js";
import * as RoomRepo from "../../repositories/Rooms/RoomRepository.js";

export class Equipment implements EquipmentRow {
  id: number;
  name: string;
  addedAt: Date;
  inUse: boolean;
  roomID: number;
  archived: boolean;
  imageUrl: string;
  sopUrl: string;
  notes: string;
  byReservationOnly: boolean;
  needsWelcome?: boolean;
  requiresTrainerApproval: boolean;
  requiresInPerson: boolean;
  schedulable: boolean;
  signOffUrl: string;
  subName: string;

  constructor(row: EquipmentRow) {
    this.id = row.id;
    this.name = row.name;
    this.addedAt = row.addedAt;
    this.inUse = row.inUse;
    this.roomID = row.roomID;
    this.archived = row.archived;
    this.imageUrl = row.imageUrl;
    this.sopUrl = row.sopUrl;
    this.notes = row.notes;
    this.byReservationOnly = row.byReservationOnly;
    this.needsWelcome = row.needsWelcome;
    this.requiresTrainerApproval = row.requiresTrainerApproval;
    this.requiresInPerson = row.requiresInPerson;
    this.schedulable = row.schedulable;
    this.signOffUrl = row.signOffUrl;
    this.subName = row.subName;
  }

  async hasAccess(user: User): Promise<{ hasAccess: boolean, reason: AccessAttemptReason }> {
    // ADMIN BYPASS
    if (user.admin) {
      return { hasAccess: true, reason: AccessAttemptReason.ADMIN_BYPASS };
    }

    // ARCHIVE CHECK
    if (user.archived) {
      return { hasAccess: false, reason: AccessAttemptReason.ARCHIVED };
    }

    // HOLD CHECK
    if (await user.hasHolds()) {
      return { hasAccess: false, reason: AccessAttemptReason.ACTIVE_HOLD };
    }

    const room = await RoomRepo.getRoomByID(this.roomID);
    if (room === null || room === undefined || room.makerspaceID === null) {
      return { hasAccess: false, reason: AccessAttemptReason.UNPAIRED };
    }

    // RESTRICTION CHECK
    const restrictions = await user.getRestrictions();
    if (restrictions.some((restriciton) => (restriciton.makerspaceID === room.makerspaceID))) {
      return { hasAccess: false, reason: AccessAttemptReason.ACTIVE_RESTRICTION };
    }

    // MANAGER BYPASS
    if (await user.isManagerOf(room.makerspaceID)) {
      return { hasAccess: true, reason: AccessAttemptReason.MANAGER_BYPASS };
    }

    // WELCOME CHECK
    if (!(process.env.GLOBAL_WELCOME_BYPASS == "TRUE") && this.needsWelcome) {
      if (!(await user.wasWelcomedToday(room.id))) {
        return { hasAccess: false, reason: AccessAttemptReason.WELCOME };
      }
    }

    // TRAINING CHECKS
    if (!(process.env.GLOBAL_TRAINING_BYPASS == "TRUE")) {

      // MAKERSPACE TRAINING CHECK
      if (!(await user.hasMakerspaceTrainings(room.makerspaceID))) {
        return { hasAccess: false, reason: AccessAttemptReason.MAKERSPACE_TRAINING };
      }

      // ROOM TRAINING CHECK
      if (!(await user.hasRoomTrainings(room.id))) {
        return { hasAccess: false, reason: AccessAttemptReason.ROOM_TRAINING };
      }

      // EQUIPMENT TRAINING CHECK
      if (!(await user.hasEquipmentTrainings(this.id))) {
        return { hasAccess: false, reason: AccessAttemptReason.EQUIPMENT_TRAINING };
      }

    }

    // SIGN-OFF CHECK
    if (!(process.env.GLOBAL_ACCESS_CHECK_BYPASS == "TRUE") && this.requiresInPerson) {
      if (!(await user.hasAccessCheck(this.id))) {
        return { hasAccess: false, reason: AccessAttemptReason.MISSING_SIGN_OFF };
      }
    }

    // SUCCESS!
    return { hasAccess: true, reason: AccessAttemptReason.APPROVED };
  }

  async getMakerspaceID(): Promise<number | undefined> {
    const room = await RoomRepo.getRoomByID(this.roomID);
    if (room === null || room === undefined) {
      return undefined;
    }
    return room.makerspaceID ?? undefined;
  }
}