import { RestrictionRow, UserRow } from "../../db/tables.js";
import * as HoldsRepo from "../../repositories/Holds/HoldsRepository.js";
import * as RestrctionRepo from "../../repositories/Restrictions/RestrictionsRepository.js";
import * as UserRepo from "../../repositories/Users/UserRepository.js";
import * as RoomRepo from "../../repositories/Rooms/RoomRepository.js";
import * as MakerspaceRepo from "../../repositories/Makerspaces/MakerspaceRespository.js";
import * as EquipmentRepo from "../../repositories/Equipment/EquipmentRepository.js";
import * as AccessCheckRepo from "../../repositories/Equipment/AccessChecksRepository.js";

export class User implements UserRow {
  id: number;
  firstName: string;
  lastName: string;
  pronouns: string;
  registrationDate: Date;
  expectedGraduation: string;
  college: string;
  setupComplete: boolean;
  ritUsername: string;
  archived: boolean;
  cardTagID: string;
  notes: string;
  activeHold: boolean;
  admin: boolean;
  accountID: number;
  atriumToken: string | null;
  forceArchive: boolean | null;

  constructor(row: UserRow) {
    this.id = row.id;
    this.firstName = row.firstName;
    this.lastName = row.lastName;
    this.pronouns = row.pronouns;
    this.registrationDate = row.registrationDate;
    this.expectedGraduation = row.expectedGraduation;
    this.college = row.college;
    this.setupComplete = row.setupComplete;
    this.ritUsername = row.ritUsername;
    this.archived = row.archived;
    this.cardTagID = row.cardTagID;
    this.notes = row.notes;
    this.activeHold = row.activeHold;
    this.admin = row.admin;
    this.accountID = row.accountID;
    this.atriumToken = row.atriumToken;
    this.forceArchive = row.forceArchive;
  }

  async hasHolds(): Promise<boolean> {
    return await HoldsRepo.hasActiveHolds(this.id);
  }

  async getRestrictions(): Promise<RestrictionRow[]> {
    return await RestrctionRepo.getRestrictionsByUserID(this.id);
  }

  async getManagerPerms(): Promise<number[]> {
    return await UserRepo.getUserManagerPerms(this.id);
  }

  async getStaffPerms(): Promise<number[]> {
    return await UserRepo.getUserStaffPerms(this.id);
  }

  async isManagerOf(makerspaceID: number): Promise<boolean> {
    if (this.admin) { return true; }

    const managerPerms = await this.getManagerPerms();
    return managerPerms.includes(makerspaceID);
  }

  async isStaffOf(makerspaceID: number): Promise<boolean> {
    if (await this.isManagerOf(makerspaceID)) { return true; }

    const staffPerms = await this.getStaffPerms();
    return staffPerms.includes(makerspaceID);
  }

  async wasWelcomedToday(roomID: number): Promise<boolean> {
    return await RoomRepo.hasSwipedToday(roomID, this.id);
  }

  async hasMakerspaceTrainings(makerspaceID: number): Promise<boolean> {
    return await MakerspaceRepo.hasMakerspaceTrainings(makerspaceID, this.id);
  }

  async hasRoomTrainings(roomID: number): Promise<boolean> {
    return await RoomRepo.hasRoomTrainings(roomID, this.id);
  }

  async hasEquipmentTrainings(equipmentID: number): Promise<boolean> {
    return await EquipmentRepo.hasTrainingModules(this.id, equipmentID);
  }

  async hasAccessCheck(equipmentID: number): Promise<boolean> {
    return (await AccessCheckRepo.hasApprovedAccessCheck(this.id, equipmentID)) ?? false;
  }
}