import { GraphQLError } from "graphql";
import { knex } from "../../db/index.js";
import { MaintenanceTicketRow, MaintenanceTicketSeverity, MaintenanceTicketStatus, MaintenanceTicketType } from "../../db/tables.js";

export async function createMaintenanceTicket(
  type: MaintenanceTicketType,
  severity: MaintenanceTicketSeverity,
  instanceID: number,
  description: string,
  userID?: number,
  imageUrl?: string
): Promise<MaintenanceTicketRow> {
  const result = await knex("MaintenanceTickets").insert({
    type,
    severity,
    instanceID,
    userID,
    description,
    imageUrl
  }).returning("*");
  if (result.length > 0) {
    return result[0];
  } else {
    throw new GraphQLError("Failed to create ticket");
  }
}

export async function modifyMaintenanceTicketStatus(id: number, status: MaintenanceTicketStatus): Promise<number> {
  if (status === MaintenanceTicketStatus.CLOSED) {
    return await knex("MaintenanceTickets").update({ status: status, dateClosed: knex.fn.now() }).where({ id: id });
  } else {
    return await knex("MaintenanceTickets").update({ status: status }).where({ id: id });
  }
}


export async function getMaintenanceTicketsFlexibly(
  makerspaceIDs?: number[],
  equipmentIDs?: number[],
  instanceIDs?: number[],
  status?: MaintenanceTicketStatus[]
): Promise<MaintenanceTicketRow[]> {

  let query = knex("MaintenanceTickets")
    .join("EquipmentInstances", "MaintenanceTickets.instanceID", "EquipmentInstances.id")
    .join("Equipment", "EquipmentInstances.equipmentID", "Equipment.id")
    .join("Rooms", "Equipment.roomID", "Rooms.id");

  if (makerspaceIDs !== undefined && makerspaceIDs.length > 0) {
    query = query.whereIn("makerspaceID", makerspaceIDs);
  }

  if (equipmentIDs !== undefined && equipmentIDs.length > 0) {
    query = query.whereIn("equipmentID", equipmentIDs);
  }

  if (instanceIDs !== undefined && instanceIDs.length > 0) {
    query = query.whereIn("instanceID", instanceIDs);
  }

  if (status !== undefined) {
    query.whereIn("MaintenanceTickets.status", status);
  }

  return await query.select("MaintenanceTickets.*").limit(200).orderByRaw("array_position(array['HIGH', 'MEDIUM', 'LOW'], severity)").orderBy("dateCreated", "asc");
}

export async function getMaintenanceTicket(id: number): Promise<MaintenanceTicketRow | undefined> {
  return await knex("MaintenanceTickets").where({ id: id }).first();
}

export async function paginatedMaintenanceTickets(
  pagination: { page: number, pageSize: number },
  sort?: { target: string, dir: string },
  filter?: { target: string, op: string, value: string }
): Promise<MaintenanceTicketRow[]> {
  let query = knex("MaintenanceTickets")
    .join("EquipmentInstances", "MaintenanceTickets.instanceID", "EquipmentInstances.id")
    .join("Equipment", "EquipmentInstances.equipmentID", "Equipment.id")
    .join("Rooms", "Equipment.roomID", "Rooms.id")
    .join("Users", "MaintenanceTickets.userID", "Users.id");

  // pagination
  query = query.select("MaintenanceTickets.*").offset(pagination.pageSize * pagination.page).limit(pagination.pageSize);

  // sorting
  if (sort) {
    switch (sort.target) {
      case "severity": {
        query = query.orderByRaw(`array_position(array[${sort.dir === "desc" ? "'HIGH', 'MEDIUM', 'LOW'" : "'LOW', 'MEDIUM', 'HIGH'"}], "MaintenanceTickets"."severity")`)
        break;
      }
      case "status": {
        query = query.orderByRaw(`array_position(array[${sort.dir === "desc" ? "'CLOSED', 'IN_PROGRESS', 'TODO', 'UPCOMING'" : "'UPCOMING', 'TODO', 'IN_PROGRESS', 'CLOSED'"}], "MaintenanceTickets"."status")`)
        break;
      }
      default: {
        query = query.orderBy(`MaintenanceTickets.${sort.target}`, sort.dir);
      }
    }
  }

  // filter
  if (filter) {
    switch (filter.target) {
      case "equipment": {
        query = query.whereILike(`Equipment.name`, `%${filter.value}%`);
        break;
      }
      case "instance": {
        query = query.whereILike(`EquipmentInstances.name`, `%${filter.value}%`);
        break;
      }
      case "creator": {
        query = query.whereILike(`Users.ritUsername`, `%${filter.value}%`);
        break;
      }
      default: {
        query = query.whereILike(`MaintenanceTickets.${filter.target}`, `%${filter.value}%`)
      }
    }
  }

  return await query;
}

export async function updateMaintenanceTicket(
  id: number,
  severity: MaintenanceTicketSeverity,
  status: MaintenanceTicketStatus,
  description: string,
  assignedID: number | null
): Promise<number> {
  return await knex("MaintenanceTickets").update({ severity: severity, status: status, description: description, assignedID: assignedID }).where({ id: id });
}

export async function assignMaintenanceTicket(id: number, assignedID: number | null): Promise<number> {
  return await knex("MaintenanceTickets").update({ assignedID: assignedID }).where({ id: id });
}