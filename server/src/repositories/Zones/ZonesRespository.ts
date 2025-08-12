/**
 * ZoneRepository.ts
 * DB Operations for ZOnes
 */

import { knex } from '../../db/index.js';
import { TrainingModuleRow, ZoneRow } from '../../db/tables.js';
import { ZoneInput } from '../../schemas/zonesSchema.js';
import * as ModuleRepo from '../Training/ModuleRepository.js';


/**
 * Fetch all Zones
 * @returns all Zones
 */
export async function getZones(): Promise<ZoneRow[]> {
  return await knex('Zones').select();
}

/**
 * Fetch Zone by ID
 * @param id ID of Zone
 * @returns Zone or undefined if ID not exist
 */
export async function getZoneByID(id: number): Promise<ZoneRow | undefined> {
  return await knex('Zones').select('*').where({ id }).first();
}

/**
 * Insert a new Zone into the table
 * @param name new zone name
 * @returns new Zone
 */
export async function createZone(name: string): Promise<ZoneRow> {
  const zoneRow = (await knex('Zones').insert({ name }).returning('*'))[0];

  await knex.raw(`INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") VALUES (0, ${zoneRow.id})`)
  await knex.raw(`INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") VALUES (1, ${zoneRow.id})`)
  await knex.raw(`INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") VALUES (2, ${zoneRow.id})`)
  await knex.raw(`INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") VALUES (3, ${zoneRow.id})`)
  await knex.raw(`INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") VALUES (4, ${zoneRow.id})`)
  await knex.raw(`INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") VALUES (6, ${zoneRow.id})`)
  await knex.raw(`INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") VALUES (5, ${zoneRow.id})`)

  return zoneRow;
}

/**
 * Update an existing zone
 * @param id id of the zone to update
 * @param newZone ZoneInput the updated values
 * @returns updated Zone entry
 */
export async function updateZone(
  id: number, newZone: ZoneInput): Promise<ZoneRow | undefined> {
  await knex('Zones').where('id', id).update(
    { name: newZone.name, imageUrl: newZone.imageUrl });

  return getZoneByID(id);
}

/**
 * Delete a Zone. Remove references to Zone from Rooms and ZoneHours
 * @param id ID of Zone to delete
 * @returns 1
 */
export async function deleteZone(id: number): Promise<number> {
  await knex('OpenHours').update({ zoneID: null }).where({ zoneID: id })
  await knex('Rooms').update({ zoneID: null }).where({ zoneID: id })

  return await knex('Zones').delete().where({ id });
}

export async function getZoneManagers(zoneID: number): Promise<number[]> {
  return await knex('Managers').where({ makerspaceID: zoneID }).select('userID');
}

export async function getZoneStaff(zoneID: number): Promise<number[]> {
  return await knex('Managers').where({ makerspaceID: zoneID }).select('userID');
}

export async function getTrainingsByZone(zoneID: number):
  Promise<TrainingModuleRow[]> {
  return await knex('ModulesForMakerspaces')
    .join(
      'TrainingModule', 'TrainingModule.id',
      'ModulesForMakerspaces.moduleID')
    .select('TrainingModule.*')
    .where('ModulesForMakerspaces.makerspaceID', zoneID)
    .orderBy('TrainingModule.name', 'asc');
}

export async function addTrainingToZone(
  zoneID: number, moduleID: number): Promise<TrainingModuleRow[]> {
  await knex('ModulesForMakerspaces')
    .insert({ makerspaceID: zoneID, moduleID: moduleID });
  return await getTrainingsByZone(zoneID);
}

export async function removeTrainingFromZone(
  zoneID: number, moduleID: number): Promise<TrainingModuleRow[]> {
  await knex('ModulesForMakerspaces')
    .where({ makerspaceID: zoneID, moduleID: moduleID })
    .delete();
  return await getTrainingsByZone(zoneID);
}

export async function hasZoneTrainings(
  zoneID: number, userID: number): Promise<boolean> {
  let modules = await getTrainingsByZone(zoneID);
  for (let i = 0; i < modules.length; i++) {
    if (await ModuleRepo.hasPassedModule(userID, modules[i].id)) {
      continue;
    } else {
      return false;
    }
  }

  return true;
}