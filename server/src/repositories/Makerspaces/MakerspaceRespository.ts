/**
 * MakerspacesRepository.ts
 * DB Operations for Makerspaces
 */

import { knex } from '../../db/index.js';
import { TrainingModuleRow, MakerspaceRow } from '../../db/tables.js';
import { MakerspaceInput } from '../../schemas/makerspacesSchema.js';
import * as ModuleRepo from '../Training/ModuleRepository.js';


/**
 * Fetch all Makerspaces
 * @returns all Makerspaces
 */
export async function getMakerspaces(archived = false): Promise<MakerspaceRow[]> {
  return await knex('Makerspaces').select().where({ archived: archived });
}

/**
 * Fetch Makerspaces by ID
 * @param id ID of Makerspaces
 * @returns Makerspaces or undefined if ID not exist
 */
export async function getMakerspaceByID(id: number): Promise<MakerspaceRow | undefined> {
  return await knex('Makerspaces').select('*').where({ id }).first();
}

/**
 * Insert a new Makerspaces into the table
 * @param name new makerspaces name
 * @returns new makerspaces
 */
export async function createMakerspace(name: string): Promise<MakerspaceRow> {
  const makerspaceRow = (await knex('Makerspaces').insert({ name }).returning('*'))[0];

  await knex.raw(`INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") VALUES (0, ${makerspaceRow.id})`)
  await knex.raw(`INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") VALUES (1, ${makerspaceRow.id})`)
  await knex.raw(`INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") VALUES (2, ${makerspaceRow.id})`)
  await knex.raw(`INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") VALUES (3, ${makerspaceRow.id})`)
  await knex.raw(`INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") VALUES (4, ${makerspaceRow.id})`)
  await knex.raw(`INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") VALUES (6, ${makerspaceRow.id})`)
  await knex.raw(`INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") VALUES (5, ${makerspaceRow.id})`)

  return makerspaceRow;
}

/**
 * Update an existing makerspace
 * @param id id of the makerspace to update
 * @param newMakerspace MakerspaceInput the updated values
 * @returns updated Makerspace entry
 */
export async function updateMakerspace(
  id: number, newMakerspace: MakerspaceInput): Promise<MakerspaceRow | undefined> {
  await knex('Makerspaces').where('id', id).update(
    { name: newMakerspace.name, subtitle: newMakerspace.subtitle, location: newMakerspace.location, imageUrl: newMakerspace.imageUrl, description: newMakerspace.description, docsLink: newMakerspace.docsLink });

  return getMakerspaceByID(id);
}

/**
 * Delete a Makerspace. Remove references to Makerspace from Rooms and MakerspaceHours
 * @param id ID of Makerspace to delete
 * @returns 1
 */
export async function deleteMakerspace(id: number): Promise<number> {
  await knex('DefaultHours').delete().where({ makerspaceID: id });
  await knex('Rooms').update({ makerspaceID: null }).where({ makerspaceID: id })

  return await knex('Makerspaces').delete().where({ id });
}

export async function getMakerspaceManagers(makerspaceID: number): Promise<number[]> {
  return await knex('Managers').where({ makerspaceID: makerspaceID }).select('userID');
}

export async function getMakerspaceStaff(makerspaceID: number): Promise<number[]> {
  return await knex('Managers').where({ makerspaceID: makerspaceID }).select('userID');
}

export async function getTrainingsByMakerspace(makerspaceID: number):
  Promise<TrainingModuleRow[]> {
  return await knex('ModulesForMakerspaces')
    .join(
      'TrainingModule', 'TrainingModule.id',
      'ModulesForMakerspaces.moduleID')
    .select('TrainingModule.*')
    .where('ModulesForMakerspaces.makerspaceID', makerspaceID)
    .orderBy('TrainingModule.name', 'asc');
}

export async function addTrainingToMakerspace(
  makerspaceID: number, moduleID: number): Promise<TrainingModuleRow[]> {
  await knex('ModulesForMakerspaces')
    .insert({ makerspaceID: makerspaceID, moduleID: moduleID });
  return await getTrainingsByMakerspace(makerspaceID);
}

export async function removeTrainingFromMakerspace(
  makerspaceID: number, moduleID: number): Promise<TrainingModuleRow[]> {
  await knex('ModulesForMakerspaces')
    .where({ makerspaceID: makerspaceID, moduleID: moduleID })
    .delete();
  return await getTrainingsByMakerspace(makerspaceID);
}

export async function hasMakerspaceTrainings(
  makerspaceID: number, userID: number): Promise<boolean> {
  let modules = await getTrainingsByMakerspace(makerspaceID);
  for (let i = 0; i < modules.length; i++) {
    if (await ModuleRepo.hasPassedModule(userID, modules[i].id)) {
      continue;
    } else {
      return false;
    }
  }

  return true;
}

export async function archiveMakerspace(id: number, archive = true): Promise<MakerspaceRow | undefined> {
  const result = await knex("Makerspaces").where("id", id).update("archived", archive).returning("*");
  if (result.length > 0) {
    return result[0];
  } else {
    return undefined;
  }
}