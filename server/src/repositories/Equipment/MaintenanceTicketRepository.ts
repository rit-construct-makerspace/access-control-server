import { GraphQLError } from "graphql";
import { knex } from "../../db/index.js";
import { MaintenanceTicketRow, MaintenanceTicketSeverity, MaintenanceTicketStatus, MaintenanceTicketType } from "../../db/tables.js";
import { addHours, endOfDay } from "date-fns"

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

export async function createIntervalMaintenanceTicket(
  severity: MaintenanceTicketSeverity,
  instanceID: number,
  description: string,
  startDate: string,
  intervalHours: number,
  imageUrl?: string
): Promise<MaintenanceTicketRow> {
  const result = await knex("MaintenanceTickets").insert({
    type: MaintenanceTicketType.AUTOMATIC,
    severity,
    status: MaintenanceTicketStatus.UPCOMING,
    instanceID,
    description,
    dateCreated: startDate,
    intervalHours,
    imageUrl
  }).returning("*");

  if (result.length > 0) {
    return result[0];
  } else {
    throw new GraphQLError("Failed to create ticket");
  }
}

export async function modifyMaintenanceTicketStatus(id: number, status: MaintenanceTicketStatus): Promise<number> {
  const ticket = await getMaintenanceTicket(id);

  if (!ticket) {
    throw new GraphQLError("Attempted to modify non-existent ticket");
  }

  if (ticket.status === status) {
    return 0; // don't update the status to the same thing
  }

  if (status === MaintenanceTicketStatus.CLOSED) {

    if (ticket.type === MaintenanceTicketType.AUTOMATIC) {

      const newTargetDate = addHours(new Date(), ticket.intervalHours ?? 0);
      await createIntervalMaintenanceTicket(
        ticket.severity,
        ticket.instanceID,
        ticket.description,
        newTargetDate.toISOString(), ticket.intervalHours ?? 0
      )
    }

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
  filter?: { equipment: number[], severity: MaintenanceTicketSeverity[], status: MaintenanceTicketStatus[] },
  makerspaceID?: number
): Promise<MaintenanceTicketRow[]> {
  let query = knex("MaintenanceTickets")
    .join("EquipmentInstances", "MaintenanceTickets.instanceID", "EquipmentInstances.id")
    .join("Equipment", "EquipmentInstances.equipmentID", "Equipment.id")
    .join("Rooms", "Equipment.roomID", "Rooms.id")

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
  } else {
    query = query.orderBy("MaintenanceTickets.id", "asc")
  }

  // filter
  if (filter) {
    if (filter.equipment.length > 0) {
      query = query.whereIn("Equipment.id", filter.equipment);
    }

    if (filter.severity.length > 0) {
      query = query.whereIn("MaintenanceTickets.severity", filter.severity);
    }

    if (filter.status.length > 0) {
      query = query.whereIn("MaintenanceTickets.status", filter.status);
    }
  }

  // makerspace
  if (makerspaceID) {
    query = query.where("Rooms.makerspaceID", "=", makerspaceID)
  }

  return await query;
}

export async function updateMaintenanceTicket(
  id: number,
  severity: MaintenanceTicketSeverity,
  status: MaintenanceTicketStatus,
  description: string
): Promise<number> {
  await modifyMaintenanceTicketStatus(id, status);
  return await knex("MaintenanceTickets").update({ severity: severity, description: description }).where({ id: id });
}

export async function assignMaintenanceTicket(id: number, assignedID: number | null): Promise<MaintenanceTicketRow> {
  const result = await knex("MaintenanceTickets").update({ assignedID: assignedID }).where({ id: id }).returning("*");
  return result[0];
}

export async function advanceIntervalTickets(): Promise<MaintenanceTicketRow[]> {
  return await knex("MaintenanceTickets").update({ status: MaintenanceTicketStatus.TODO })
    .where("status", "=", MaintenanceTicketStatus.UPCOMING).andWhere("dateCreated", "<=", endOfDay(new Date()).toISOString()) // TODO: normalize this to timezone
    .returning("*");
}

export async function deleteMaintenanceTicket(id: number): Promise<number> {
  return await knex("MaintenanceTickets").delete().where("id", "=", id);
}