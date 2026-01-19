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
    throw new GraphQLError("Failed to create ticket")
  }
}

export async function modifyMaintenanceTicketStatus(id: number, status: MaintenanceTicketStatus): Promise<number> {
  return await knex("MaintenanceTickets").update({ status: status }).where({ id: id });
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

  return await query.select("MaintenanceTickets.*").limit(200);
}

export async function getMaintenanceTicket(id: number): Promise<MaintenanceTicketRow | undefined> {
  return await knex("MaintenanceTickets").where({ id: id }).first();
}

export async function paginatedMaintenanceTickets(pagination: { page: number, pageSize: number }): Promise<MaintenanceTicketRow[]> {
  let query = knex("MaintenanceTickets")
    .join("EquipmentInstances", "MaintenanceTickets.instanceID", "EquipmentInstances.id")
    .join("Equipment", "EquipmentInstances.equipmentID", "Equipment.id")
    .join("Rooms", "Equipment.roomID", "Rooms.id");

  // pagination
  query = query.select("MaintenanceTickets.*").offset(pagination.pageSize * pagination.page).limit(pagination.pageSize);


  return await query;
}

export async function updateMaintenanceTicket(
  id: number,
  severity: MaintenanceTicketSeverity,
  status: MaintenanceTicketStatus,
  description: string,
): Promise<number> {
  return await knex("MaintenanceTickets").update({ severity: severity, status: status, description: description }).where({ id: id });
}