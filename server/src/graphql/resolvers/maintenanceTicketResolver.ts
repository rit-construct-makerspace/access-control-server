import { ApolloContext } from "../../context.js"
import { MaintenanceTicketRow, MaintenanceTicketSeverity, MaintenanceTicketStatus, MaintenanceTicketTimeUnit, MaintenanceTicketType } from "../../database/knex/tables.js"
import * as MaintenanceTicketRepo from "../../database/repositories/Equipment/MaintenanceTicketRepository.js"
import * as InstanceRepo from "../../database/repositories/Equipment/EquipmentInstancesRepository.js"
import * as UserRepo from "../../database/repositories/Users/UserRepository.js"
import * as AuditLogRepo from "../../database/repositories/AuditLogs/AuditLogRepository.js"
import * as EquipmentRepo from "../../database/repositories/Equipment/EquipmentRepository.js";
import { notifyNewMaintenanceTicket } from "../../integrations/slack/slack.js"
import { Equipment } from "../../database/models/equipment/Equipment.js"

const MaintenanceTicketResolver = {
  MaintenanceTicket: {
    instance: async (
      parent: MaintenanceTicketRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
      InstanceRepo.getInstanceByID(parent.instanceID)
    )),

    creator: async (
      parent: MaintenanceTicketRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
      parent.userID
        ? UserRepo.getUserByID(parent.userID)
        : undefined
    )),

    assigned: async (
      parent: MaintenanceTicketRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
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
    ) => isStaff(async (_user) => (
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
    ) => isStaff(async (_user) => (
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
          equipment: number[],
          severity: MaintenanceTicketSeverity[],
          status: MaintenanceTicketStatus[]
        },
        makerspaceID?: number
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
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
    ) => isStaff(async (_user) => {
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
        imageUrl?: string,
        timeUnit: MaintenanceTicketTimeUnit,
        hobbsTimeAtCreate: number,
      },
      { isManager }: ApolloContext // should perhaps be ifManagerFor
    ) => isManager(async (_user) => (
      await MaintenanceTicketRepo.createIntervalMaintenanceTicket(
        args.severity,
        args.instanceID,
        args.description,
        args.startDate, 
        args.hobbsTimeAtCreate,
        args.timeUnit,
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
    ) => isStaff(async (_user) => (
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
    ) => isStaff(async (_user) => (
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
      const instance = await InstanceRepo.getInstanceByID(result.instanceID);
      const equipRow = instance ? await EquipmentRepo.getEquipmentOrUndefinedByID(instance.equipmentID) : undefined;
      const makerspaceID = equipRow ? await (new Equipment(equipRow)).getMakerspaceID() : undefined;
      if (args.assignedID) {
        const assigned = await UserRepo.getUserByID(args.assignedID);
        await AuditLogRepo.createAuditLog(
          `{user} assigned ticket #${args.id} for {equipment} to {user}`,
          "admin",
          makerspaceID,
          { id: user.id, label: UserRepo.getUsersFullName(user) },
          { id: equipRow?.id ?? 0, label: equipRow?.name ?? "unknown equipment" },
          { id: assigned.id, label: UserRepo.getUsersFullName(assigned) }
        );
      } else {
        await AuditLogRepo.createAuditLog(
          `{user} unassigned ticket #${args.id} for {equipment}`,
          "admin",
          makerspaceID,
          { id: user.id, label: UserRepo.getUsersFullName(user) },
          { id: equipRow?.id ?? 0, label: equipRow?.name ?? "unknown equipment" }
        );
      }
    }),

    deleteMaintenanceTicket: async (
      _parent: any,
      args: {
        id: number
      },
      { isManager }: ApolloContext
    ) => isManager(async (_user) => (
      await MaintenanceTicketRepo.deleteMaintenanceTicket(args.id)
    ))
  }
}

export default MaintenanceTicketResolver;