import * as EquipmentRepo from "../repositories/Equipment/EquipmentRepository.js";
import { Privilege } from "../schemas/usersSchema.js";
import { ApolloContext } from "../context.js";
import { addTrainingToZone, createZone, deleteZone, getTrainingsByZone, getZoneByID, getZones, removeTrainingFromZone, updateZone } from "../repositories/Zones/ZonesRespository.js";
import { ZoneRow } from "../db/tables.js";
import { getRooms, getRoomsByZone } from "../repositories/Rooms/RoomRepository.js";
import { ZoneInput } from "../schemas/zonesSchema.js";
import * as HoursRepo from "../repositories/Zones/ZoneHoursRepository.js";

const ZonesResolver = {
  Zone: {
    //Map rooms field to array of Rooms
    rooms: async (
      parent: ZoneRow,
      _args: any,
    ) => {
      return getRoomsByZone(parent.id);
    },

    //Map hours field to array of ZoneHours
    hours: async (
      parent: ZoneRow,
      _args: any,
    ) => {
      return HoursRepo.getZoneHoursNextWeek(parent.id);
    },

    trainingModules: async (
      parent: ZoneRow,
      _args: any,
    ) => {
      return getTrainingsByZone(parent.id);
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
        const res = await createZone(args.name);
        return res
      }),

    updateZone: async (
      _parent: any,
      args: { id: number, newZone: ZoneInput },
      { isManagerFor }: ApolloContext) =>
      isManagerFor(args.id, async () => {
        const res = await updateZone(args.id, args.newZone);
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
        await deleteZone(args.id);
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
      return await addTrainingToZone(args.zoneID, args.moduleID);
    }),

    removeTrainingFromZone: async (
      _parent: any,
      args: {
        zoneID: number,
        moduleID: number,
      },
      { isManagerFor }: ApolloContext
    ) => isManagerFor(args.zoneID, async () => {
      return await removeTrainingFromZone(args.zoneID, args.moduleID);
    })

  }
};

export default ZonesResolver;