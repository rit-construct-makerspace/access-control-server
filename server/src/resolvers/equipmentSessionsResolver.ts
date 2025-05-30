/**
 * equipmentSessionsResolver.ts
 * GraphQL endpoint implementations for EquipmentSessions
 */

import * as EquipmentRepo from "../repositories/Equipment/EquipmentRepository.js";
import { Privilege } from "../schemas/usersSchema.js";
import { ApolloContext, CurrentUser } from "../context.js";
import { getAccessCheckByID, getAccessChecks, getAccessChecksByApproved, setAccessCheckApproval } from "../repositories/Equipment/AccessChecksRepository.js";
import { getUserByID } from "../repositories/Users/UserRepository.js";
import { getEquipmentSessions } from "../repositories/Equipment/EquipmentSessionsRepository.js";
import { getRoomByID } from "../repositories/Rooms/RoomRepository.js";
import { getZoneByID } from "../repositories/Zones/ZonesRespository.js";

const EquipmentSessionsResolver = {
  EquipmentSession: {
    //Map user field to User
    user: async (
      parent: { userID: string },
      _args: any,
      _context: ApolloContext) => {
      return getUserByID(Number(parent.userID));
    },
    //Map equipment field to Equipment
    equipment: async (
      parent: { equipmentID: string },
      _args: any,
      _context: ApolloContext) => {
      if (parent.equipmentID == null || parent.equipmentID == "" || Number(parent.equipmentID) == 0) return null;
      return EquipmentRepo.getEquipmentByID(Number(parent.equipmentID));
    },
    //Map Equipment.room to Room
    room: async (
      parent: { equipmentID: string },
      _args: any,
      _context: ApolloContext) => {
      if (parent.equipmentID == null || parent.equipmentID == "" || Number(parent.equipmentID) == 0) return null;
      return getRoomByID((await EquipmentRepo.getEquipmentByID(Number(parent.equipmentID))).roomID)
    },
    //Map Room.zone to Zone
    zone: async (
      parent: { equipmentID: string },
      _args: any,
      _context: ApolloContext) => {
      if (parent.equipmentID == null || parent.equipmentID == "" || Number(parent.equipmentID) == 0) return null;
      const zoneID = (await getRoomByID((await EquipmentRepo.getEquipmentByID(Number(parent.equipmentID))).roomID))?.zoneID;

      if (!zoneID) return null;
      else return getZoneByID(zoneID);
    },
  },

  Query: {
    /**
     * Fetch all Equipment Sessions
     * @returns all Equipment Sessions
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    equipmentSessions: async (
      _parent: any,
      args: {startDate: string, stopDate: string},
      { isStaff }: ApolloContext) =>
      isStaff(async (user: CurrentUser) => {
        return await getEquipmentSessions();
      }),
  },

  Mutation: {
  }
};

export default EquipmentSessionsResolver;