/** ModuleRepository.ts
 * DB operations endpoint for TrainingModule table
 */

import { knex } from "../../knex/index.js";
import { TrainingModuleRow, TrainingModuleItem, ModulesForEquipmentRow, EquipmentRow } from "../../knex/tables.js";
import { EntityNotFound } from "../../EntityNotFound.js";
import { PassedModule } from "../../schemas/usersSchema.js";

/**
 * Fetch all Training Modules in the table
 * @returns {TrainingModuleRow[]} modules
 */
export async function getModules(): Promise<TrainingModuleRow[]> {
  return knex("TrainingModule").select().orderBy("name", "asc");
}

/**
 * Fetch all Training Modules by archival status
 * @param archived archival status to filter by
 * @returns {TrainingModuleRow[]} filtered modules
 */
export async function getModulesWhereArchived(archived: boolean): Promise<TrainingModuleRow[]> {
  return knex("TrainingModule")
    .select()
    .where({ archived: archived })
    .orderBy("name", "asc");
}

/**
 * Fetch a module by it's ID
 * @param id unique ID of the module
 * @returns the module
 * @throws EntityNotFound on nonexistent ID
 */
export async function getModuleByID(id: number): Promise<TrainingModuleRow> {
  const trainingModule = await knex("TrainingModule").first().where({ id });

  if (!trainingModule)
    throw new EntityNotFound(`Training module #${id} not found`);

  return trainingModule;
}

/**
 * Fetch a modules by related equipment ID
 * @param equipmentID unique ID of the equipment the modules are assigned to
 * @returns the moduleIDs
 */
export async function getModuleIDsByEquipmentID(equipmentID: number): Promise<Pick<ModulesForEquipmentRow, "moduleID">[]> {
  const moduleIDs = await knex("ModulesForEquipment")
    .select("moduleID")
    .where(equipmentID);

  return moduleIDs;
}

/**
 * 
 * @param id the ID of the module
 * @param archived archival status to filter by
 * @returns the module if archival status matches
 * @throws EntityNotFound if no matching module
 */
export async function getModuleByIDWhereArchived(id: number, archived: boolean): Promise<TrainingModuleRow> {
  const trainingModule = await knex("TrainingModule")
    .first()
    .where({
      id: id,
      archived: archived
    })
    .orderBy("name", "asc");

  if (!trainingModule)
    throw new EntityNotFound(`Training module #${id} not found`);

  return trainingModule;
}

/**
 * Update the archival status of a specified module
 * @param id the ID of the module
 * @param archived the archival status to set
 * @returns the updated module
 */
export async function setModuleArchived(id: number, archived: boolean): Promise<TrainingModuleRow> {
  const updatedModules: TrainingModuleRow[] = await knex("TrainingModule")
    .where({ id: id })
    .update({ archived: archived })
    .returning("*");

  await knex("ModulesForEquipment").delete().where({ moduleID: id });
  await knex("ModulesForMakerspaces").delete().where({ moduleID: id });
  await knex("ModulesForRooms").delete().where({ moduleID: id });

  if (updatedModules.length < 1) throw new EntityNotFound(`Training module #${id} not found`);

  return updatedModules[0];
}

/**
 * Create a module and append it to the table
 * @param name the name of the module
 * @param quiz {TrainingModuleItem} the attached quiz
 * @returns the added module
 */
export async function addModule(name: string, quiz: object, makerspaceID: number | null, archived: boolean = true): Promise<TrainingModuleRow> {


  const addedModule: TrainingModuleRow[] = await knex("TrainingModule")
    .insert(
      {
        name: name,
        quiz: JSON.stringify(quiz) as unknown as TrainingModuleItem[], //quiz has same format as TrainingModuleItem, (updateModule does  as unknown as TrainingModuleItem[] behind the scene somewhere but I cannot find how to do that)
        makerspaceID: makerspaceID,
        archived: archived,
      }, "*");

  if (addedModule.length < 1) throw new EntityNotFound(`Could not add module ${name}`);
  return addedModule[0];
}

/**
 * Update the name, quiz, and/or reservation prompt of a specified training module
 * @param id the ID of the existing module
 * @param name the updated name
 * @param quiz the updated quiz
 * @param reservationPrompt the updated reservation prompt
 * @returns the updated module
 */
