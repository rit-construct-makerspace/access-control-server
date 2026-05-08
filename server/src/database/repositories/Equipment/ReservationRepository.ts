import { ReservationRow } from "../../knex/tables.js";
import { knex } from "../../knex/index.js";

export async function createReservation(userID: number, equipmentID: number, start: string, end: string, description?: string, approved?: boolean): Promise<ReservationRow> {
  return (await knex("Reservations").insert({
    userID: userID,
    equipmentID: equipmentID,
    start: start,
    end: end,
    description: description ?? "",
    approved: approved
  }).returning("*"))[0];
}

export async function getReservationById(id: number): Promise<ReservationRow | undefined> {
  return await knex("Reservations").select().where({ id: id }).first();
}

export async function setReservationApproval(id: number, approve: boolean): Promise<ReservationRow | undefined> {
  await knex("Reservations").update({ approved: approve }).where({ id: id });
  return await getReservationById(id);
}

export async function deleteReservation(id: number): Promise<number> {
  return await knex("Reservations").delete().where({ id: id });
}

/**
 * One endpoint to flexibly get resevations based on a variety of parameters
 * @param range contains optional ISO 8601 timestamps from Date.toISOString() start and end, looks for reservations taht start or end within this range inclusively
 * @param equipmentIDs optional parameter to limit scope to a specific set of equipment
 */
export async function getReservationsFlexibly(range?: { start: string, end: string }, equipmentIDs?: number[]): Promise<ReservationRow[]> {
  let query = knex("Reservations");

  if (range !== undefined) {
    query = query.where("end", ">=", range.start).andWhere("start", "<=", range.end);
  }

  if (equipmentIDs !== undefined && equipmentIDs.length > 0) {
    query = query.whereIn("equipmentID", equipmentIDs);
  }

  return await query.limit(200);
}