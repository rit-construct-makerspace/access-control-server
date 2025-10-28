/**
 * maintenanceLogsResolver.ts
 * GraphQL Endpoint implementations for MaintenanceLogs, ResolutionLogs, and MaintenanceTags
 */

import { ApolloContext, CurrentUser } from "../context.js";
import * as UsersRepo from "../repositories/Users/UserRepository.js";
import { createLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import { getUsersFullName } from "../repositories/Users/UserRepository.js";
import { MaintenanceLogRow, MaintenanceTagRow } from "../db/tables.js";
import { getEquipmentByID } from "../repositories/Equipment/EquipmentRepository.js";
import { createMaintenanceLog, createMaintenanceTag, createResolutionLog, deleteMaintenanceLog, deleteMaintenanceTag, deleteResolutionLog, getMaintenanceLogByID, getMaintenanceLogsByEquipment, getMaintenanceTagByID, getMaintenanceTags, getMaintenanceTagsByEquipmentOrGlobal, getResolutionLogByID, getResolutionLogsByEquipment, updateMaintenanceLog, updateMaintenanceTag, updateResolutionLog } from "../repositories/Equipment/MaintenanceLogRepository.js";
import { GraphQLError } from "graphql";
import { getInstanceByID } from "../repositories/Equipment/EquipmentInstancesRepository.js";
import { notifyMachineIssueCreated } from "../slack/slack.js";

const MaintenanceLogsResolver = {
  MaintenanceLog: {
    //Map author field to User
    author: async (
      parent: MaintenanceLogRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user: CurrentUser) => {
        return UsersRepo.getUserByID(parent.authorID);
      }),

    //Map equipment field to Equipment
    equipment: async (
      parent: MaintenanceLogRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => parent.equipmentID && getEquipmentByID(parent.equipmentID)
      ),

    //Map instance field to EquipmentInstance
    instance: async (
      parent: MaintenanceLogRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => parent.instanceID && getInstanceByID(parent.instanceID)
      ),

    //Map tag1 field to MaintenanceTag
    tag1: async (
      parent: MaintenanceLogRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => parent.tagID1 && getMaintenanceTagByID(parent.tagID1)
      ),

    //Map tag2 field to MaintenanceTag
    tag2: async (
      parent: MaintenanceLogRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => parent.tagID2 && getMaintenanceTagByID(parent.tagID2)
      ),

    //Map tag3 field to MaintenanceTag
    tag3: async (
      parent: MaintenanceLogRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => parent.tagID3 && getMaintenanceTagByID(parent.tagID3)
      ),
  },

  ResolutionLog: {
    //Map author field to User
    author: async (
      parent: MaintenanceLogRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user: CurrentUser) => {
        return UsersRepo.getUserByID(parent.authorID);
      }),

    //Map equipment field to Equipment
    equipment: async (
      parent: MaintenanceLogRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => parent.equipmentID && getEquipmentByID(parent.equipmentID)
      ),

    //Map instance field to EquipmentInstance
    instance: async (
      parent: MaintenanceLogRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => parent.instanceID && getInstanceByID(parent.instanceID)
      ),

    //Map tag1 field to MaintenanceTag
    tag1: async (
      parent: MaintenanceLogRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => parent.tagID1 && getMaintenanceTagByID(parent.tagID1)
      ),

    //Map tag2 field to MaintenanceTag
    tag2: async (
      parent: MaintenanceLogRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => parent.tagID2 && getMaintenanceTagByID(parent.tagID2)
      ),

    //Map tag3 field to MaintenanceTag
    tag3: async (
      parent: MaintenanceLogRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => parent.tagID3 && getMaintenanceTagByID(parent.tagID3)
      ),
  },

  MaintenanceTag: {
    //Map equipment field to Equipment
    equipment: async (
      parent: MaintenanceTagRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => parent.equipmentID && getEquipmentByID(parent.equipmentID)
      ),
  },

  Query: {
    /**
     * Fetch all MaintenanceLogs associated with an Equipment
     * @argument equipmentID ID of Equipment to filter by
     * @returns all matching MaintenanceLogs
     */
    getMaintenanceLogsByEquipment: async (
      _parent: any,
      args: { equipmentID: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => getMaintenanceLogsByEquipment(args.equipmentID)
      ),

    /**
     * Fetch all ResolutionLogs associated with an Equipment
     * @argument equipmentID ID of Equipment to filter by
     * @returns all matching ResolutionLogs
     */
    getResolutionLogsByEquipment: async (
      _parent: any,
      args: { equipmentID: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => getResolutionLogsByEquipment(args.equipmentID)
      ),

    /**
     * Fetch all MaintenanceTags optionally associated with an Equipment
     * @argument equipmentID ID of Equipment to filter by
     * @returns all MaintenanceTags where equipmentID equals provided or is NULL
     */
    getMaintenanceTags: async (
      _parent: any,
      args: {equipmentID?: number},
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => {
          return !args.equipmentID ? getMaintenanceTags() : getMaintenanceTagsByEquipmentOrGlobal(args.equipmentID)
        }
      ),

    /**
     * Fetch MaintenanceTag by ID
     * @argument id ID of MaintenanceTag
     * @returns MaintenanceTag
     */
    getMaintenanceTagByID: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => getMaintenanceTagByID(args.id)
      ),
  },

  Mutation: {
    /**
     * Create a MaintenanceLog
     * @argument equipmentID ID of associated Equipment
     * @argument instanceID ID of associated EquipmentInstance if defined
     * @argument content Issue description
     * @returns MaintenanceLog
     */
    createMaintenanceLog: async (
      _parent: any,
      args: { equipmentID: number, instanceID?: number, content: string },
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => {
          await createLog(`{user} created a maintenance log for {equipment}`, "admin", { id: user.id, label: getUsersFullName(user) }, { id: args.equipmentID, label: (await getEquipmentByID(args.equipmentID)).name });
          const result = await createMaintenanceLog(user.id, args.equipmentID, args.instanceID == 0 ? undefined : args.instanceID, args.content);
          await notifyMachineIssueCreated(args.equipmentID, args.instanceID, args.content)
          return result;
        }
      ),

    /**
     * Create a ResolutionLog
     * @argument equipmentID ID of associated Equipment
     * @argument instanceID ID of associated EquipmentInstance if defined
     * @argument content Issue description
     * @returns ResolutionLog
     */
    createResolutionLog: async (
      _parent: any,
      args: { equipmentID: number, instanceID?: number, issue: string, content: string },
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => {
          await createLog(`{user} created a resolution log for {equipment}`, "admin", { id: user.id, label: getUsersFullName(user) }, { id: args.equipmentID, label: (await getEquipmentByID(args.equipmentID)).name });
          return createResolutionLog(user.id, args.equipmentID, ((!args.instanceID && args.instanceID != 0) ? undefined : args.instanceID), args.issue, args.content);
        }
      ),

    /**
     * Delete a MaintenanceLog
     * @argument id ID of MaintennaceLog to delete
     * @returns true
     */
    deleteMaintenanceLog: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => {
          const equipment = await getMaintenanceLogByID(args.id);
          if (!equipment) throw new GraphQLError("Equipment does not exist");
          await createLog(`{user} deleted a maintenance log from {equipment}`, "admin", { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: (await getEquipmentByID(equipment.equipmentID)).name });
          return deleteMaintenanceLog(args.id);
        }
      ),

    /**
     * Delete a ResolutionLog
     * @argument id ID of ResolutionLog to delete
     * @returns true
     */
    deleteResolutionLog: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => {
          const equipment = await getResolutionLogByID(args.id);
          if (!equipment) throw new GraphQLError("Equipment does not exist");
          await createLog(`{user} deleted a resolution log from {equipment}`, "admin", { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: (await getEquipmentByID(equipment.equipmentID)).name });
          return deleteResolutionLog(args.id);
        }
      ),

    /**
     * Create a MaintenanceTag
     * @argument equipmentID ID of equipment to restrict tag to (or undefined if Global)
     * @argument label Tag label
     * @argument color Tag ReactJS color type
     * @returns true
     */
    createMaintenanceTag: async (
      _parent: any,
      args: { equipmentID?: number, label: string, color: string },
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => {
          await createLog(`{user} created a maintenance tag "${args.label}"`, "admin", { id: user.id, label: getUsersFullName(user) });
          return createMaintenanceTag(args.equipmentID ?? null, args.label, args.color);
        }
      ),

    /**
     * Delete a MaintenanceTag
     * @argument id ID of MaintenanceTag to delete
     * @returns true
     */
    deleteMaintenanceTag: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => {
          const orig = await getMaintenanceTagByID(args.id);
          if (!orig) throw new GraphQLError("Tag does not exist");
          await createLog(`{user} deleted a maintenance tag "${orig.label}"`, "admin", { id: user.id, label: getUsersFullName(user) });
          return deleteMaintenanceTag(args.id);
        }
      ),

    /**
     * Update a MaintenanceTag
     * @argument id ID of MaintenanceTag to modify
     * @argument label new Tag label
     * @argument color new Tag ReactJS color type
     * @returns true
     */
    updateMaintenanceTag: async (
      _parent: any,
      args: { id: number, label?: string, color?: string },
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user) => {
          const orig = await getMaintenanceTagByID(args.id);
          if (!orig) throw new GraphQLError("Tag does not exist");
          await createLog(`{user} updated a maintenance tag "${orig.label}"`, "admin", { id: user.id, label: getUsersFullName(user) });
          return updateMaintenanceTag(args.id, args.label ?? orig.label, args.color ?? orig.color);
        }
      ),

    /**
     * Add a Tag to a MaintenanceLog or ResolutionLog
     * @argument id ID of log to modify
     * @argument tagId ID of tag to add
     * @argument logType if "resolution", attempt to modify ResolutionLog, otherwise MaintenanceLog
     * @returns updated MaintenanceLog or ResolutionLog
     */
    addTagToLog: async (
      _parent: any,
      args: { logId: number, tagId: number, logType: string },
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => {
          const log: any = args.logType == "resolution" ? await getResolutionLogByID(args.logId) : await getMaintenanceLogByID(args.logId);
          if (!log) throw new GraphQLError("Log does not exist");
          const tag = await getMaintenanceTagByID(args.tagId);
          if (!tag) throw new GraphQLError("Tag does not exist");
          const equipment = await getEquipmentByID(log.equipmentID);

          var tag1 = log.tagID1, tag2 = log.tagID2, tag3 = log.tagID3;
          if (!tag1) {
            tag1 = args.tagId;
          } else if (!tag2) {
            tag2 = args.tagId;
          } else if (!tag3) {
            tag3 = args.tagId;
          } else {
            throw new GraphQLError("Maximum of 3 tags on entry has been reached.")
          }

          await createLog(`{user} added tag "${tag.label}" to ${args.logType ?? "maintenance"} log (ID ${log.id}) on {equipment}`, "admin", { id: user.id, label: getUsersFullName(user) }, { id: log.equipmentID, label: equipment.name });
          return args.logType != "resolution" ? updateMaintenanceLog(log.id, log.content, tag1, tag2, tag3) : updateResolutionLog(log.id, log.content, log.issue, tag1, tag2, tag3);
        }
      ),

    /**
     * Remove a Tag from a MaintenanceLog or ResolutionLog
     * @argument id ID of log to modify
     * @argument tagId ID of tag to remove
     * @argument logType if "resolution", attempt to modify ResolutionLog, otherwise MaintenanceLog
     * @returns updated MaintenanceLog or ResolutionLog
     */
    removeTagFromLog: async (
      _parent: any,
      args: { logId: number, tagId: number, logType: string },
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => {
          const log: any = args.logType == "resolution" ? await getResolutionLogByID(args.logId) : await getMaintenanceLogByID(args.logId);
          if (!log) throw new GraphQLError("Log does not exist");
          const tag = await getMaintenanceTagByID(args.tagId);
          if (!tag) throw new GraphQLError("Tag does not exist");
          const equipment = await getEquipmentByID(log.equipmentID);

          var tag1: any = log.tagID1, tag2: any = log.tagID2, tag3: any = log.tagID3;
          if (tag1 == args.tagId) {
            tag1 = null;
          } else if (tag2 == args.tagId) {
            tag2 = null;
          } else if (tag3 == args.tagId) {
            tag3 = null;
          } else {
            throw new GraphQLError("Tag is not referenced on entry.")
          }

          await createLog(`{user} removed tag "${tag.label}" from ${args.logType ?? "maintenance"} log (ID ${log.id}) on {equipment}`, "admin", { id: user.id, label: getUsersFullName(user) }, { id: log.equipmentID, label: equipment.name });
          return args.logType != "resolution" ? updateMaintenanceLog(log.id, log.content, tag1, tag2, tag3) : updateResolutionLog(log.id, log.issue, log.content, tag1, tag2, tag3);
        }
      ),
  },
};

export default MaintenanceLogsResolver;
