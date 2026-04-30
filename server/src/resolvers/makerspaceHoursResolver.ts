import { ApolloContext } from "../context.js";
import * as HoursRepo from "../repositories/Makerspaces/MakerspaceHoursRepository.js";
import { DefaultHoursRow, SpecialHoursRow } from "../db/tables.js";

const MakerspaceHoursResolver = {

  Query: {
    makerspaceHoursNextWeek: async (
      _parent: any,
      args: {
        makerspaceID: number
      },
      _context: any
    ) => {
      return await HoursRepo.getMakerspaceHoursNextWeek(args.makerspaceID);
    },

    makerspaceHoursOnDay: async (
      _parent: any,
      args: {
        day: Date,
        makerspaceID: number
      },
      _context: any
    ) => {
      return await HoursRepo.getMakerspaceHoursOnDay(args.day, args.makerspaceID);
    },

    makerspaceDefaultHours: async (
      _parent: any,
      args: {
        makerspaceID: number
      },
      _context: any
    ) => {
      return await HoursRepo.getMakerspaceDefaultHours(args.makerspaceID);
    },

    makerspaceSpecialHours: async (
      _parent: any,
      args: {
        makerspaceID: number
      },
      _context: any
    ) => {
      return await HoursRepo.getMakerspaceSpecialHours(args.makerspaceID);
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

export default MakerspaceHoursResolver;