import { ApolloContext } from "../context.js"
import { ReservationRow } from "../database/knex/tables.js";
import * as ReservationRepo from "../database/repositories/Equipment/ReservationRepository.js"
import * as EquipmentRepo from "../database/repositories/Equipment/EquipmentRepository.js";
import * as UserRepo from "../database/repositories/Users/UserRepository.js";
import * as RoomRepo from "../database/repositories/Rooms/RoomRepository.js";
import * as AccessCheckRepo from "../database/repositories/Equipment/AccessChecksRepository.js"
import { GraphQLError } from "graphql";
import { notifyReservationRequest } from "../integrations/slack/slack.js";

const ReservationResolver = {
  Reservation: {
    equipment: async (
      parent: ReservationRow
    ) => {
      return await EquipmentRepo.getEquipmentByID(parent.equipmentID);
    },

    user: async (
      parent: ReservationRow,
      _args: any,
      { ifStaffOrSelf }: ApolloContext
    ) => {
      try {
        return ifStaffOrSelf(parent.userID, async (_user) => (
          await UserRepo.getUserByID(parent.userID)
        ))
      } catch (_e) {
        return undefined
      }
    },

    description: async (
      parent: ReservationRow,
      _args: any,
      { ifStaffOrSelf }: ApolloContext
    ) => {
      try {
        return ifStaffOrSelf(parent.userID, async (_user) => (
          parent.description
        ))
      } catch {
        return undefined
      }
    }
  },

  Query: {
    reservation: async (
      _parent: any,
      args: {
        id: number
      },
      _context: any
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
      _context: any
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
        description?: string,
        approved?: boolean
      },
      { ifAuthenticated }: ApolloContext
    ) => ifAuthenticated(async (user) => {
      const equipment = await EquipmentRepo.getEquipmentByID(args.equipmentID);
      const room = await RoomRepo.getRoomByID(equipment.roomID);

      if (user.archived) {
        throw new GraphQLError("Arhcived users cannot create reservations");
      }

      if (!equipment.schedulable && !(equipment.byReservationOnly && (user.manager.includes(room?.makerspaceID ?? -1) || user.admin))) {
        throw new GraphQLError("This equipment cannot be reserved");
      }

      if (args.approved && !(user.manager.includes(room?.makerspaceID ?? -1) || user.admin)) {
        throw new GraphQLError("Only managers can create approved resrvations");
      }

      if (!(user.manager.includes(room?.makerspaceID ?? -1) || user.admin)
        && (
          !(await EquipmentRepo.hasTrainingModules(user.id, args.equipmentID))
          || (
            equipment.requiresInPerson && !(await AccessCheckRepo.hasApprovedAccessCheck(user.id, args.equipmentID))
          )
        )
      ) {
        throw new GraphQLError("User attempting to make reservation has incomplete trainings or access checks");
      }

      const result = await ReservationRepo.createReservation(args.userID, args.equipmentID, args.start, args.end, args.description, args.approved);
      if (!result.approved) {
        notifyReservationRequest(result, equipment, room?.makerspaceID ?? -1, user);
      }
      return result;
    }),

    setReservationApproval: async (
      _parent: any,
      args: {
        id: number,
        approve: boolean
      },
      { isManager }: ApolloContext // Should really be isManagerFor
    ) => isManager(async (_user) => {
      return await ReservationRepo.setReservationApproval(args.id, args.approve);
    }),

    deleteReservation: async (
      _parent: any,
      args: {
        id: number
      },
      { ifManagerOrSelf }: ApolloContext // Should check if they are correct manager
    ) => {
      const target = await ReservationRepo.getReservationById(args.id);
      if (!target) {
        throw new GraphQLError(`Reservation ${args.id} does not exist`);
      }
      return ifManagerOrSelf(target.userID, async (_user) => {
        return await ReservationRepo.deleteReservation(args.id);
      })
    }
  }
};

export default ReservationResolver;