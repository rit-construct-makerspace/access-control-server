import * as EquipmentRepo from "../repositories/Equipment/EquipmentRepository.js";
import { Privilege } from "../schemas/usersSchema.js";
import { ApolloContext } from "../context.js";
import { createZoneHours, deleteZoneHours, getHoursByZone, getZoneHours } from "../repositories/Zones/ZoneHoursRepository.js";
import { createZone, deleteZone, getZoneByID, getZones, updateZone } from "../repositories/Zones/ZonesRespository.js";
import { ZoneRow } from "../db/tables.js";
import { getRooms, getRoomsByZone } from "../repositories/Rooms/RoomRepository.js";
import { ZoneInput } from "../schemas/zonesSchema.js";

const ZonesResolver = {
  Zone: {
    //Map rooms field to array of Rooms
    rooms: async (
      parent: ZoneRow,
      _args: any,
      { ifAllowed }: ApolloContext
    ) =>
      ifAllowed([Privilege.MAKER, Privilege.MENTOR, Privilege.STAFF], async () => {
        return getRoomsByZone(parent.id);
      }
    ),
    
    //Map hours field to array of ZoneHours
    hours: async (
      parent: ZoneRow,
      _args: any,
      { ifAllowed }: ApolloContext
    ) =>
      ifAllowed([Privilege.MAKER, Privilege.MENTOR, Privilege.STAFF], async () => {
        return getHoursByZone(parent.id);
      }
    ),
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
      { ifAllowed }: ApolloContext) =>
      ifAllowed([Privilege.MAKER, Privilege.MENTOR, Privilege.STAFF], async () => {
        return await getZones();
      }),

    /**
     * Fetch a single Zone by ID
     * @param id the id of the Zone to get
     * @returns a single Zone
     */
    zoneByID: async (
      _parent: any,
      args: { id: number},
      { ifAuthenticated }: ApolloContext ) =>
        ifAuthenticated(async () => {
          return await getZoneByID(args.id);
      }),
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
      { ifAllowed }: ApolloContext) =>
      ifAllowed([Privilege.STAFF], async () => {
        const res = await createZone(args.name);
        return res
      }),
    
    updateZone: async (
      _parent: any,
      args: { id: number, newZone: ZoneInput },
      { ifAllowed }: ApolloContext) =>
      ifAllowed([Privilege.STAFF], async () => {
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
      { ifAllowed }: ApolloContext) =>
      ifAllowed([Privilege.STAFF], async () => {
        await deleteZone(args.id);
        return (await getZones())[0];
      }),
  }
};

export default ZonesResolver;