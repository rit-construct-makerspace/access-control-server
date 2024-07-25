/** ModuleRepository.ts
 * DB operations endpoint for TrainingModule table
 */

import { knex } from "../../db";
import { TrainingModuleRow, TrainingModuleItem, ModulesForEquipmentRow } from "../../db/tables";
import { EntityNotFound } from "../../EntityNotFound";
import { PassedModule } from "../../schemas/usersSchema";

/**
 * Fetch all Training Modules in the table
 * @returns {TrainingModuleRow[]} modules
 */
export async function getModules(): Promise<TrainingModuleRow[]> {
  return knex("TrainingModule").select();
}

/**
 * Fetch all Training Modules by archival status
 * @param archived archival status to filter by
 * @returns {TrainingModuleRow[]} filtered modules
 */
export async function getModulesWhereArchived(archived: boolean): Promise<TrainingModuleRow[]> {
  return knex("TrainingModule")
          .select()
          .where({ archived: archived });
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
                                });  

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

  // TODO: Detatch equipment that require this module?
  await knex("ModulesForEquipment").delete().where({moduleID: id});

  if (updatedModules.length < 1) throw new EntityNotFound(`Training module #${id} not found`);

  return updatedModules[0];
}

/**
 * Create a module and append it to the table
 * @param name the name of the module
 * @param quiz {TrainingModuleItem} the attached quiz
 * @returns the added module
 */
export async function addModule(name: string, quiz: object): Promise<TrainingModuleRow> {


  const addedModule: TrainingModuleRow[] = await knex("TrainingModule")
                      .insert(
                        {
                          name: name,
                          quiz: JSON.stringify(quiz) as unknown as TrainingModuleItem[] //quiz has same format as TrainingModuleItem, (updateModule does  as unknown as TrainingModuleItem[] behind the scene somewhere but I cannot find how to do that)
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
  reservationPrompt: object
): Promise<TrainingModuleRow> {
  await knex("TrainingModule")
    .where({ id })
    // @ts-ignore
    .update({ name, quiz: JSON.stringify(quiz), reservationPrompt: JSON.stringify(reservationPrompt) });
  return getModuleByID(id);
}

/**
 * Fetch all passed modules by user id
 * @param userID the userID to filter by
 * @returns {PassedModule[]} all modules passed by the user
 */
export async function getPassedModulesByUser(
  userID: number
): Promise<PassedModule[]> {
  return knex("ModuleSubmissions")
    .join("TrainingModule", "TrainingModule.id", "ModuleSubmissions.moduleID")
    .select(
      "ModuleSubmissions.id",
      "ModuleSubmissions.moduleID",
      "TrainingModule.name as moduleName",
      "ModuleSubmissions.submissionDate",
      "ModuleSubmissions.expirationDate"
    )
    .where("ModuleSubmissions.makerID", userID)
    .andWhere("ModuleSubmissions.passed", true);
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
) : Promise<boolean> {
  return (await getPassedModulesByUser(userID)).some((passedModule: PassedModule) => {
    // User has this training if they have a passing and non-expired submission
    return passedModule?.moduleID === moduleID && passedModule?.expirationDate > new Date();
  });
}


/**
 * Get all equipment ids associated with a specified module
 * @param moduleID the module ID
 * @returns all ModulesForEquipment rows associated with the module
 */
export async function getEquipmentIDsByModuleID(
  moduleID: number
): Promise<ModulesForEquipmentRow[]> {
  return await knex("ModulesForEquipment").select("*").where({moduleID: moduleID});
}

/**
 * Get all module ids associated with an equipment
 * @param equipmentID the equipment ID
 * @returns all ModulesForEquipment rows associated with the equipment
 */
export async function getModulesIDsByEquipmentID(
  equipmentID: number
): Promise<ModulesForEquipmentRow[]> {
  return await knex("ModulesForEquipment").select("*").where({equipmentID: equipmentID});
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
  console.log("equipmentIdRows: " + equipmentIdRows);

  var equipmentPassed: number[] = [];
  
  for (var i = 0; i <= equipmentIdRows.length; i++) {
    console.log("equipmentIdRows i: " + JSON.stringify(equipmentIdRows[i], null, 4))
    const equipmentID = equipmentIdRows[i] != undefined ? equipmentIdRows[i].equipmentID : -1;
    if (equipmentID === -1) continue;
    const modulesForEquipment = await getModulesIDsByEquipmentID(equipmentID);
    console.log("equipmentID: " + equipmentID);
    console.log("modulesForEquipment: " + JSON.stringify(modulesForEquipment, null, 4));

    var passed = true;

    for (var j = 0; j <= modulesForEquipment.length; j++) {
      console.log("modulesForEquipment j: " + JSON.stringify(modulesForEquipment[j], null, 4));
      if (modulesForEquipment[j] != undefined && !(await hasPassedModule(userID, modulesForEquipment[j]["moduleID"]))) {
        console.log("failed");
        passed = false;
      }
    }

    if (passed) {
      console.log("passed")
      await equipmentPassed.push(equipmentID);
    }
  }
  console.log("equipmentPassed: " + equipmentPassed)
  return equipmentPassed;
}