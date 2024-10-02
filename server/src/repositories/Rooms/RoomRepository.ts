/** RoomRepository.ts
 * DB operations endpoint for Rooms table
 */

import { Room } from "../../models/rooms/room.js";
import { knex } from "../../db/index.js";
import {
  roomsToDomain,
  singleRoomToDomain,
} from "../../mappers/rooms/roomMapper.js";
import assert from "assert";
import { RoomSwipeRow } from "../../db/tables.js";
import { EntityNotFound } from "../../EntityNotFound.js";


/**
 * Fetch a room by it's ID
 * @param roomID the unique ID of the Room entry
 * @returns the specified room
 */
export async function getRoomByID(roomID: number): Promise<Room | null> {
  const knexResult = await knex
    .first("id", "name", "zoneID")
    .from("Rooms")
    .where("id", roomID);

  return singleRoomToDomain(knexResult);
}

/**
 * Fetch all rooms in the table
 * @returns {Room[]} rooms
 */
export async function getRooms(): Promise<Room[]> {
  const knexResult = await knex("Rooms").select("Rooms.id", "Rooms.name");
  return roomsToDomain(knexResult);
}

/**
 * Fetch all rooms in the table associated with zone
 * @param zone zone id
 * @returns {Room[]} rooms
 */
export async function getRoomsByZone(zoneID: number): Promise<Room[]> {
  const knexResult = await knex("Rooms").select().where({zoneID});
  return roomsToDomain(knexResult);
}

/**
 * Create and append a room to the table
 * @param room the proposed room entry
 * @returns the added room
 */
export async function addRoom(room: Room): Promise<Room> {
  const newID = (
    await knex("Rooms").insert(
      {
        name: room.name,
      },
      "id"
    )
  )[0];
  const newRoom = await getRoomByID(newID.id);
  assert(newRoom);
  return newRoom;
}


/**
 * Mark a room as ARCHIVED
 * @param roomID the ID of the room to archive
 * @returns the updated room
 * @throws EntityNotFound on nonexisting ID
 */
export async function archiveRoom(roomID: number): Promise<Room | null> {
  const updatedRooms: Room[] = await knex("Rooms").where({ id: roomID }).update({ archived: true }).returning("*");

  if (updatedRooms.length < 1) throw new EntityNotFound(`Could not find room #${roomID}`);

  return updatedRooms[0];
}

/**
 * Update the name of an existing room
 * @param roomID the ID of the room to update
 * @param name the updated name
 * @returns the updated room
 */
export async function updateRoomName(
  roomID: number,
  name: string
): Promise<Room | null> {
  await knex("Rooms").where({ id: roomID }).update({
    name: name,
  });

  return await getRoomByID(roomID);
}

/**
 * Update the zone of an existing room
 * @param roomID the ID of the room to update
 * @param zoneID the new zone
 * @returns the updated room
 */
export async function updateZone(
  roomID: number,
  zoneID: number
): Promise<Room | null> {
  console.log(roomID + " " + zoneID)
  await knex("Rooms").where({ id: roomID }).update({
    zoneID
  });

  return await getRoomByID(roomID);
}

/**
 * Log a successful room access swipe
 * @param roomID the room accessed
 * @param userID the user who accessed the room
 */
export async function swipeIntoRoom(roomID: number, userID: number) {
  await knex("RoomSwipes").insert({ roomID, userID });
}

/**
 * Fetch the last 10 swipe logs to a specified room
 * @param roomID the room to filter by
 * @returns the past 10 room swipes
 */
export async function getRecentSwipes(roomID: number): Promise<RoomSwipeRow[]> {
  return knex("RoomSwipes")
    .select()
    .where({ roomID })
    .orderBy("dateTime", "DESC")
    .limit(10);
}

/**
 * Check if a user has swiped into a room today
 * @param roomID the room to check
 * @param userID the user to check
 * @returns true if swipe has occured today
 */
export async function hasSwipedToday(roomID: number, userID: number): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(0, 0, 0, 0);
  endOfDay.setDate(endOfDay.getDate()+1);

  console.log((`("dateTime" at time zone 'UTC') BETWEEN TIMESTAMP '${startOfDay.toISOString().replace("T", " ").replace("Z", "")}' AND TIMESTAMP '${endOfDay.toISOString().replace("T", " ").replace("Z", "")}'`))

  const swipe = await knex('RoomSwipes')
    .first()
    .where({ roomID })
    .where({ userID })
    .whereRaw(`("dateTime" at time zone 'UTC') BETWEEN TIMESTAMP '${startOfDay.toISOString().replace("T", " ").replace("Z", "")}' AND TIMESTAMP '${endOfDay.toISOString().replace("T", " ").replace("Z", "")}'`)

  if (!swipe) return false;
  return true;
}
