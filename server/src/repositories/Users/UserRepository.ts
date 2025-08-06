/** UserRepository.ts
 * DB operations endpoint for Users table
 */

import { Privilege } from "../../schemas/usersSchema.js";
import { knex } from "../../db/index.js";
import { createLog } from "../AuditLogs/AuditLogRepository.js";
import { EntityNotFound } from "../../EntityNotFound.js";
import { UserRow } from "../../db/tables.js";
import { GraphQLError } from "graphql";
import * as CurrencyAccountRepo from "../../repositories/Currency/CurrencyAccountsRepository.js";


/**
 * Get display friendly full name
 * @param user {UserRow} the user object
 * @returns the full name by "FirstName LastName" format
 */
export function getUsersFullName(user: UserRow) {
  return `${user.firstName} ${user.lastName}`;
}

/**
 * Fetch all users in the table
 * @param searchText text to narrow by user name
 * @returns {UserRow[]} users
 */
export async function getUsers(searchText?: string): Promise<UserRow[]> {
  return knex("Users").select()
    .whereRaw(searchText && searchText != "" ? `("ritUsername" || "firstName" || ' ' || "lastName") ilike '%${searchText}%'` : ``)
    .orderBy("ritUsername", "ASC");
}

/**
 * Fetch all users in the table
 * @param searchText text to narrow by user name
 * @returns {UserRow[]} users
 */
export async function getUsersLimit(searchText?: string): Promise<UserRow[]> {
  return knex("Users").select()
    .whereRaw(searchText && searchText != "" ? `("ritUsername" || "firstName" || ' ' || "lastName") ilike '%${searchText}%'` : ``)
    .orderBy("activeHold", "DESC").orderBy("ritUsername", "ASC").limit(100);
}

/**
 * Fetch a user by their ID (NOT university ID)
 * @param userID the ID of the user
 * @returns the user object
 */
export async function getUserByID(userID: number): Promise<UserRow> {
  const user = await knex("Users").first().where("id", userID);

  if (!user) throw new EntityNotFound(`User #${userID} not found`);

  return user;
}

/**
 * Fetch a user by their ID (NOT university ID)
 * @param userID the ID of the user
 * @returns the user object
 */
export async function getUserByIDOrUndefined(userID: number): Promise<UserRow | undefined> {
  const user = await knex("Users").first().where("id", userID);

  if (!user) return undefined

  return user;
}

/**
 * Fetch a user by their username
 * @param ritUsername the unique username of a user
 * @returns the user object
 */
export async function getUserByRitUsername(
  ritUsername: string
): Promise<UserRow | undefined> {
  console.log("Checking user: " + ritUsername);
  if (!ritUsername) {
    return undefined;
  }
  return knex("Users").first().where("ritUsername", ritUsername);
}

/**
 * Fetch a user by the hash on their RIT ID
 * @param cardTagID the hash retrieved from scanning an RIT ID
 * @returns the user object
 */
export async function getUserByCardTagID(
  cardTagID: string
): Promise<UserRow | undefined> {
  if (!cardTagID || cardTagID == "0" || cardTagID == "null" || cardTagID == "undefined") return undefined;
  return knex("Users").first().where("cardTagID", cardTagID);
}

/**
 * Fetch User by either ritUsername or cardTagID
 * @param value represents either ritUsername or cardTagID
 * @returns matching User or undefined if none
 */
export async function getUserByUsernameOrUID(value: string): Promise<UserRow | undefined> {
  return await knex("Users").select().where({ ritUsername: value }).orWhere({ cardTagID: value }).first();
}

/**
 * Create a User and append it to the table
 * @param user the user object
 * @returns the added User
 */
export async function createUser(user: {
  firstName: string;
  lastName: string;
  ritUsername: string;
}): Promise<UserRow> {
  console.log("Creating user entry: " + user.ritUsername);
  const accountID = await CurrencyAccountRepo.createAccount();
  const [newID] = await knex("Users").insert({ ...user, accountID: accountID }, "id");
  return await getUserByID(newID.id);
}

/**
 * Update a user at userID
 * @param args the updated user information
 * @returns updated user
 */
export async function updateStudentProfile(args: {
  userID: number;
  pronouns: string;
  college: string;
  expectedGraduation: string;
}): Promise<UserRow> {
  const user = await getUserByID(args.userID);

  if (!user.setupComplete) {
    await createLog("{user} has joined The SHED!",
      "server",
      {
        id: args.userID,
        label: getUsersFullName(user),
      });
  }

  await knex("Users").where({ id: args.userID }).update({
    pronouns: args.pronouns,
    college: args.college,
    expectedGraduation: args.expectedGraduation,
    setupComplete: true,
  });

  return getUserByID(args.userID);
}

/**
 * Update a user's first and last name
 * @param id ID of the User entry
 * @param firstName new first name
 * @param lastName new last name
 */
export async function updateUserName(id: number, firstName: string, lastName: string) {
  await knex("Users").update({ firstName, lastName }).where({ id });
  await createLog("{user}'s profile info has been automatically updated", "server", { id: id, label: (firstName + " " + lastName) });
}

/**
 * Update the privlege value of a user
 * @param userID the ID of the user to update
 * @param privilege the privlege to set
 * @returns updated user
 */
