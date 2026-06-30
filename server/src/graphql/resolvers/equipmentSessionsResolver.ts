/**
 * equipmentSessionsResolver.ts
 * GraphQL endpoint implementations for EquipmentSessions
 */

import * as EquipmentRepo from "../../database/repositories/Equipment/EquipmentRepository.js";
import { ApolloContext, CurrentUser } from "../../context.js";
import { getUserByID } from "../../database/repositories/Users/UserRepository.js";
import { getEquipmentSessions } from "../../database/repositories/Equipment/EquipmentSessionsRepository.js";
import { getRoomByID } from "../../database/repositories/Rooms/RoomRepository.js";
import { getMakerspaceByID } from "../../database/repositories/Makerspaces/MakerspaceRespository.js";

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
    //Map Room.makerspace to Makerspace
    makerspace: async (
      parent: { equipmentID: string },
      _args: any,
      _context: ApolloContext) => {
      if (parent.equipmentID == null || parent.equipmentID == "" || Number(parent.equipmentID) == 0) return null;
      const makerspaceID = (await getRoomByID((await EquipmentRepo.getEquipmentByID(Number(parent.equipmentID))).roomID))?.makerspaceID;

      if (!makerspaceID) return null;
      else return getMakerspaceByID(makerspaceID);
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
      args: { startDate: string, stopDate: string },
      { isStaff }: ApolloContext) =>
      isStaff(async (_user: CurrentUser) => {
        return await getEquipmentSessions();
      }),
  },

  Mutation: {
  }
};

export default EquipmentSessionsResolver;