/**
 * tables.ts
 * 
 * This contains the definitions for the objects every knex select operation will map to.
 */

import { Privilege } from "../schemas/usersSchema.js";

export interface AuditLogRow {
  id: number;
  dateTime: Date;
  message: string;
  category: string;
}

export interface EquipmentRow {
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
}

export interface EquipmentInstancesRow {
  id: number;
  equipmentID: number;
  name: string;
  status: string;
  readerID: number | null
}

export interface MaintenanceLogRow {
  id: number;
  authorID: number;
  equipmentID: number;
  timestamp: Date;
  content: string;
  tagID1: number;
  tagID2: number;
  tagID3: number;
  instanceID: number;
}

export interface ResolutionLogRow {
  id: number;
  authorID: number;
  equipmentID: number;
  timestamp: Date;
  issue: string;
  content: string;
  tagID1: number;
  tagID2: number;
  tagID3: number;
  instanceID: number;
}

export interface MaintenanceTagRow {
  id: number;
  equipmentID: number;
  label: string;
  color: string;
}

export interface HoldRow {
  id: number;
  creatorID: number;
  removerID?: number;
  userID: number;
  description: string;
  createDate: Date;
  removeDate?: Date;
}

export interface InventoryItemRow {
  id: number;
  image?: string;
  name: string;
  unit: string;
  pluralUnit: string;
  count: number;
  pricePerUnit: number;
  threshold: number;
  archived: boolean;
  staffOnly: boolean;
  storefrontVisible: boolean;
  notes: string;
  description: string;
  tagID1: number | null;
  tagID2: number | null;
  tagID3: number | null;
  makerspaceID?: number;
}

export interface InventoryCarts {
  id: number;
  userID: number;
  makerspaceID: number;
  lastModified: Date;
}

export interface InventoryItemsForCarts {
  cartID: number;
  itemID: number;
  count: number;
}

export interface InventoryTagRow {
  id: number;
  label: string;
  color: string;
}

export interface InventoryLedgerRow {
  id: number;
  timestamp: Date;
  initiator: number;
  category: string;
  totalCost: number;
  purchaser: number;
  notes: string;
  items: string;
}

export interface ModuleSubmissionRow {
  id: number;
  moduleID: number;
  makerID: number;
  submissionDate: Date;
  passed: boolean;
  expirationDate: Date;
  summary: string;
}

export interface ModulesForEquipmentRow {
  id: number;
  equipmentID: number;
  moduleID: number;
}

export interface ReservationEventRow {
  id: number;
  reservationID: number;
  eventType: string;
  userID: number;
  dateTime: Date;
  payload: string;
}

export interface ReservationRow {
  id: number;
  makerID: number;
  createDate: Date;
  startTime: Date;
  endTime: Date;
  equipmentID: number;
  status: string;
  lastUpdated: Date;
}

export interface RoomSwipeRow {
  id: number;
  dateTime: number;
  roomID: number;
  userID: number;
}

export interface RoomRow {
  id: number;
  name: string;
  archived: boolean;
  zoneID: number | null;
}

export interface DataPointsRow {
  id: number;
  label: string;
  value: number;
}

export interface TrainingModuleRow {
  id: number;
  name: string;
  quiz: TrainingModuleItem[];
  archived: boolean;
  reservationPrompt: ReservationPrompt;
}

// not a table but the json structure for a column on the table above
export interface TrainingModuleItem {
  id: string;
  type: string;
  text: string;
  options?: ModuleItemOption[];
}

export interface TrainingHoldsRow {
  id: number;
  moduleID: number;
  userID: number;
  expires: Date;
}

export interface ReservationPrompt {
  promptText: string;
}

export interface ModuleItemOption {
  id: string;
  text: string;
  correct?: boolean;
}

export interface UserRow {
  id: number;
  firstName: string;
  lastName: string;
  pronouns: string;
  isStudent: boolean;
  privilege: Privilege;
  registrationDate: Date;
  expectedGraduation: string;
  college: string;
  setupComplete: boolean;
  ritUsername: string;
  archived: boolean;
  balance: string;
  cardTagID: string;
  notes: string;
  activeHold: boolean;
  admin: boolean;
}

