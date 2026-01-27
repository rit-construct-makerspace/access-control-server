import { ApolloContext } from "../context.js"
import { MaintenanceTicketRow, MaintenanceTicketSeverity, MaintenanceTicketStatus, MaintenanceTicketType } from "../db/tables.js"
import * as MaintenanceTicketRepo from "../repositories/Equipment/MaintenanceTicketRepository.js"
import * as InstanceRepo from "../repositories/Equipment/EquipmentInstancesRepository.js"
import * as UserRepo from "../repositories/Users/UserRepository.js"
import * as AuditLogRepo from "../repositories/AuditLogs/AuditLogRepository.js"
import { notifyNewMaintenanceTicket } from "../integrations/slack/slack.js"

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
    )),

    assigned: async (
      parent: MaintenanceTicketRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      parent.assignedID
        ? UserRepo.getUserByID(parent.assignedID)
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
        },
        makerspaceID?: number
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      await MaintenanceTicketRepo.paginatedMaintenanceTickets(args.pagination, args.sort, args.filter, args.makerspaceID)
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
    ) => isStaff(async (user) => {
      const result = await MaintenanceTicketRepo.createMaintenanceTicket(MaintenanceTicketType.REPORTED, args.severity, args.instanceID, args.description, args.userID, args.imageUrl)
      notifyNewMaintenanceTicket(result);
      return result;
    }),

    createIntervalMaintenanceTicket: async (
      _parent: any,
      args: {
        severity: MaintenanceTicketSeverity,
        instanceID: number,
        description: string,
        startDate: string,
        intervalHours: number,
        imageUrl?: string
      },
      { isManager }: ApolloContext // should perhaps be ifManagerFor
    ) => isManager(async (user) => (
      await MaintenanceTicketRepo.createIntervalMaintenanceTicket(
        args.severity,
        args.instanceID,
        args.description,
        args.startDate,
        args.intervalHours,
        args.imageUrl
      )
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
    )),

    assignMaintenanceTicket: async (
      _parent: any,
      args: {
        id: number,
        assignedID: number | null
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => {
      const result = await MaintenanceTicketRepo.assignMaintenanceTicket(args.id, args.assignedID);

      if (args.assignedID) {
        const assigned = await UserRepo.getUserByID(args.assignedID);
        await AuditLogRepo.createLog(`{user} assigned ticket #${args.id} to {user}`, "admin",
          { id: user.id, label: UserRepo.getUsersFullName(user) },
          { id: assigned.id, label: UserRepo.getUsersFullName(assigned) }
        );
      } else {
        await AuditLogRepo.createLog(`{user} unassigned ticket #${args.id}`, "admin",
          { id: user.id, label: UserRepo.getUsersFullName(user) }
        );
      }
    }),

    deleteMaintenanceTicket: async (
      _parent: any,
      args: {
        id: number
      },
      { isManager }: ApolloContext
    ) => isManager(async (user) => (
      await MaintenanceTicketRepo.deleteMaintenanceTicket(args.id)
    ))
  }
}

export default MaintenanceTicketResolver;