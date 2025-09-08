import { ApolloContext } from "../context.js";
import { addTrainingToMakerspace, archiveMakerspace, createMakerspace, deleteMakerspace, getTrainingsByMakerspace, getZoneByID, getZones, removeTrainingFromMakerspace, updateMakerspace } from "../repositories/Makerspaces/MakerspaceRespository.js";
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

    //Map hours field to array of ZoneHours
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
     * Fetch all Zones
     * @returns array of Zones
     * @throws GraphQLError if not MAKER, MENTOR, or STAFF or is on hold
     */
    zones: async (
      _parent: any,
      _args: any,
    ) => {
      return await getZones();
    },

    /**
     * Fetch a single Zone by ID
     * @param id the id of the Zone to get
     * @returns a single Zone
     */
    zoneByID: async (
      _parent: any,
      args: { id: number },
    ) => {
      return await getZoneByID(args.id);
    },
  },

  Mutation: {
    /**
     * Create a Zone
     * @argument name Name of the new Zone
     * @returns new Zone
     * @throws GraphQLError if not STAFF or is on hold
     */
    addZone: async (
      _parent: any,
      args: { name: string },
      { isAdmin }: ApolloContext) =>
      isAdmin(async () => {
        const res = await createMakerspace(args.name);
        return res
      }),

    updateZone: async (
      _parent: any,
      args: { id: number, newZone: MakerspaceInput },
      { isManagerFor }: ApolloContext) =>
      isManagerFor(args.id, async () => {
        const res = await updateMakerspace(args.id, args.newZone);
        return res
      }),

    /**
     * Delete a Zone
     * @argument id ID of the ZOne to delete
     * @returns true
     * @throws GraphQLError if not STAFF or is on hold
     */
    deleteZone: async (
      _parent: any,
      args: { id: number },
      { isAdmin }: ApolloContext) =>
      isAdmin(async () => {
        await deleteMakerspace(args.id);
        return (await getZones())[0];
      }),

    addTrainingToZone: async (
      _parent: any,
      args: {
        zoneID: number,
        moduleID: number,
      },
      { isManagerFor }: ApolloContext
    ) => isManagerFor(args.zoneID, async () => {
      return await addTrainingToMakerspace(args.zoneID, args.moduleID);
    }),

    removeTrainingFromZone: async (
      _parent: any,
      args: {
        zoneID: number,
        moduleID: number,
      },
      { isManagerFor }: ApolloContext
    ) => isManagerFor(args.zoneID, async () => {
      return await removeTrainingFromMakerspace(args.zoneID, args.moduleID);
    }),

    archiveZone: async (
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
    })

  }
};

export default MakerspacesResolver;