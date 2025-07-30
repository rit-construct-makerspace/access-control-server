import {
  DateTimeResolver,
  DateTimeTypeDefinition,
  JSONResolver,
} from "graphql-scalars";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { AnnouncementsTypeDefs } from "./schemas/announcementsSchema.js";
import { mergeResolvers } from "@graphql-tools/merge";
import { TrainingModuleTypeDefs } from "./schemas/trainingModuleSchema.js";
import { TrainingSubmissionTypeDefs } from "./schemas/trainingSubmissionSchema.js";
import { StoreFrontTypeDefs } from "./schemas/storeFrontSchema.js";
import { ReservationsTypeDefs } from "./schemas/reservationsSchema.js";
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
import ZoneHoursResolver from "./resolvers/zoneHoursResolver.js";
import { ZoneHoursTypeDefs } from "./schemas/zoneHoursSchema.js";
import ZonesResolver from "./resolvers/zonesResolver.js";
import { ZonesTypeDefs } from "./schemas/zonesSchema.js";
import { DataPointsTypeDefs } from "./schemas/dataPointsSchema.js";
import DataPointsResolver from "./resolvers/dataPointResolver.js";
import PermissionResolver from "./resolvers/permissionResolver.js";
import { PermissionTypeDefs } from "./schemas/permissionSchema.js";
import { StatisticQueryTypeDefs } from "./schemas/statisticQuerySchema.js";
import StatisticQueryResolver from "./resolvers/statisticQueryResolver.js";
import { EquipmentSessionTypeDefs } from "./schemas/equipmentSessionsSchema.js";
import EquipmentSessionsResolver from "./resolvers/equipmentSessionsResolver.js";
import { EventsTypeDefs } from "./schemas/eventsSchema.js";
import { EventsResolver } from "./resolvers/eventsResolver.js";
import { TermsTypeDefs } from "./schemas/TermsSchema.js";
import TermsResolver from "./resolvers/termsResolver.js";
import { MaintenanceLogsTypeDefs } from "./schemas/maintenanceLogSchema.js";
import MaintenanceLogsResolver from "./resolvers/maintenanceLogsResolver.js";
import { EquipmentInstanceTypeDefs } from "./schemas/equipmentInstanceSchema.js";
import EquipmentInstanceResolver from "./resolvers/equipmentInstanceResolver.js";
import { ToolItemTypeDefs } from "./schemas/toolItemsSchema.js";
import ToolItemResolver from "./resolvers/toolItemResolver.js";
import { TrainingHoldsTypeDefs } from "./schemas/trainingHoldsSchema.js";
import { TrainingHoldResolver } from "./resolvers/trainingHoldResolver.js";
import { RestrictionTypeDefs } from "./schemas/restrictionSchema.js";
import { RestrictionResolver } from "./resolvers/restrictionResolver.js";
import { CurrencyAccountResolvers } from "./resolvers/currencyAccountResolver.js"

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
    ReservationsTypeDefs,
    DateTimeTypeDefinition,
    RoomTypeDefs,
    AuditLogsTypeDefs,
    CalendarEventsTypeDefs,
    AnnouncementsTypeDefs,
    ReaderTypeDefs,
    AccessCheckTypeDefs,
    ZonesTypeDefs,
    ZoneHoursTypeDefs,
    DataPointsTypeDefs,
    PermissionTypeDefs,
    StatisticQueryTypeDefs,
    EquipmentSessionTypeDefs,
    EventsTypeDefs,
    TermsTypeDefs,
    MaintenanceLogsTypeDefs,
    ToolItemTypeDefs,
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
    ZonesResolver,
    ZoneHoursResolver,
    DataPointsResolver,
    PermissionResolver,
    StatisticQueryResolver,
    EquipmentSessionsResolver,
    EventsResolver,
    TermsResolver,
    MaintenanceLogsResolver,
    ToolItemResolver,
    RestrictionResolver,
    CurrencyAccountResolvers
  ]
});
