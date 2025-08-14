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

export interface InventoryCartsRow {
  id: number;
  userID: number;
  makerspaceID: number;
  lastModified: Date;
}

export interface InventoryItemsForCartsRow {
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
  makerspaceID: number | null;
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
  cardTagID: string;
  notes: string;
  activeHold: boolean;
  admin: boolean;
  accountID: number;
  atriumToken: string | null;
  forceArchive: boolean | null;
}

export interface ReaderRow {
  id: number;
  name: string;
  temp: number;
  state: string;
  currentUID: string;
  recentSessionLength: number;
  lastStatusReason: string;
  scheduledStatusFreq: number;
  lastStatusTime: Date;
  BEVer: string;
  FEVer: string;
  HWVer: string;
  sessionStartTime: Date;
  SN: string;
  readerKeyCycle: number;
  pairTime?: Date
  targetFirmwareVersion?: string
}

export interface MakerspaceWelcomeReaderRow {
  makerspaceID: number;
  readerID: number;
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
  archived: boolean;
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

export interface ModulesForRoomsRow {
  roomID: number;
  moduleID: number;
}

export interface ModulesForMakerspacesRow {
  makerspaceID: number;
  moduleID: number;
}

export interface SpecialHoursRow {
  day: Date;
  makerspaceID: number;
  open: String | null;
  close: String | null;
  closed: boolean;
}

export interface DefaultHoursRow {
  dayOfWeek: number;
  makerspaceID: number;
  open: String | null;
  close: String | null;
  closed: boolean;
}

export interface CurrencyAccountsRow {
  id: number;
  balance: number; // Cents
}

export interface OrganizationsRow {
  id: number;
  username: string;
  displayname: string;
  accountID: number;
}

export interface CurrencyLedgerRow {
  id: number;
  dateTime: Date;
  accountID: number | null;
  owner: string;
  amount: number;
  source: string;
  description: string;
  atxID: number;
  refID: number
}

export interface RefIDCounterRow {
  refID: number;
}

export interface TempRolesRow {
  name: string;
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
    MakerspaceWelcomeReaders: MakerspaceWelcomeReaderRow;
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
    ModulesForRooms: ModulesForRoomsRow;
    ModulesForMakerspaces: ModulesForMakerspacesRow;
    SpecialHours: SpecialHoursRow;
    DefaultHours: DefaultHoursRow;
    CurrencyAccounts: CurrencyAccountsRow;
    Organizations: OrganizationsRow;
    CurrencyLedger: CurrencyLedgerRow;
    RefIDCounter: RefIDCounterRow;
    RolesTemp: TempRolesRow;
  }
}
