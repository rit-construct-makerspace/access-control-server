import {
  DateTimeResolver,
  DateTimeTypeDefinition,
  JSONResolver,
} from "graphql-scalars";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { AnnouncementsTypeDefs } from "./schemas/announcementsSchema.js";
import { TrainingModuleTypeDefs } from "./schemas/trainingModuleSchema.js";
import { TrainingSubmissionTypeDefs } from "./schemas/trainingSubmissionSchema.js";
import { StoreFrontTypeDefs } from "./schemas/storeFrontSchema.js";
import { UsersTypeDefs } from "./schemas/usersSchema.js";
import { HoldsTypeDefs } from "./schemas/holdsSchema.js";
import { EquipmentTypeDefs } from "./schemas/equipmentSchema.js";
import { RoomTypeDefs } from "./schemas/roomsSchema.js";
import { AuditLogsTypeDefs } from "./schemas/auditLogsSchema.js";
import { CalendarEventsTypeDefs } from "./schemas/calendarEventsSchema.js";
import trainingModuleResolvers from "./resolvers/trainingModuleResolver.js";
import trainingSubmissionsResolvers from "./resolvers/trainingSubmissionResolver.js";
import storefrontResolvers from "./resolvers/storeFrontResolver.js";
import roomsResolver from "./resolvers/roomsResolver.js";
import EquipmentResolvers from "./resolvers/equipmentResolver.js";
import usersResolver from "./resolvers/usersResolver.js";
import auditLogsResolver from "./resolvers/auditLogsResolver.js";
import holdsResolver from "./resolvers/holdsResolver.js";
import AnnouncementsResolver from "./resolvers/announcementsResolver.js";
import { ReaderTypeDefs } from "./schemas/readersSchema.js";
import ReadersResolver from "./resolvers/readersResolver.js";
import { AccessCheckTypeDefs } from "./schemas/accessChecksSchema.js";
import AccessChecksResolver from "./resolvers/accessChecksResolver.js";
import MakerspaceHoursResolver from "./resolvers/makerspaceHoursResolver.js";
import { MakerspaceHoursTypeDefs } from "./schemas/makerspaceHoursSchema.js";
import MakerspacesResolver from "./resolvers/makerspaceResolver.js";
import { MakerspacesTypeDefs } from "./schemas/makerspacesSchema.js";
import { DataPointsTypeDefs } from "./schemas/dataPointsSchema.js";
import DataPointsResolver from "./resolvers/dataPointResolver.js";
import PermissionResolver from "./resolvers/permissionResolver.js";
import { PermissionTypeDefs } from "./schemas/permissionSchema.js";
import { EquipmentSessionTypeDefs } from "./schemas/equipmentSessionsSchema.js";
import EquipmentSessionsResolver from "./resolvers/equipmentSessionsResolver.js";
import { EventsTypeDefs } from "./schemas/eventsSchema.js";
import { EventsResolver } from "./resolvers/eventsResolver.js";
import { TermsTypeDefs } from "./schemas/TermsSchema.js";
import TermsResolver from "./resolvers/termsResolver.js";
import { EquipmentInstanceTypeDefs } from "./schemas/equipmentInstanceSchema.js";
import EquipmentInstanceResolver from "./resolvers/equipmentInstanceResolver.js";
import { ToolItemTypeDefs } from "./schemas/toolItemsSchema.js";
import ToolItemResolver from "./resolvers/toolItemResolver.js";
import { TrainingHoldsTypeDefs } from "./schemas/trainingHoldsSchema.js";
import { TrainingHoldResolver } from "./resolvers/trainingHoldResolver.js";
import { RestrictionTypeDefs } from "./schemas/restrictionSchema.js";
import { RestrictionResolver } from "./resolvers/restrictionResolver.js";
import { CurrencyAccountResolvers } from "./resolvers/currencyAccountResolver.js"
import { CurrencyAccountsTypeDefs } from "./schemas/currencyAccountSchema.js";
import { CartTypeDefs } from "./schemas/cartSchema.js";
import { CartResolver } from "./resolvers/cartResolver.js";
import { CurrencyLedgerResolvers } from "./resolvers/currencyLedgerResolver.js";
import { CurrencyLedgerTypeDefs } from "./schemas/currencyLedgerSchema.js";
import { OrganizationTypeDefs } from "./schemas/organizationsSchema.js";
import { OrganizationResolver } from "./resolvers/organizationsResolver.js";
import { CustomUrlTypeDef } from "./schemas/customUrlSchema.js";
import CustomUrlResolver from "./resolvers/customUrlResolver.js";
import ReservationResolver from "./resolvers/reservationResolver.js";
import { ReservationTypeDefs } from "./schemas/reservationSchema.js";

// for custom scalars such as Date
const resolveFunctions = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,
};

export const schema = makeExecutableSchema({
  typeDefs: [
    TrainingHoldsTypeDefs,
    RestrictionTypeDefs,
    UsersTypeDefs,
    HoldsTypeDefs,
    EquipmentTypeDefs,
    EquipmentInstanceTypeDefs,
    TrainingModuleTypeDefs,
    TrainingSubmissionTypeDefs,
    StoreFrontTypeDefs,
    DateTimeTypeDefinition,
    RoomTypeDefs,
    AuditLogsTypeDefs,
    CalendarEventsTypeDefs,
    AnnouncementsTypeDefs,
    ReaderTypeDefs,
    AccessCheckTypeDefs,
    MakerspacesTypeDefs,
    MakerspaceHoursTypeDefs,
    DataPointsTypeDefs,
    PermissionTypeDefs,
    EquipmentSessionTypeDefs,
    EventsTypeDefs,
    TermsTypeDefs,
    ToolItemTypeDefs,
    CurrencyAccountsTypeDefs,
    CartTypeDefs,
    CurrencyLedgerTypeDefs,
    OrganizationTypeDefs,
    CustomUrlTypeDef,
    ReservationTypeDefs
  ],
  resolvers: [
    resolveFunctions,
    EquipmentResolvers,
    EquipmentInstanceResolver,
    trainingModuleResolvers,
    trainingSubmissionsResolvers,
    TrainingHoldResolver,
    storefrontResolvers,
    roomsResolver,
    usersResolver,
    holdsResolver,
    auditLogsResolver,
    AnnouncementsResolver,
    ReadersResolver,
    AccessChecksResolver,
    MakerspacesResolver,
    MakerspaceHoursResolver,
    DataPointsResolver,
    PermissionResolver,
    EquipmentSessionsResolver,
    EventsResolver,
    TermsResolver,
    ToolItemResolver,
    RestrictionResolver,
    CurrencyAccountResolvers,
    CartResolver,
    CurrencyLedgerResolvers,
    OrganizationResolver,
    CustomUrlResolver,
    ReservationResolver,
  ]
});
