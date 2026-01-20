import { ApolloContext } from "../context.js"
import { MaintenanceTicketRow, MaintenanceTicketSeverity, MaintenanceTicketStatus, MaintenanceTicketType } from "../db/tables.js"
import * as MaintenanceTicketRepo from "../repositories/Equipment/MaintenanceTicketRepository.js"
import * as InstanceRepo from "../repositories/Equipment/EquipmentInstancesRepository.js"
import * as UserRepo from "../repositories/Users/UserRepository.js"

const MaintenanceTicketResolver = {
  MaintenanceTicket: {
    instance: async (
      parent: MaintenanceTicketRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      InstanceRepo.getInstanceByID(parent.instanceID)
    )),

    creator: async (
      parent: MaintenanceTicketRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      parent.userID
        ? UserRepo.getUserByID(parent.userID)
        : undefined
    ))
  },

  Query: {
    maintenanceTicket: async (
      _parent: any,
      args: {
        id: number
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      await MaintenanceTicketRepo.getMaintenanceTicket(args.id)
    )),

    maintenanceTickets: async (
      _parent: any,
      args: {
        makerspaceIDs?: number[],
        equipmentIDs?: number[],
        instanceIDs?: number[],
        status?: MaintenanceTicketStatus[]
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      await MaintenanceTicketRepo.getMaintenanceTicketsFlexibly(args.makerspaceIDs, args.equipmentIDs, args.instanceIDs, args.status)
    )),

    paginatedMaintenanceTickets: async (
      _parent: any,
      args: {
        pagination: {
          page: number,
          pageSize: number
        },
        sort?: {
          target: string,
          dir: string
        },
        filter?: {
          target: string,
          op: string,
          value: string
        }
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      await MaintenanceTicketRepo.paginatedMaintenanceTickets(args.pagination, args.sort, args.filter)
    ))
  },

  Mutation: {
    createMaintenanceTicket: async (
      _parent: any,
      args: {
        severity: MaintenanceTicketSeverity,
        instanceID: number,
        userID: number,
        description: string,
        imageUrl?: string
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      await MaintenanceTicketRepo.createMaintenanceTicket(MaintenanceTicketType.REPORTED, args.severity, args.instanceID, args.description, args.userID, args.imageUrl)
    )),

    modifyMaintenanceTicketStatus: async (
      _parent: any,
      args: {
        id: number,
        status: MaintenanceTicketStatus
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      await MaintenanceTicketRepo.modifyMaintenanceTicketStatus(args.id, args.status)
    )),

    updateMaintenanceTicket: async (
      _parent: any,
      args: {
        id: number,
        severity: MaintenanceTicketSeverity,
        status: MaintenanceTicketStatus,
        description: string
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      await MaintenanceTicketRepo.updateMaintenanceTicket(args.id, args.severity, args.status, args.description)
    ))
  }
}

export default MaintenanceTicketResolver;