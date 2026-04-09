/**
 * tables.ts
 * 
 * This contains the definitions for the objects every knex select operation will map to.
 */

import { DispenserError } from "../api/devices/cards/cardApi.js";
import { CurrencySource, CurrencyType } from "../integrations/currency/types.js";
import { ACSDeployment } from "../models/ACS/deployment.js";
import { CoreFlags } from "../models/api/ACSFormats.js";

/**
 * Audit logs are automatically made reports of various actions on the server and by machine activations.
 * @var id *PRIMARY KEY*
 * @var dateTime the time that the report is for
 * @var message the description of what occured
 * @var category the category of the message. Can be anything but there are special checkboxes/visualizations for some values.
 * Those special categories can be seen in @file(AuditLogRow.tsx)
 */
export interface AuditLogRow {
  id: number;
  dateTime: Date;
  message: string;
  category: string;
  makerspaceID: number | undefined;
}
/**
 * A description of a piece of equipment.
 * Equipment is a piece of machinery that can be activated by a card reader, used, or reserved
 * There can be multiple instances of a piece of an equipment per makerspace. (A machine shop has a 3 of the same type of lathe).
 * The descriptions of an instance are described by an EquipmentInstanceRow which references the equipment
 */
export interface EquipmentRow {
  /**  Primary Key */
  id: number;
  /** human readable name of the equipment */
  name: string;
  /** date the equipment was added to the system */
  addedAt: Date;
  /** *UNUSED. TODO SHOULD BE REMOVED*  */
  inUse: boolean;
  /** 
   * what room this type of equipment resides in. 
   * NOTE: If you have 2 different rooms, you can not share equipment between them. You would need separate entries for the equipment in either room 
   */
  roomID: number;
  /** If the equipment is not in use and should not be shown to users */
  archived: boolean;
  /** image identifier for the CDN */
  imageUrl: string;
  /** URL to the documentation for how to use this equipment */
  sopUrl: string;
  /** Brief description of the equipment to inform users */
  notes: string;
  /** Whether or not you need to make a reservation with the shop supervisors to use this equipment */
  byReservationOnly: boolean;
  /** Whether or not a user must sign into a makerspace in order to use this equipment */
  needsWelcome?: boolean;
  /** If a piece of equipment is suffeciently complicated, you can designate trainers to teach people how to use the machine. */
  requiresTrainerApproval: boolean;
  /** Whether a piece of equipment requires an in person knowledge check to be completed before allowing access */
  requiresInPerson: boolean;
  /** Whether or not a piece of equipment can be reserved */
  schedulable: boolean;
  /** The URL to send people to when they click on the sign-off card */
  signOffUrl: string;
  /** The subname that appears under the main name */
  subName: string;
}

/**
 * A specific instance of an Equipment
 */
