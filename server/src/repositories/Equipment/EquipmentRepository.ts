/** EquipmentRepository.ts
 * DB operations endpoint for Equipment table
 */

import { knex } from "../../db/index.js";
import { EntityNotFound } from "../../EntityNotFound.js";
import { EquipmentRow, TrainingModuleRow, UserRow } from "../../db/tables.js";
import { EquipmentInput } from "../../schemas/equipmentSchema.js";
import * as ModuleRepo from "../Training/ModuleRepository.js";
import * as HoldsRepo from "../Holds/HoldsRepository.js";
import * as UserRepo from "../Users/UserRepository.js";

/**
 * fetch every Equipment entry
 * @returns {EquipmentRow}
 */
export async function getEquipment(): Promise<EquipmentRow[]> {
  return knex("Equipment")
          .select();
}

/**
 * Select Equipment specifically archived or not archived
 * @param archived boolean true: select archived equipment
 * @returns {EquipmentRow[]} filtered equipments
 */
export async function getEquipmentWhereArchived(archived: boolean): Promise<EquipmentRow[]> {
  return knex("Equipment")
          .select()
          .where({archived: archived});
}

/**
 * Fetch Equipment entry by unique ID
 * @param id unique ID of equipment entry to fetch
 * @returns AnnouncementRow the Equipment at requested ID
 * @throws EntityNotFound on nonexistent ID
 */
export async function getEquipmentByID(id: number): Promise<EquipmentRow> {
  const equipment = await knex("Equipment")
                            .where({
                              id: id
                            })
                            .first();
  if (!equipment) throw new EntityNotFound(`Could not find equipment #${id}`);

  return equipment;
}

/**
 * Fetch Equipment entry by unique ID, filtering by specifically archived or not archived
 * @param id unique ID of equipment entry to fetch
 * @param archived true: filter by archived only
 * @returns AnnouncementRow the Equipment at requested ID
 * @throws EntityNotFound on nonexistent ID
 */
export async function getEquipmentByIDWhereArchived(id: number, archived: boolean): Promise<EquipmentRow> {
  const equipment = await knex("Equipment")
                            .where({
                              id: id,
                              archived: archived
                            })
                            .first();

  if (!equipment) throw new EntityNotFound(`Could not find equipment #${id}`);

  return equipment;
}

/**
 * Set equipment entry's archival status
 * @param equipmentID ID of Equipment to alter
 * @param archived archival status to set
 * @returns updated equipment entry
 * @throws EntityNotFound on nonexistent ID
 */
export async function setEquipmentArchived(equipmentID: number, archived: boolean): Promise<EquipmentRow> {
  const updatedEquipment = await knex("Equipment")
                                  .where({ id: equipmentID })
                                  .update({ archived: archived })
                                  .returning("*");

  if (updatedEquipment.length < 1) throw new EntityNotFound(`Could not find equipment #${equipmentID}`);

  return updatedEquipment[0];
}

/**
 * Fetch equipment filtered by room ID and archival status
 * @param roomID room ID to filter equipment by
 * @param archived archival state to filter by (Depreceated)
 * @returns filtered Equipment entries
 */
export async function getEquipmentWithRoomID(
  roomID: number,
  archived: boolean
): Promise<EquipmentRow[]> {
  return knex("Equipment")
          .select()
          .where({
            roomID: roomID,
          });
}

/**
 * Fetch modules assocatiated with specified equipment
 * @param equipmentID equipment ID to filter by
 * @returns filtered Equipment entries
 */
export async function getModulesByEquipment(
  equipmentID: number
): Promise<TrainingModuleRow[]> {
  return await knex("ModulesForEquipment")
  .join("TrainingModule", "TrainingModule.id", "ModulesForEquipment.moduleID")
  .select("TrainingModule.*")
  .where("ModulesForEquipment.equipmentID", equipmentID);
}

/**
 * Check if User has completed all trainings needed for Equipment
 * @param user User info to check trainings of
 * @param equipmentID equipment ID to check trainings needed
 * @returns true if all trainings needed are passed
 */
export async function hasTrainingModules(
  user: UserRow,
  equipmentID: number
): Promise<boolean> {
  let modules = await getModulesByEquipment(equipmentID);
  let hasTraining = true;
  // get last submission from maker for every module
  for(let i = 0; i < modules.length; i++) {
    if (await ModuleRepo.hasPassedModule(user.id, modules[i].id)) {
      continue;
    }
    else {
      hasTraining = false;
      break;
    }
  }
  return hasTraining;
}

/**
 * Fetch training module ids needed for an equipment that are not yet completed for by a specified user
 * @param user User info to check trainings of
 * @param equipmentID equipment ID to check trainings needed
 * @returns array of incomplete training modules
 */
