/** RoomRepository.ts
 * DB operations endpoint for Rooms table
 */

import { Room } from "../../models/rooms/room.js";
import { knex } from "../../db/index.js";
import { roomsToDomain, singleRoomToDomain } from "../../mappers/rooms/roomMapper.js";
import assert from "assert";
import { RoomSwipeRow, TrainingModuleRow } from "../../db/tables.js";
import { EntityNotFound } from "../../EntityNotFound.js";
import * as ModuleRepo from "../Training/ModuleRepository.js";

/**
 * Fetch a room by its ID
 * @param roomID the unique ID of the Room entry
 * @returns the specified room
 */
export async function getRoomByID(roomID: number): Promise<Room | null> {
  const knexResult = await knex.first("id", "name", "makerspaceID", "archived").from("Rooms").where("id", roomID);

  return singleRoomToDomain(knexResult);
}

/**
 * Fetch all rooms in the table
 * @returns {Room[]} rooms
 */
export async function getRooms(): Promise<Room[]> {
  const knexResult = await knex("Rooms").select("Rooms.id", "Rooms.name").where("deleted", false);
  return roomsToDomain(knexResult);
}

/**
 * Fetch all rooms in the table associated with makerspace
 * @param makerspace makerspace id
 * @returns {Room[]} rooms
 */
export async function getRoomsByMakerspace(makerspaceID: number): Promise<Room[]> {
  const knexResult = await knex("Rooms").select().where("makerspaceID", makerspaceID);
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
        makerspaceID: room.makerspaceID,
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
 * Mark a room as UNARCHIVED / NOT ARCHIVED
 * @param roomID the ID of the room to unarchive
 * @returns the updated room
 * @throws EntityNotFound on nonexisting ID
 */
export async function unarchiveRoom(roomID: number): Promise<Room | null> {
  const updatedRooms: Room[] = await knex("Rooms").where({ id: roomID }).update({ archived: false }).returning("*");

  if (updatedRooms.length < 1) throw new EntityNotFound(`Could not find room #${roomID}`);

  return updatedRooms[0];
}

/**
 * Delete a room from the DB
 * (Sets the "deleted" column to true)
 * @param roomID the ID of the room to delete
 */
export async function deleteRoom(roomID: number): Promise<void> {
  await knex("Rooms").delete().where({ id: roomID });
}

/**
 * Update the name of an existing room
 * @param roomID the ID of the room to update
 * @param name the updated name
 * @returns the updated room
 */
export async function updateRoomName(roomID: number, name: string): Promise<Room | null> {
  await knex("Rooms").where({ id: roomID }).update({
    name: name,
  });

  return await getRoomByID(roomID);
}

/**
 * Update the makerspace of an existing room
 * @param roomID the ID of the room to update
 * @param makerspaceID the new makerspace
 * @returns the updated room
 */
export async function updateMakerspace(roomID: number, makerspaceID: number): Promise<Room | null> {
  console.log(roomID + " " + makerspaceID);
  await knex("Rooms").where({ id: roomID }).update({
    makerspaceID: makerspaceID,
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
  return knex("RoomSwipes").select().where({ roomID }).orderBy("dateTime", "DESC").limit(10);
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
  endOfDay.setDate(endOfDay.getDate() + 1);

  const swipe = await knex("RoomSwipes")
    .first()
    .where({ roomID })
    .where({ userID })
    .whereRaw(
      `("dateTime") BETWEEN '${startOfDay.toISOString().replace("T", " ").replace("Z", "")}' AND '${endOfDay
        .toISOString()
        .replace("T", " ")
        .replace("Z", "")}'`
    );

  if (!swipe) return false;
  return true;
}

export async function getModulesByRoom(roomID: number): Promise<TrainingModuleRow[]> {
  return await knex("ModulesForRooms")
    .join("TrainingModule", "TrainingModule.id", "ModulesForRooms.moduleID")
    .select("TrainingModule.*")
    .where("ModulesForRooms.roomID", roomID)
    .orderBy("TrainingModule.name", "asc");
}

export async function addTrainingToRoom(roomID: number, moduleID: number): Promise<TrainingModuleRow[]> {
  await knex("ModulesForRooms").insert({ roomID: roomID, moduleID: moduleID });
  return await getModulesByRoom(roomID);
}

export async function removeTrainingFromRoom(roomID: number, moduleID: number): Promise<TrainingModuleRow[]> {
  await knex("ModulesForRooms").where({ roomID: roomID, moduleID: moduleID }).delete();
  return await getModulesByRoom(roomID);
}

export async function hasRoomTrainings(roomID: number, userID: number): Promise<boolean> {
  let modules = await getModulesByRoom(roomID);
  for (let i = 0; i < modules.length; i++) {
    if (await ModuleRepo.hasPassedModule(userID, modules[i].id)) {
      continue;
    } else {
      return false;
    }
  }

  return true;
}