export async function updateModule(
  id: number,
  name: string,
  quiz: object,
  reservationPrompt: object,
  makerspaceID: number,
): Promise<TrainingModuleRow> {
  await knex("TrainingModule")
    .where({ id })
    // @ts-ignore
    .update({ name, quiz: JSON.stringify(quiz), reservationPrompt: JSON.stringify(reservationPrompt), makerspaceID: makerspaceID });
  return getModuleByID(id);
}

/**
 * Delete a specified training module
 * @param id the ID of the existing module
 */
export async function deleteModule(id: number): Promise<void> {
  await knex("TrainingModule").where({ id }).delete();
}

/**
 * Fetch all passed modules by user id
 * @param userID the userID to filter by
 * @returns {PassedModule[]} all modules passed by the user
 */
export async function getPassedModulesByUser(
  userID: number
): Promise<PassedModule[]> {
  return knex("PassedModules")
    .join("TrainingModule", "TrainingModule.id", "PassedModules.moduleID")
    .select(
      "PassedModules.moduleID",
      "TrainingModule.name as moduleName",
      "PassedModules.passedDate",
      "TrainingModule.makerspaceID as makerspaceID"
    )
    .where("PassedModules.userID", userID)
    .orderBy("name", "asc");;
}

/**
 * Determine if user has passed a specified module
 * @param userID the user ID to filter by
 * @param moduleID the module ID to filter by
 * @returns true if user has a passed entry for the specified module
 */
export async function hasPassedModule(
  userID: number,
  moduleID: number
): Promise<boolean> {
  return (await knex("PassedModules").select("*").where("userID", userID).andWhere("moduleID", moduleID)).length > 0;
}


/**
 * Get all equipment ids associated with a specified module
 * @param moduleID the module ID
 * @returns all ModulesForEquipment rows associated with the module
 */
export async function getEquipmentIDsByModuleID(
  moduleID: number
): Promise<ModulesForEquipmentRow[]> {
  return await knex("ModulesForEquipment").select("*").where({ moduleID: moduleID });
}

/**
 * Get all equipments associated with a specified module
 * @param moduleID the module ID
 * @returns all Equipment rows associated with the module
 */
export async function getEquipmentsByModuleID(
  moduleID: number
): Promise<EquipmentRow[]> {
  return await knex("Equipment").innerJoin('ModulesForEquipment', 'ModulesForEquipment.equipmentID', '=', 'Equipment.id').select("Equipment.*").where("ModulesForEquipment.moduleID", "=", moduleID);
}

/**
 * Get all module ids associated with an equipment
 * @param equipmentID the equipment ID
 * @returns all ModulesForEquipment rows associated with the equipment
 */
export async function getModulesIDsByEquipmentID(
  equipmentID: number
): Promise<ModulesForEquipmentRow[]> {
  return await knex("ModulesForEquipment").select("*").where({ equipmentID: equipmentID });
}

/**
 * Get all modules associated with an equipment
 * @param equipmentID the equipment ID
 * @returns all TrainingModule rows associated with the equipment
 */
export async function getModulesByEquipmentID(
  equipmentID: number
): Promise<TrainingModuleRow[]> {
  return await knex("TrainingModule").innerJoin('ModulesForEquipment', 'TrainingModule.id', '=', 'ModulesForEquipment.moduleID').select("TrainingModule.*").where("equipmentID", "=", equipmentID);
}

/**
 * Given the ID of a recently passed module, find all equipments a user has passed all modules for
 * @param moduleID the ID of the recently passed module
 * @param userID the submitting user's id
 * @returns every equipment ID where all required trainings are passed
 */
export async function getPassedEquipmentIDsByModuleID(
  moduleID: number,
  userID: number
): Promise<number[]> {
  const equipmentIdRows = await getEquipmentIDsByModuleID(moduleID);

  const equipmentPassed: number[] = [];

  for (let i = 0; i <= equipmentIdRows.length; i++) {
    const equipmentID = equipmentIdRows[i] != undefined ? equipmentIdRows[i].equipmentID : -1;
    if (equipmentID === -1) continue;
    const modulesForEquipment = await getModulesIDsByEquipmentID(equipmentID);

    let passed = true;

    for (let j = 0; j <= modulesForEquipment.length; j++) {
      if (modulesForEquipment[j] != undefined && !(await hasPassedModule(userID, modulesForEquipment[j]["moduleID"]))) {
        passed = false;
      }
    }

    if (passed) {
      await equipmentPassed.push(equipmentID);
    }
  }
  return equipmentPassed;
}