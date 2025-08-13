/**
 * equipmentResolver.ts
 * GraphQL Endpoint Implementations for Equipment
 */

import * as EquipmentRepo from "../repositories/Equipment/EquipmentRepository.js";
import * as EquipmentInstanceRepo from "../repositories/Equipment/EquipmentInstancesRepository.js";
import * as RoomRepo from "../repositories/Rooms/RoomRepository.js";
import { ApolloContext, CurrentUser } from "../context.js";
import { Privilege } from "../schemas/usersSchema.js";
import { createLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import { getUsersFullName } from "../repositories/Users/UserRepository.js";
import { EquipmentRow } from "../db/tables.js";
import { EquipmentInput } from "../schemas/equipmentSchema.js";
import { getNumUnavailableReadersByEquipment, getNumIdleReadersByEquipment } from "../repositories/Readers/ReaderRepository.js";
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
      return await getNumIdleReadersByEquipment(parent.id)
    },

    //Set numInUse to number of ACS Readers that are NOT idle or are not responding
    numInUse: async (parent: EquipmentRow) => {
      return await getNumUnavailableReadersByEquipment(parent.id)
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
     * Fetch specific published Equipment
     * @returns Equipment
     */
    equipment: async (_parent: any, args: { id: string }, _context: any) => {
      return await EquipmentRepo.getEquipmentByIDWhereArchived(Number(args.id), false);
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
      const inst = await EquipmentInstanceRepo.getInstanceByReaderID(args.readerid);
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
        if (!user.manager.includes(room?.zoneID ?? -1) && !user.admin) {
          throw new GraphQLError(`No Privilege for Makerspace ${room?.zoneID ?? -1}`);
        }

        const equipment = await EquipmentRepo.addEquipment(args.equipment);

        await createLog(
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
        if (!user.manager.includes(room?.zoneID ?? -1) && !user.admin) {
          throw new GraphQLError(`Insufficent Privilege for Makerspace ${room?.zoneID}`)
        }
        console.log(args.equipment)
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