export interface ReaderRow {
  id: number;
  machineID: number;
  machineType: string;
  name: string;
  zone: string;
  temp: number;
  state: string;
  currentUID: string;
  recentSessionLength: number;
  lastStatusReason: string;
  scheduledStatusFreq: number;
  lastStatusTime: Date;
  helpRequested: boolean;
  BEVer: string;
  FEVer: string;
  HWVer: string;
  sessionStartTime: Date;
  SN?: string;
  readerKeyCycle: number;
  pairTime?: Date
}

export interface ReaderLogRow {
  id: number;
  readerID: number | null;
  currentInstanceID: number | null;
  dateTime: Date;
  log: object;
}

export interface AnnouncementRow {
  id: number;
  title: string;
  description: string;
}

export interface AccessCheckRow {
  id: number;
  userID: number;
  equipmentID: number;
  readyDate: Date;
  approved: boolean;
}

export interface ZoneHoursRow {
  id: number;
  zoneID: number | null;
  type: string;
  dayOfTheWeek: number;
  time: string;
  imageUrl: string;
}

export interface ZoneRow {
  id: number;
  name: string;
  imageUrl: string;
}

export interface RoomsForZonesRow {
  zoneID: number;
  roomID: number;
}

export interface EquipmentSessionRow {
  id: number;
  start: Date;
  equipmentID: number;
  userID: number;
  sessionLength: number;
  readerSlug: string;
}

export interface TextFieldRow {
  id: number;
  value: string;
}

export interface ToolItemTypesRow {
  id: number;
  name: string;
  defaultLocationRoomID: number;
  defaultLocationDescription: string;
  description: string;
  checkoutNote: string;
  checkinNote: string;
  allowCheckout: boolean;
  imageUrl: string;
}

export interface ToolItemInstancesRow {
  id: number;
  typeID: number;
  uniqueIdentifier: string;
  locationRoomID: number;
  locationDescription: string;
  condition: string;
  status: string;
  notes: string;
  borrowerUserID: number | null;
  borrowedAt: Date | null;
}

export interface ManagerRow {
  userID: number;
  makerspaceID: number;
}

export interface StaffRow {
  userID: number;
  makerspaceID: number;
}

export interface TrainerRow {
  userID: number;
  equipmentID: number;
}

export interface RestrictionRow {
  id: number;
  creatorID: number | null;
  userID: number;
  makerspaceID: number;
  reason: string;
  createDate: Date | null;
}

export interface PassedModulesRow {
  userID: number;
  moduleID: number;
  passedDate: Date;
}

declare module "knex/types/tables.js" {
  interface Tables {
    AuditLogs: AuditLogRow;
    Equipment: EquipmentRow;
    EquipmentInstances: EquipmentInstancesRow;
    Holds: HoldRow;
    InventoryItem: InventoryItemRow;
    InventoryTags: InventoryTagRow;
    ModuleSubmissions: ModuleSubmissionRow;
    ModulesForEquipment: ModulesForEquipmentRow;
    ReservationEvents: ReservationEventRow;
    Reservations: ReservationRow;
    RoomSwipes: RoomSwipeRow;
    Rooms: RoomRow;
    TrainingModule: TrainingModuleRow;
    TrainingHolds: TrainingHoldsRow;
    Users: UserRow;
    Readers: ReaderRow;
    ReaderLogs: ReaderLogRow;
    AccessChecks: AccessCheckRow;
    Zones: ZoneRow;
    RoomsForZones: RoomsForZonesRow
    ZoneHours: ZoneHoursRow;
    DataPoints: DataPointsRow;
    EquipmentSessions: EquipmentSessionRow;
    InventoryLedger: InventoryLedgerRow;
    MaintenanceLogs: MaintenanceLogRow;
    ResolutionLogs: ResolutionLogRow;
    MaintenanceTags: MaintenanceTagRow;
    ToolItemTypes: ToolItemTypesRow;
    ToolItemInstances: ToolItemInstancesRow;
    Managers: ManagerRow;
    Staff: StaffRow;
    Trainers: TrainerRow;
    Restrictions: RestrictionRow;
    PassedModules: PassedModulesRow;
  }
}