export interface EquipmentInstancesRow {
  /** Primary Key */
  id: number;
  /** FK to the Equipment that this instance is a type of */
  equipmentID: number;
  /** Human readable description of this instance to distinguish it from other instances */
  name: string;
  /** The state of the equipment, ACTIVE,RETIRED,NEEDS_REPAIRED, etc. */
  status: string;
  /** Optional FK of the card reader associated with this instance */
  accessControllerID: number | null
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

/**
 * A record of a quiz submission.
 * Note, this table does not control access to equipment. Rather, the AccessChecks and PassedModules tables record successful In-person checks (staff sign-offs) and Non-expired trainings respectively
 * PassedModules records trainings that have not expired (It is kept up to date by purging expired trainings)
 * ModuleSubmissions records all quiz attempts forever
 * AccessChecks records in person competency checks
 */
export interface ModuleSubmissionRow {
  /** Primary Key */
  id: number;
  /** Which training module this submission is for */
  moduleID: number;
  /** FK:User that submitted this training */
  makerID: number;
  /** When the trainin was submitted */
  submissionDate: Date;
  /** Whether or not the user passed the training */
  passed: boolean;
  /** The date that this training will expire and the user will have to retake it */
  expirationDate: Date;
  /** A JSON description of the quiz answers */
  summary: string;
}

/**
 * Join table denoting which modules need to be passed for which equipment
 */
export interface ModulesForEquipmentRow {
  /** Primary Key */
  id: number;
  /** FK:Equipment */
  equipmentID: number;
  /** FK:TrainingModules */
  moduleID: number;
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
  makerspaceID: number | null;
}

/**
 * Arbitrary data points to keep track of
 * Should be used sparingly
 */
export interface DataPointsRow {
  /** Primary Key */
  id: number;
  /** Key to identify the data with */
  label: string;
  /** Value of the data */
  value: number;
}

/**
 * A Quiz/TrainingModule for a user to take
 * Linked to Equipment using ModulesForEquipment join table
 */
export interface TrainingModuleRow {
  /** Primary Key */
  id: number;
  /** Human readable name describing this training module */
  name: string;
  /** The quiz questions and answers (Stored as JSON) */
  quiz: TrainingModuleItem[];
  archived: boolean;
  /** @deprecated, DONT USE */
  reservationPrompt: ReservationPrompt;
  /** FK:Makerspace this training applies to (optional) */
  makerspaceID: number | null;
}

// not a table but the json structure for a column on the table above
export interface TrainingModuleItem {
  id: string;
  type: string;
  text: string;
  options?: ModuleItemOption[];
  correctAnswers?: number;
  hint: string;
  affirmation: string;
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

/**
 * Describes information about a user
 * The current user is a superset of this. See auth.ts/context.ts
 */
export interface UserRow {
  /** Primary Key */
  id: number;
  /** First name of user, returned by shib */
  firstName: string;
  /** Last name of user, returned by shib */
  lastName: string;
  /** Pronouns of user, asked by make */
  pronouns: string;
  /** Date that the user joined make */
  registrationDate: Date;
  /** Date that the user says they will graduate (self reported, not verified or anything) */
  expectedGraduation: string;
  /** RIT College Code (GCCIS, CAD, etc.) */
  college: string;
  /** Whether or not the user has completely gone through setup yet */
  setupComplete: boolean;
  /** the username used to identify a person through shib/email */
  ritUsername: string;
  /** An archived user is a user who at one point had access to make/machine shops but has since graduated and lost access*/
  archived: boolean;
  /** The RFID Unique ID used to identify a user at a card reader */
  cardTagID: string;
  /** Notes provided by staff to help other staff */
  notes: string;
  activeHold: boolean;
  admin: boolean;
  accountID: number;
  /** A string defining the atrium token used to charge this user for store purchases, 3d prints and anything else */
  atriumToken: string | null;
  /** How to handle a user archiving
   * null: Use role allowlist to archive/unarchive (Staff,Student get access, everything else doesnt)
   * true: force archive no matter what role the user has
   * false: never archive no matter what role the user has
   */
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
  deviceID: number;
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

/**
 * Store of in person competency checks for equipment
 * This is added on top of TrainingModules
 * to use equipment, you must complete all trainings
 * That then generates an AccessCheck which makerspace 
 * Staff can approve if you pass the in person check
 */
export interface AccessCheckRow {
  /** Primary Key */
  id: number;
  /** User this applies to */
  userID: number;
  /** Equipment this applies to */
  equipmentID: number;
  /** The date that this check became available */
  readyDate: Date;
  /** Whether or not the user has passed the check */
  approved: boolean;
}

/**
 * A Makerspace
 * A specific makerspace within the system
 * A Makerspace can have multiple Rooms inside of it containing specific equipment
 */
export interface MakerspaceRow {
  /** Primary Key */
  id: number;
  /** A human readable name for the makerspace */
  name: string;
  /** Quick blurb explaining what happens in this makerspace */
  subtitle: string | null;
  /** Room code for the makerspace */
  location: string | null;
  /** Longer description of makerspace */
  description: string
  /** Link to the documentation page for this makerspace */
  docsLink: string;
  /** CDN Image Identifier */
  imageUrl: string;
  /** If true, this makerspace is out of use and can't be visited. It is effecively deleted  */
  archived: boolean;
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

/**
 * Table describing which users are Managers (of makerspaces)
 */
export interface ManagerRow {
  userID: number;
  makerspaceID: number;
}

/**
 * Table describing which users are Staff (of makerspaces)
 */
export interface StaffRow {
  /** FK:Users */
  userID: number;
  /** FK:Makerspace */
  makerspaceID: number;
}

/** 
 * Table describing which users are Trainers (for equipment)
 */
export interface TrainerRow {
  /** FK:Users */
  userID: number;
  /** FK:Equipment */
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

/**
 * Table recording if a user passed a training and it has not expired
 * This table is the mechanism by which trainings expire. 
 * If its not here, that user can't use the machine
 * PassedModules records trainings that have not expired (It is kept up to date by purging expired trainings)
 * ModuleSubmissions records all quiz attempts forever
 * AccessChecks records in person competency checks
 */
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
  open: string | null;
  close: string | null;
  closed: boolean;
}

export interface DefaultHoursRow {
  dayOfWeek: number;
  makerspaceID: number;
  open: string | null;
  close: string | null;
  closed: boolean;
}

/**
 * "Bank" Account for a user/organization
 * This ONLY records ConstructCredits, not any outside currency
 */
export interface CurrencyAccountsRow {
  /** Primary Key */
  id: number;
  /** Amount of ConstructCredits available IN CENTS*/
  balance: number; // Cents
}

/**
 * An organization is a group that can use the makerspace or purchase goods and services
 * Examples of these are University Clubs or Research Groups 
 */
export interface OrganizationsRow {
  /** Primary Key */
  id: number;
  /** RIT Username of the organization */
  username: string;
  /** Human readable name for the organization */
  displayname: string;
  /** Notes about the organization for staff */
  notes: string;
  /** Corresponding account for this groups money */
  accountID: number;
}

export interface CurrencyLedgerRow {
  /** Primary Key */
  id: number;
  /** Transaction Time */
  dateTime: Date;
  /** Make AcountID this applied against */
  accountID: number | null;
  /** Type of currency this transaction used */
  currencyType: CurrencyType;
  /** ritUsername type string that this was applied against */
  owner: string;
  /** the transaction entry that this exchange of money corresponsd to */
  transactionEntryId: number;
  /** Human readable description of the transaction */
  description: string;
  /** 
   * The amount exchanged 
   * Positive: Add money to the users account (refund)
   * Negative: Remove money from the users account (charge)
   */
  amount: number;
  /** Atrium Transaction ID (only for Atrium transactions) */
  atxID: number | null;
  /** Atrium Ref ID (only for Atrium transactions) */
  refID: number | null
}

/**
 * Top level holder for transactions
 * Describes what/why/for who the transaction exists
 * TransactionEntries describe the individual exchanges of money that make up the transaction
 * CurrencyLedger records money changing hands
 */
export interface TransactionRow {
  /** Primary Key */
  id: number,
  /** The time that the transaction was begun */
  dateTime: Date;
  /** Account that this transaction is against */
  accountID: number,
  /** Origin of the transaction */
  origin: CurrencySource,
  /** description of the transaction */
  description: { text: string, data: unknown },
  /** Original outstanding charge. This should be taken into account and charged accordingly on the first exchange of money. Then it is set to 0 */
  outstandingCharge: number,
  /** Printer Job that this transaction will be applied for */
  printerJobId: number | null;
}

export interface TransactionEntryRow {
  /** Primary Key */
  id: number,
  /** Date that this was processed */
  dateTime: Date;
  /** Transaction that this entry corresponds to */
  transactionID: number,
  /** 
   * The change in price to the transaction
   * sum(transaction->entries.amount) = the amount already charged to the account
   * sum(transactionEntry->ledgerEntries.amount) = transactionEntry.amount
   */
  amount: number,
  /** Description of the entry. Why did the price change */
  description: string,
};


/** 'Fake' Table used to atomically generate IDs for Atrium Transactions */
export interface RefIDCounterRow {
  refID: number;
}

export interface TempRolesRow {
  name: string;
}

/**
 * Row to keep track of user sessions across server restarts
 * See PostgresStore in auth.ts 
 * and
 * https://expressjs.com/en/resources/middleware/session.html
 */
export interface ExpressSessionRow {
  sid: string;
  session: string;
}

export interface CustomUrlRow {
  id: number;
  shortUrl: string;
  longUrl: string;
}

export interface ReservationRow {
  id: number;
  equipmentID: number;
  userID: number;
  description: string;
  approved: boolean;
  start: string; // ISO 8601 date string, gotten via Date.toISOString()
  end: string; // ^
}

export enum MaintenanceTicketType {
  AUTOMATIC = "AUTOMATIC",
  REPORTED = "REPORTED"
}

export enum MaintenanceTicketSeverity {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW"
}

export enum MaintenanceTicketStatus {
  UPCOMING = "UPCOMING",
  TODO = "TODO",
  IN_PROGESS = "IN_PROGRESS",
  CLOSED = "CLOSED"
}

export interface MaintenanceTicketRow {
  id: number;
  type: MaintenanceTicketType;
  severity: MaintenanceTicketSeverity;
  status: MaintenanceTicketStatus;
  instanceID: number;
  userID: number | undefined;
  description: string;
  imageUrl: string | null;
  dateCreated: string; // ISO 8601 date string, gotten via Date.toISOString()
  dateClosed: string | null; // ^
  intervalHours: number | null;
  assignedID: number | null;
}

export interface TempCardRow {
  id: number;
  userID: number;
  cardTagID: string;
  issuedDate: number; // timestamp, but gets returned from the DB as a number
  returnedDate: number; // ^
}

export interface InventoryItemTagRelationsRow {
  itemID: number;
  tagID: number;
}

export interface DeviceRow {
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

export enum CoreInputMode {
  INSERT = "INSERT",
  TEMP_PRESENT = "TEMP_PRESENT",
  TEMP_REMOVE = "TEMP_REMOVE",
  TOGGLE = "TOGGLE"
}

export interface CoreRow {
  deviceID: number;
  channels: number;
  inputMode: CoreInputMode;
  tempDuration: number;
  currentCardTag: string | undefined;
  lastStatusTime: Date | undefined;
  sessionStartTime: Date | undefined;
  flags: CoreFlags;
  sealedDeployment: ACSDeployment | undefined;
  reportedDeployment: ACSDeployment | undefined;
}

export enum AccessControllerState {
  IDLE = "IDLE",
  UNLOCKED = "UNLOCKED",
  ALWAYS_ON = "ALWAYS_ON",
  LOCKED_OUT = "LOCKED_OUT",
  FAULT = "FAULT",
  WELCOMING = "WELCOMING"
}

export interface AccessControllerRow {
  id: number;
  deviceID: number;
  channelID: number;
  state: AccessControllerState;
  tempDuration: number;
}

export interface DispenserRow {
  deviceID: number;
  cardsLeft: number;
  error: DispenserError;
}

export enum DeviceLogSeverity {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW"
}

export interface DeviceLogRow {
  id: number;
  dateTime: Date;
  deviceID: number | undefined;
  severity: DeviceLogSeverity;
  log: object;
}

export interface UnlockAttemptLogRow {
  id: number;
  dateTime: Date;
  equipmentID: number | undefined;
  equipmentName: string;
  userID: number | undefined;
  username: string;
  success: boolean;
  reason: string;
}

export interface FirmwareLocationRow {
  hardwareVersion: string;
  firmwareURL: string;
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
    Makerspaces: MakerspaceRow;
    DataPoints: DataPointsRow;
    EquipmentSessions: EquipmentSessionRow;
    InventoryLedger: InventoryLedgerRow;
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
    Transactions: TransactionRow;
    TransactionEntries: TransactionEntryRow;
    RefIDCounter: RefIDCounterRow;
    RolesTemp: TempRolesRow;
    ExpressSessions: ExpressSessionRow;
    CustomURLs: CustomUrlRow;
    MaintenanceTickets: MaintenanceTicketRow;
    TemporaryCards: TempCardRow;
    InventoryItemTagRelations: InventoryItemTagRelationsRow;
    Devices: DeviceRow;
    Cores: CoreRow;
    AccessControllers: AccessControllerRow;
    Dispensers: DispenserRow;
    DeviceLogs: DeviceLogRow;
    UnlockAttemptLogs: UnlockAttemptLogRow;
    FirmwareLocations: FirmwareLocationRow;
  }
}
