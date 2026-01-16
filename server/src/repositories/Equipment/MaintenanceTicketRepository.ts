import { knex } from "../../db/index.js";
import { MaintenanceTicketRow, MaintenanceTicketSeverity, MaintenanceTicketType } from "../../db/tables.js";

export async function createMaintenanceTicket(
  type: MaintenanceTicketType,
  severity: MaintenanceTicketSeverity,
  instanceID: number,
  userID: number,
  description: string,
  imageUrl?: string
): Promise<MaintenanceTicketRow> {
  return await knex("MaintenanceTickets").insert({
    type,
    severity,
    instanceID,
    userID,
    description,
    imageUrl
  });
}

export async function modifyMaintenanceTicketClosed(id: number, closed: boolean): Promise<number> {
  return await knex("MaintenanceTickets").update({ closed: closed }).where({ id: id });
}


export async function getMaintenanceTicketsFlexibly(
  makerspaceIDs?: number[],
  equipmentIDs?: number[],
  instanceIDs?: number[]
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

  return await query.select("MaintenanceTickets.*").limit(200);
}

export async function getMaintenanceTicket(id: number): Promise<MaintenanceTicketRow | undefined> {
  return await knex("MaintenanceTickets").where({ id: id }).first();
}