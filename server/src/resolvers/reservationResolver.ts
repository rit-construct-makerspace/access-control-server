import { ApolloContext } from "../context.js"
import { ReservationRow } from "../db/tables.js";
import * as ReservationRepo from "../repositories/Equipment/ReservationRepository.js"
import * as EquipmentRepo from "../repositories/Equipment/EquipmentRepository.js";
import * as UserRepo from "../repositories/Users/UserRepository.js";

const ReservationResolver = {
  Reservation: {
    equipment: async (
      parent: ReservationRow
    ) => {
      return await EquipmentRepo.getEquipmentByID(parent.equipmentID);
    },

    user: async (
      parent: ReservationRow
    ) => {
      return await UserRepo.getUserByID(parent.userID);
    }
  },

  Query: {
    reservation: async (
      _parent: any,
      args: {
        id: number
      },
      { }: ApolloContext
    ) => {
      return await ReservationRepo.getReservationById(args.id);
    },

    reservations: async (
      _parent: any,
      args: {
        range?: {
          start: string,
          end: string
        },
        equipmentIDs?: number[]
      },
      { }: ApolloContext
    ) => {
      return await ReservationRepo.getReservationsFlexibly(args.range, args.equipmentIDs);
    }
  },

  Mutation: {
    createReservation: async (
      _parent: any,
      args: {
        userID: number,
        equipmentID: number,
        start: string,
        end: string,
        description?: string
      },
      { ifAuthenticated }: ApolloContext
    ) => ifAuthenticated(async (user) => {
      return await ReservationRepo.createReservation(args.userID, args.equipmentID, args.start, args.end, args.description);
    }),

    setReservationApproval: async (
      _parent: any,
      args: {
        id: number,
        approve: boolean
      },
      { isManager }: ApolloContext // Should really be isManagerFor
    ) => isManager(async (user) => {
      return await ReservationRepo.setReservationApproval(args.id, args.approve);
    }),

    deleteReservation: async (
      _parent: any,
      args: {
        id: number
      },
      { isManager }: ApolloContext // Should really be isManagerFor
    ) => isManager(async (user) => {
      return await ReservationRepo.deleteReservation(args.id);
    })
  }
};

export default ReservationResolver;