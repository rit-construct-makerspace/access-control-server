import { ReservationRow } from "../../db/tables.js";
import { knex } from "../../db/index.js";

export async function createReservation(userID: number, equipmentID: number, start: string, end: string, description?: string): Promise<ReservationRow> {
  return knex("Reservations").insert({
    userID: userID,
    equipmentID: equipmentID,
    start: start,
    end: end,
    description: description ?? ""
  });
}

export async function getReservationById(id: number): Promise<ReservationRow | undefined> {
  return knex("Reservations").select().where({ id: id }).first();
}

export async function setReservationApproval(id: number, approve: boolean): Promise<ReservationRow | undefined> {
  await knex("Reservations").update({ approved: approve }).where({ id: id });
  return getReservationById(id);
}

export async function deleteReservation(id: number): Promise<number> {
  return knex("Reservations").delete().where({ id: id });
}

/**
 * 
 * @param start optional ISO 8601 timestamp from Date.toISOString()
 * @param end optional ISO 8601 timestamp from Date.toISOString()
 * @param equipmentIDs optional parameter to limit scope to a specific set of equipment
 */
export async function getReservationsFlexibly(start?: string, end?: string, equipmentIDs?: number[]): Promise<ReservationRow[]> {
  let time_query = knex("Reservations").select("*");

  if (start !== undefined && end !== undefined) {
    time_query = knex("Reservations").where("end", ">=", start).andWhere("start", "<=", end);
  }

  let equipment_query = knex("Reservations").select("*");
  if (equipmentIDs !== undefined) {
    for (let i = 0; i < equipmentIDs.length; i++) {
      if (i === 0) {
        equipment_query = knex("Reservations").where("equipmentID", equipmentIDs[i]);
      } else {
        equipment_query = equipment_query.orWhere("equipmentID", equipmentIDs[i]);
      }
    }
  }

  return knex("Reservations").where("id", "in", time_query).andWhere("id", "in", equipment_query).limit(200);
}