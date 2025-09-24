import * as RoomRepo from "../repositories/Rooms/RoomRepository.js";
import * as EquipmentRepo from "../repositories/Equipment/EquipmentRepository.js";
import * as UserRepo from "../repositories/Users/UserRepository.js";
import { createLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import { getUsersFullName } from "../repositories/Users/UserRepository.js";
import assert from "assert";
import { Room } from "../models/rooms/room.js";
import { ApolloContext, CurrentUser } from "../context.js";
import * as MakerspaceRepo from "../repositories/Makerspaces/MakerspaceRespository.js";
import { GraphQLError } from "graphql";

const RoomResolvers = {
  Room: {
    //Map equipment field to array of published Equipment
    equipment: async (parent: Room) => {
      return await EquipmentRepo.getEquipmentWithRoomID(parent.id, false);
    },

    //Map makerspace field to Makerspace
    makerspace: async (parent: Room) => {
      if (parent.makerspaceID === null) return null;
      return await MakerspaceRepo.getMakerspaceByID(parent.makerspaceID);
    },

    //Map recentSwipes field to array of recent RoomSwipes
    recentSwipes: async (parent: Room) => {
      const swipes = await RoomRepo.getRecentSwipes(parent.id);
      return swipes.map(async (s) => ({
        id: s.id,
        dateTime: s.dateTime,
        user: await UserRepo.getUserByID(s.userID),
      }));
    },

    trainingModules: async (parent: Room) => {
      return await RoomRepo.getModulesByRoom(parent.id);
    },
  },

  Query: {
    /**
     * Fetch all Rooms
     * @returns all Rooms
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     * @todo Probably rstrict this ot admin only, but ensure it is not used anywhere first
     */
    rooms: async (_: any, args: { null: any }, { isStaff }: ApolloContext) =>
      isStaff(async (user: CurrentUser) => {
        return await RoomRepo.getRooms();
      }),

    /**
     * Fetch Room by ID
     * @argument id ID of Room
     * @returns Room
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    room: async (parent: any, args: { id: string }) => {
      return await RoomRepo.getRoomByID(Number(args.id));
    },
  },

  Mutation: {
    /**
     * Create a Room
     * @argument room Room input
     * @returns new Room
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    addRoom: async (parent: any, args: { room: Room }, { isManagerFor }: ApolloContext) =>
      isManagerFor(args.room.makerspaceID ?? -1, async (user: any) => {
        const newRoom = await RoomRepo.addRoom(args.room);

        await createLog(
          "{user} created the {room} room.",
          "admin",
          { id: user.id, label: getUsersFullName(user) },
          { id: newRoom.id, label: newRoom.name }
        );

        return newRoom;
      }),

    archiveRoom: async (_parent: any, args: { roomID: number }) => {
      return await RoomRepo.archiveRoom(args.roomID);
    },

    unarchiveRoom: async (_parent: any, args: { roomID: number }) => {
      return await RoomRepo.unarchiveRoom(args.roomID);
    },

    deleteRoom: async (_parent: any, args: { roomID: number }, { isManager }: ApolloContext) =>
      isManager(async (user: CurrentUser) => {
        const room = await RoomRepo.getRoomByID(args.roomID);
        if (!room) throw new GraphQLError(`Room ${args.roomID} does not exist`);
        if (!user.manager.includes(room.makerspaceID ?? -1) && !user.admin) {
          throw new GraphQLError(`Insufficent Privilege for Makerspace ${room.makerspaceID}`);
        }
        return await RoomRepo.deleteRoom(args.roomID);
      }),

    /**
     * Update the name of a Room
     * @argument id ID of Room to modify
     * @argument name new Room name
     * @returns updated Room
     * @throws GraphQLError if not STAFF or is on hold
     */
    updateRoomName: async (_parent: any, args: { roomID: number; name: string }, { isManager }: ApolloContext) =>
      isManager(async (user: CurrentUser) => {
        const room = await RoomRepo.getRoomByID(args.roomID);
        if (!room) throw new GraphQLError(`Room ${args.roomID} does not exist`);
        if (!user.manager.includes(room.makerspaceID ?? -1) && !user.admin) {
          throw new GraphQLError(`Insufficent Privilege for Makerspace ${room.makerspaceID}`);
        }
        return await RoomRepo.updateRoomName(args.roomID, args.name);
      }),

    /**
     * Update the makerspace of a Room
     * @argument roomID ID of Room to modify
     * @argument makerspaceID new Makerspace ID
     * @returns updated Room
     * @throws GraphQLError if not STAFF or is on hold
     */
    setMakerspace: async (
      _parent: any,
      args: { roomID: number; makerspaceID: number },
      { isManagerFor }: ApolloContext
    ) => {
      return isManagerFor(
        args.makerspaceID,
        async () => await RoomRepo.updateMakerspace(args.roomID, args.makerspaceID)
      );
    },

    swipeIntoRoomWithID: async (_parent: any, args: { roomID: string; id: number }) => {
      const room = await RoomRepo.getRoomByID(Number(args.roomID));
      assert(room);

      const user = await UserRepo.getUserByID(args.id);

      if (!user) return null;

      await RoomRepo.swipeIntoRoom(Number(args.roomID), user.id);

      await createLog(
        "{user} was manually signed into {room}.",
        "welcome",
        { id: user.id, label: getUsersFullName(user) },
        { id: room.id, label: room.name }
      );

      return user;
    },

    addTrainingToRoom: async (
      _parent: any,
      args: {
        roomID: number;
        moduleID: number;
      },
      { isManagerFor }: ApolloContext
    ) => {
      const room = await RoomRepo.getRoomByID(args.roomID);
      if (!room) {
        throw new GraphQLError("Room not found");
      }

      return isManagerFor(room.makerspaceID ?? -1, () => {
        RoomRepo.addTrainingToRoom(args.roomID, args.moduleID);
      });
    },

    removeTrainingFromRoom: async (
      _parent: any,
      args: {
        roomID: number;
        moduleID: number;
      },
      { isManagerFor }: ApolloContext
    ) => {
      const room = await RoomRepo.getRoomByID(args.roomID);
      if (!room) {
        throw new GraphQLError("Room not found");
      }

      return isManagerFor(room.makerspaceID ?? -1, () => {
        RoomRepo.removeTrainingFromRoom(args.roomID, args.moduleID);
      });
    },
  },
};

export default RoomResolvers;