export async function setPrivilege(
  userID: number,
  privilege: Privilege
): Promise<UserRow> {
  await knex("Users").where({ id: userID }).update({ privilege });
  return await getUserByID(userID);
}

/**
 * Update the Card Tag ID of a user
 * @param userID the ID of the user to update
 * @param cardTagID the ID string to set
 * @returns updated user
 */
export async function setCardTagID(
  userID: number,
  cardTagID: string
): Promise<UserRow> {
  await knex("Users").where({ id: userID }).update("cardTagID", cardTagID);
  return await getUserByID(userID);
}

export async function setActiveHold(
  userID: number,
  activeHold: boolean
): Promise<UserRow> {
  await knex("Users").where({ id: userID }).update({ activeHold });
  return await getUserByID(userID);
}


/**
 * Update the Notes of a user
 * @param userID the ID of the user to update
 * @param notes the notes string to set
 * @returns updated user
 */
export async function setNotes(
  userID: number,
  notes: string
): Promise<UserRow> {
  await knex("Users").where({ id: userID }).update("notes", notes);
  return await getUserByID(userID);
}

/**
 * Archive a User
 * @param userID ID of user to modify
 * @param archive Whether to archive or unarchive the user
 * @returns updated User
 */
export async function archiveUser(userID: number, archive: boolean): Promise<UserRow> {
  await knex("Users").where({ id: userID }).update({ archived: archive });
  return await getUserByID(userID);
}

/**
 * Fetch total number of users
 * @returns number of users as JSON with "count" attribute
 * @todo knex.count gives a JSON string that our JSON parser can't recognize for some reason.
 */
export async function getNumUsers(): Promise<string> {
  return (await knex("Users").count("*"))[0];
}

/**
 * Get all the makerspaceIDs for which the given user is a manager
 * @param userID the user to get all the manager perms for
 * @returns number[] of makerspaceIDs
 */
export async function getUserManagerPerms(userID: number): Promise<number[]> {
  var makerspaceIDs: number[] = [];

  (await knex("Managers").where({ userID: userID }).select("makerspaceID")).map((row) => {
    makerspaceIDs.push(row.makerspaceID);
  })

  return makerspaceIDs;
}

/**
 * Get all makerspaceIDs for which the given user is a staff
 * @param userID the user to get all the staff perms for
 * @returns number[] of makerpsaceIDs
 */
export async function getUserStaffPerms(userID: number): Promise<number[]> {
  var makerspaceIDs: number[] = [];

  (await knex("Staff").where({ userID: userID }).select("makerspaceID")).map((row) => {
    makerspaceIDs.push(row.makerspaceID);
  })

  return makerspaceIDs;
}

/**
 * Get all equipmentIDs for which the given user is a trainer
 * @param userID the user to get all the trainer perms for
 * @returns number[] of equipmentIDs
 */
export async function getUserTrainerPerms(userID: number): Promise<number[]> {
  var equipmentIDs: number[] = [];

  (await knex("Trainers").where({ userID: userID }).select("equipmentID")).map((row) => {
    equipmentIDs.push(row.equipmentID);
  })

  return equipmentIDs;
}

export async function setUserAdmin(userID: number, admin: boolean): Promise<boolean> {
  await knex("Users").where({ id: userID }).update({ admin: admin });
  return admin;
}

export async function makeUserManager(userID: number, makerspaceID: number): Promise<number[]> {
  await knex("Managers").insert({ userID, makerspaceID });

  return await getUserManagerPerms(userID);
}

export async function makeUserStaff(userID: number, makerspaceID: number): Promise<number[]> {
  await knex("Staff").insert({ userID, makerspaceID });

  return await getUserStaffPerms(userID);
}

export async function makeUserTrainer(userID: number, equipmentID: number): Promise<number[]> {
  await knex("Trainers").insert({ userID, equipmentID });

  return await getUserTrainerPerms(userID);
}

export async function revokeUserManager(userID: number, makerspaceID: number): Promise<number[]> {
  await knex("Managers").where({ userID: userID, makerspaceID: makerspaceID }).delete();

  return await getUserManagerPerms(userID);
}

export async function revokeUserStaff(userID: number, makerspaceID: number): Promise<number[]> {
  await knex("Staff").where({ userID: userID, makerspaceID: makerspaceID }).delete();

  return await getUserStaffPerms(userID);
}

export async function revokeUserTrainer(userID: number, equipmentID: number): Promise<number[]> {
  await knex("Trainers").where({ userID: userID, equipmentID: equipmentID }).delete();

  return await getUserTrainerPerms(userID);
}

export async function getUserByAccountID(accountID: number): Promise<UserRow | undefined> {
  return await knex("Users").where({ accountID: accountID }).select("*").first();
}

export async function setForceArchive(userID: number, force: boolean | null): Promise<UserRow | undefined> {
  if (force === true) {
    await archiveUser(userID, true);
  } else if (force === false) {
    await archiveUser(userID, false);
  }

  const result = await knex("Users").where("id", userID).update("forceArchive", force).returning("*");

  if (result.length > 0) {
    return result[0];
  } else {
    return undefined;
  }
}