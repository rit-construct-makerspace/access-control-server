/**
 * equipmentResolver.ts
 * GraphQL Endpoint Implementations for Equipment
 */

import * as EquipmentRepo from "../repositories/Equipment/EquipmentRepository.js";
import * as EquipmentInstanceRepo from "../repositories/Equipment/EquipmentInstancesRepository.js";
import * as RoomRepo from "../repositories/Rooms/RoomRepository.js";
import * as ModuleRepo from "../repositories/Training/ModuleRepository.js"
import { ApolloContext, CurrentUser } from "../context.js";
import { createUnassocaitedAuditLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import { getUsersFullName } from "../repositories/Users/UserRepository.js";
import { AccessControllerState, EquipmentRow } from "../db/tables.js";
import { EquipmentInput } from "../schemas/equipmentSchema.js";
import * as ACRepo from "../repositories/Devices/AccessControllerRepository.js";
import { GraphQLError } from "graphql";


const EquipmentResolvers = {

  Equipment: {
    //Map room field to Room
    room: async (parent: EquipmentRow) => {
      return await RoomRepo.getRoomByID(parent.roomID);
    },

    //Map trainingModules field to array of associated TrainingModules
    trainingModules: async (parent: EquipmentRow) => {
      return await EquipmentRepo.getModulesByEquipment(parent.id);
    },

    //Set numAvailable to number of ACS Readers that are Idle and responding
    numAvailable: async (parent: EquipmentRow) => {
      const instances = await EquipmentInstanceRepo.getInstancesByEquipment(parent.id);
      let avail = 0;
      for (let i = 0; i < instances.length; i++) {
        if (instances[i].accessControllerID === null || instances[i].accessControllerID === undefined) { continue; }
        let controller = await ACRepo.getAccessControllerByID(instances[i].accessControllerID ?? -1)
        if (controller === undefined) { continue; }
        if (controller.state === AccessControllerState.IDLE) { avail++; }
      }
      return avail;
    },

    //Set numInUse to number of ACS Readers that are NOT idle or are not responding
    numInUse: async (parent: EquipmentRow) => {
      const instances = await EquipmentInstanceRepo.getInstancesByEquipment(parent.id);
      let inUse = 0;
      for (let i = 0; i < instances.length; i++) {
        if (instances[i].accessControllerID === null || instances[i].accessControllerID === undefined) { continue; }
        let controller = await ACRepo.getAccessControllerByID(instances[i].accessControllerID ?? -1)
        if (controller === undefined) { continue; }
        if (controller.state !== AccessControllerState.IDLE) { inUse++; }
      }
      return inUse;
    },
  },


  Query: {
    /**
     * Fetch all published Equipment
     * @returns all published Equipment
     */
    equipments: async (_parent: any, _args: any, _context: any) => {
      return await EquipmentRepo.getEquipmentWhereArchived(false);
    },

    /**
     * Fetch specific Equipment
     * @returns Equipment
     */
    equipment: async (_parent: any, args: { id: string }, _context: any) => {
      return await EquipmentRepo.getEquipmentByID(Number(args.id));
    },

    /**
     * Fetch all archived/hidden Equipment
     * @returns all hidden Equipment
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    archivedEquipments: async (_parent: any, _args: any, { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return await EquipmentRepo.getEquipmentWhereArchived(true);
      }),

    /**
     * Fetch specific archived/hidden Equipment
     * @argument id ID of equipment
     * @returns Equipment
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    archivedEquipment: async (_parent: any, args: { id: string }, { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return await EquipmentRepo.getEquipmentByIDWhereArchived(Number(args.id), true);
      }),

    /**
     * Fetch specific Equipment
     * @argument id ID of equipment
     * @returns Equipment
     */
    anyEquipment: async (_parent: any, args: { id: string }, _context: any) => {
      return await EquipmentRepo.getEquipmentByID(Number(args.id));
    },

    /**
     * Fetch specific Equipment based on EITHER an equipment ID or by finding it based on the shlug id
     * @argument readerid the id of the corresponding reader, possibly null
     * @argument id ID of equipment, possibly null
     * @returns Equipment
     */
    correspondingEquipment: async (_parent: any, args: { readerid: number }, _context: any) => {
      const inst = await EquipmentInstanceRepo.getInstanceByAccessControllerID(args.readerid);
      if (!inst) {
        return null;
      }
      return await EquipmentRepo.getEquipmentByID(inst.equipmentID);
    },

    /**
     * Fetch all Equipment
     * @returns all Equipment
     */
    allEquipment: async (_parent: any, _args: any, _context: any) => {
      return await EquipmentRepo.getEquipment();
    },

  },

  Mutation: {
    /**
     * Create a new Equipment
     * @argument equipment Equipment Input
     * @returns new Equipment
     * @throws GraphQLError if not STAFF or is on hold
     */
    addEquipment: async (
      _parent: any,
      args: { equipment: EquipmentInput },
      { isManager }: ApolloContext
    ) =>
      isManager(async (user: CurrentUser) => {
        const room = await RoomRepo.getRoomByID(args.equipment.roomID);
        if (!user.manager.includes(room?.makerspaceID ?? -1) && !user.admin) {
          throw new GraphQLError(`No Privilege for Makerspace ${room?.makerspaceID ?? -1}`);
        }

        for (let i = 0; i < args.equipment.moduleIDs.length; i++) {
          const module = await ModuleRepo.getModuleByID(Number(args.equipment.moduleIDs[i]));
          if (module.archived) {
            throw new GraphQLError(`Cannot assign module ${args.equipment.moduleIDs[i]}`)
          }
        }

        const equipment = await EquipmentRepo.addEquipment(args.equipment);

        await createUnassocaitedAuditLog(
          "{user} created the {equipment} equipment.",
          "admin",
          { id: user.id, label: getUsersFullName(user) },
          { id: equipment.id, label: equipment.name }
        );

        return equipment;
      }),

    /**
     * Modify an existing Equipment
     * @argument id ID of Equipment to modify
     * @argument equipment Equipment Input for new values
     * @returns updated Equipment
     * @throws GraphQLError if not STAFF or MENTOR or is on hold
     */
    updateEquipment: async (
      _: any,
      args: { id: string; equipment: EquipmentInput },
      { isManager }: ApolloContext) =>
      isManager(async (user: CurrentUser) => {
        const room = await RoomRepo.getRoomByID(args.equipment.roomID);
        if (!user.manager.includes(room?.makerspaceID ?? -1) && !user.admin) {
          throw new GraphQLError(`Insufficent Privilege for Makerspace ${room?.makerspaceID}`)
        }

        for (let i = 0; i < args.equipment.moduleIDs.length; i++) {
          const module = await ModuleRepo.getModuleByID(Number(args.equipment.moduleIDs[i]));
          if (module.archived) {
            throw new GraphQLError(`Cannot assign module ${args.equipment.moduleIDs[i]}`)
          }
        }

        return await EquipmentRepo.updateEquipment(Number(args.id), args.equipment);
      }),

    /**
     * Set an Equipment as archived/hidden
     * @argument id ID of Equipment to modify
     * @returns updated Equipment
     * @throws GraphQLError if not STAFF or MENTOR or is on hold
     */
    archiveEquipment: async (_: any, args: { id: number },
      { isManager }: ApolloContext) =>
      isManager(async (user: CurrentUser) => {
        return await EquipmentRepo.setEquipmentArchived(args.id, true);
      }),

    /**
     * Set an Equipment as published
     * @argument id ID of Equipment to modify
     * @returns updated Equipment
     * @throws GraphQLError if not STAFF or MENTOR or is on hold
     */
    publishEquipment: async (_: any, args: { id: number },
      { isManager }: ApolloContext) =>
      isManager(async (user: CurrentUser) => {
        return await EquipmentRepo.setEquipmentArchived(args.id, false);
      }),
  },
};

export default EquipmentResolvers;
