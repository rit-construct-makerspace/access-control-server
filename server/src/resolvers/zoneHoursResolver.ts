import * as EquipmentRepo from "../repositories/Equipment/EquipmentRepository.js";
import { Privilege } from "../schemas/usersSchema.js";
import { ApolloContext } from "../context.js";
import * as HoursRepo from "../repositories/Zones/ZoneHoursRepository.js";
import { DefaultHoursRow, SpecialHoursRow } from "../db/tables.js";

const ZoneHoursResolver = {

  Query: {
    zoneHoursNextWeek: async (
      _parent: any,
      args: {
        makerspaceID: number
      },
      { }: ApolloContext
    ) => {
      return await HoursRepo.getZoneHoursNextWeek(args.makerspaceID);
    },

    zoneHoursOnDay: async (
      _parent: any,
      args: {
        day: Date,
        makerspaceID: number
      },
      { }: ApolloContext
    ) => {
      return await HoursRepo.getZoneHoursOnDay(args.day, args.makerspaceID);
    },

    zoneDefaultHours: async (
      _parent: any,
      args: {
        makerspaceID: number
      },
      { }: ApolloContext
    ) => {
      return await HoursRepo.getZoneDefaultHours(args.makerspaceID);
    },

    zoneSpecialHours: async (
      _parent: any,
      args: {
        makerspaceID: number
      },
      { }: ApolloContext
    ) => {
      return await HoursRepo.getZoneSpecialHours(args.makerspaceID);
    }
  },

  Mutation: {
    addSpecialHours: async (
      _parent: any,
      args: {
        hours: SpecialHoursRow,
      },
      { isManagerFor }: ApolloContext
    ) => {
      return await isManagerFor(args.hours.makerspaceID, async () => (
        await HoursRepo.addSpecialHours(args.hours)
      ))
    },

    deleteSpecialHours: async (
      _parent: any,
      args: {
        day: Date,
        makerspaceID: number,
      },
      { isManagerFor }: ApolloContext
    ) => {
      return await isManagerFor(args.makerspaceID, async () => (
        await HoursRepo.deleteSpecialHours(args.day, args.makerspaceID)
      ))
    },

    updateDefaultHours: async (
      _parent: any,
      args: {
        hours: DefaultHoursRow,
      },
      { isManagerFor }: ApolloContext
    ) => {
      return await isManagerFor(args.hours.makerspaceID, async () => (
        await HoursRepo.updateDefaultHours(args.hours)
      ))
    }
  }
};

export default ZoneHoursResolver;