export async function getMissingTrainingModules(
  user: UserRow,
  equipmentID: number
): Promise<TrainingModuleRow[]> {
  let modules = await getModulesByEquipment(equipmentID);
  let incompleteTrainings = [];
  console.log(modules.toString());
  // get last submission from maker for every module
  for(let i = 0; i < modules.length; i++) {
    if (await ModuleRepo.hasPassedModule(user.id, modules[i].id)) {
      continue;
    }
    else {
      incompleteTrainings.push(modules[i]);
      break;
    }
  }
  return incompleteTrainings;
}

/**
 * Check if User has completed all trainings needed for Equipment
 * @param user User info to check trainings of
 * @param equipmentID equipment ID to check trainings needed
 * @returns true if all trainings needed are passed
 */
export async function UserIdHasTrainingModules(
  userID: number,
  equipmentID: number
): Promise<boolean> {
  let modules = await getModulesByEquipment(equipmentID);
  let hasTraining = true;
  // get last submission from maker for every module
  for(let i = 0; i < modules.length; i++) {
    if (await ModuleRepo.hasPassedModule(userID, modules[i].id)) {
      continue;
    }
    else {
      hasTraining = false;
      break;
    }
  }
  return hasTraining;
}

/**
 * Check if User is authorized to use Equipment
 * @param userID id of user to check
 * @param equipmentID Equipment ID to check
 * @returns true if user is authorized
 */
export async function hasAccessByID(
  userID: number,
  equipmentID: number
): Promise<boolean> {
  const user = await UserRepo.getUserByID(userID);   // Get user for this university ID
  return user !== undefined &&                              // Ensure user exists
    !(await HoldsRepo.hasActiveHolds(user.id)) &&           // Ensure user has no holds
    (await hasTrainingModules(user, equipmentID));            // Ensure user has completed necessary training
}

/**
 * Retrieved the Equipment associated with specified training module
 * @param moduleID Training Module to check
 * @returns {EquipmentRow} Equipment associated
 */
export async function getEquipmentForModule(
  moduleID: number
): Promise<EquipmentRow[]> {
  return knex("Equipment").select("*")
    .join("ModulesForEquipment", "Equipment.id", '=', "ModulesForEquipment.equipmentID")
    .where("ModulesForEquipment.moduleID", moduleID);
}

/**
 * Set Modules as associated with a specified equipment
 * @param id the Equipment ID
 * @param moduleIDs the IDs of the modules to add
 */
export async function addModulesToEquipment(
  id: number,
  moduleIDs: number[]
): Promise<void> {
  await knex("ModulesForEquipment").insert(
    moduleIDs.map((trainingModule) => ({
      equipmentID: id,
      moduleID: trainingModule,
    }))
  );
}

/**
 * Update the modules associated with a specified equipment
 * @param id the Equipment ID
 * @param moduleIDs moduleIDs of the module to add
 */
export async function updateModules(
  id: number,
  moduleIDs: number[]
): Promise<void> {
  await knex("ModulesForEquipment").del().where("equipmentID", id);
  if (moduleIDs && moduleIDs.length > 0) {
    await addModulesToEquipment(id, moduleIDs);
  }
}

/**
 * Update an equipment entry
 * @param id the ID of the existing equipment
 * @param equipment EquipmentInput the updated attributes
 * @returns updated Equipment entry
 */
export async function updateEquipment(
  id: number,
  equipment: EquipmentInput
): Promise<EquipmentRow> {
  await knex("Equipment").where("id", id).update({
    name: equipment.name,
    roomID: equipment.roomID,
    imageUrl: equipment.imageUrl ?? undefined,
    sopUrl: equipment.sopUrl ?? undefined,
    notes: equipment.notes ?? undefined,
    byReservationOnly: equipment.byReservationOnly,
    needsWelcome: equipment.needsWelcome ?? true,
    requiresTrainerApproval: equipment.requiresTrainerApproval,
  });

  await updateModules(id, equipment.moduleIDs);

  return getEquipmentByID(id);
}

/**
 * Append new Equipment entry to table
 * @param equipment EquipmentInput equipment attributes to add
 * @returns added Equipment entry
 */
export async function addEquipment(
  equipment: EquipmentInput
): Promise<EquipmentRow> {
  const [id] = await knex("Equipment").insert(
    {
      name: equipment.name,
      roomID: equipment.roomID,
      archived: true,
      imageUrl: equipment.imageUrl ?? undefined,
      sopUrl: equipment.sopUrl ?? undefined,
      notes: equipment.notes ?? undefined,
      byReservationOnly: equipment.byReservationOnly,
      needsWelcome: equipment.needsWelcome ?? true,
    },
    "id"
  );

  if (equipment.moduleIDs?.length)
    await addModulesToEquipment(id.id, equipment.moduleIDs);

  return await getEquipmentByID(id.id);
}