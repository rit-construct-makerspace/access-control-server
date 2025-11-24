import { ApolloContext } from "../context.js";
import { addTrainingToMakerspace, archiveMakerspace, createMakerspace, deleteMakerspace, getMakerspaceByID, getMakerspaces, getTrainingsByMakerspace, removeTrainingFromMakerspace, unarchiveMakerspace, updateMakerspace } from "../repositories/Makerspaces/MakerspaceRespository.js";
import { MakerspaceRow } from "../db/tables.js";
import { getRoomsByMakerspace } from "../repositories/Rooms/RoomRepository.js";
import { MakerspaceInput } from "../schemas/makerspacesSchema.js";
import * as HoursRepo from "../repositories/Makerspaces/MakerspaceHoursRepository.js";
import { createLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import { getUsersFullName } from "../repositories/Users/UserRepository.js";
import { getItems, getItemsWhereStorefront } from "../repositories/Store/InventoryRepository.js";

const MakerspacesResolver = {
  Makerspace: {
    //Map rooms field to array of Rooms
    rooms: async (
      parent: MakerspaceRow,
      _args: any,
    ) => {
      return getRoomsByMakerspace(parent.id);
    },

    //Map hours field to array of MakerspaceHours
    hours: async (
      parent: MakerspaceRow,
      _args: any,
    ) => {
      return HoursRepo.getMakerspaceHoursNextWeek(parent.id);
    },

    trainingModules: async (
      parent: MakerspaceRow,
      _args: any,
    ) => {
      return getTrainingsByMakerspace(parent.id);
    },
    items: async (
      parent: MakerspaceRow,
      args: {storefrontVisible?: boolean},
    ) => {
      return args.storefrontVisible == undefined
        ? getItems(parent.id)
        : getItemsWhereStorefront(args.storefrontVisible, parent.id);
    }
  },

  Query: {
    /**
     * Fetch all Makerspaces
     * @returns array of Makerspaces
     * @throws GraphQLError if not MAKER, MENTOR, or STAFF or is on hold
     */
    makerspaces: async (
      _parent: any,
      _args: any,
      context: any
    ) => {
      const makerspaces = await getMakerspaces();
      if (context.user && context.user.admin) {
        return makerspaces;
      }
        return makerspaces.filter((makerspace) => !makerspace.archived);
    },

    /**
     * Fetch a single Makerspace by ID
     * @param id the id of the Makerspace to get
     * @returns a single Makerspace
     */
    makerspaceByID: async (
      _parent: any,
      args: { id: number },
    ) => {
      return await getMakerspaceByID(args.id);
    },
  },

  Mutation: {
    /**
     * Create a Makerspace
     * @argument name Name of the new Makerspace
     * @returns new Makerspace
     * @throws GraphQLError if not STAFF or is on hold
     */
    addMakerspace: async (
      _parent: any,
      args: { name: string },
      { isAdmin }: ApolloContext) =>
      isAdmin(async () => {
        const res = await createMakerspace(args.name);
        return res;
      }),

    updateMakerspace: async (
      _parent: any,
      args: { id: number, newMakerspace: MakerspaceInput },
      { isManagerFor }: ApolloContext) =>
      isManagerFor(args.id, async () => {
        const res = await updateMakerspace(args.id, args.newMakerspace);
        return res;
      }),

    /**
     * Delete a Makerspace
     * @argument id ID of the Makerspace to delete
     * @returns true
     * @throws GraphQLError if not STAFF or is on hold
     */
    deleteMakerspace: async (
      _parent: any,
      args: { id: number },
      { isAdmin }: ApolloContext) =>
      isAdmin(async () => {
        await deleteMakerspace(args.id);
        return (await getMakerspaces())[0];
      }),

    addTrainingToMakerspace: async (
      _parent: any,
      args: {
        makerspaceID: number,
        moduleID: number,
      },
      { isManagerFor }: ApolloContext
    ) => isManagerFor(args.makerspaceID, async () => {
        return await addTrainingToMakerspace(args.makerspaceID, args.moduleID);
      }),

    removeTrainingFromMakerspace: async (
      _parent: any,
      args: {
        makerspaceID: number,
        moduleID: number,
      },
      { isManagerFor }: ApolloContext
    ) => isManagerFor(args.makerspaceID, async () => {
        return await removeTrainingFromMakerspace(args.makerspaceID, args.moduleID);
      }),

    archiveMakerspace: async (
      _parent: any,
      args: {
        id: number
      },
      { isAdmin }: ApolloContext
    ) => isAdmin(async (user) => {
      createLog(`{user} archived makerspace ${args.id}`, "admin",
        { id: user.id, label: getUsersFullName(user) }
      )
        return await archiveMakerspace(args.id);
      }),

    unarchiveMakerspace: async (_parent: any, args: { id: number }, { isAdmin }: ApolloContext) => isAdmin(async (user) => {
      createLog(`{user} unarchived makerspace ${args.id}`, "admin",
        { id: user.id, label: getUsersFullName(user) }
      )
        return await unarchiveMakerspace(args.id);
    })

  }
};

export default MakerspacesResolver;