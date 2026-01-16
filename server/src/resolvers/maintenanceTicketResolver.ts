import { ApolloContext } from "../context.js"
import { MaintenanceTicketSeverity, MaintenanceTicketType } from "../db/tables.js"
import { isStaff } from "../privilege.js"
import * as MaintenanctTicketRepo from "../repositories/Equipment/MaintenanceTicketRepository.js"

const MaintenanceTicketResolver = {
  MaintenanceTicket: {

  },

  Query: {
    maintenanceTicket: async (
      _parent: any,
      args: {
        id: number
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      await MaintenanctTicketRepo.getMaintenanceTicket(args.id)
    )),

    maintenanceTickets: async (
      _parent: any,
      args: {
        makerspaceIDs?: number[],
        equipmentIDs?: number[],
        instanceIDs?: number[]
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      await MaintenanctTicketRepo.getMaintenanceTicketsFlexibly(args.makerspaceIDs, args.equipmentIDs, args.instanceIDs)
    ))
  },

  Mutation: {
    createMaintenanceTicket: async (
      _parent: any,
      args: {
        type: MaintenanceTicketType,
        severity: MaintenanceTicketSeverity,
        instanceID: number,
        userID: number,
        description: string,
        imageUrl?: string
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      await MaintenanctTicketRepo.createMaintenanceTicket(args.type, args.severity, args.instanceID, args.userID, args.description, args.imageUrl)
    )),

    modifyMaintenanceTicketClosed: async (
      _parent: any,
      args: {
        id: number,
        closed: boolean
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      await MaintenanctTicketRepo.modifyMaintenanceTicketClosed(args.id, args.closed)
    ))
  }
}

export default MaintenanceTicketResolver;