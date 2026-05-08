import { knex } from "../../knex/index.js";
import { RestrictionRow } from "../../knex/tables.js";
import { EntityNotFound } from "../../EntityNotFound.js";

/**
 * Function to get restriction by ID
 */
export async function getRestriction(id: number): Promise<RestrictionRow> {
    const restriciton = await knex("Restrictions").first().where({ id: id });

    if (!restriciton) throw new EntityNotFound(`Restriction #${id} Not Found`);

    return restriciton;
}


/**
 * Function to create a restriction
 * @param creatorID userID of person placing the restriciton
 * @param targetID userID of the person being restricted
 * @param makerspaceID makerspaceID of the makerspace where the restriction applies
 * @param reason the reason for the restriction being placed
 * @returns the restriction that was just created
 */
export async function createRestriction(
    creatorID: number,
    targetID: number,
    makerspaceID: number,
    reason: string
): Promise<RestrictionRow> {
    const [restrictionID] = await knex("Restrictions").insert({
        creatorID: creatorID,
        userID: targetID,
        makerspaceID: makerspaceID,
        reason: reason
    }, "id");

    return getRestriction(restrictionID.id);
}

/**
 * Function to delete a restriction
 * @param id id of the restriciton to delete
 */
export async function deleteRestriction(id: number): Promise<boolean> {
    await knex("Restrictions").delete().where({ id: id });
    return true;
}

/**
 * Get restrictions for a given user
 * @param userID the id of the user to get the restrictions for
 * @returns An array of @type {RestrictionRow}
 */
export async function getRestrictionsByUserID(userID: number): Promise<RestrictionRow[]> {
    return await knex("Restrictions").select().where({ userID: userID }).orderBy("createDate", "desc");
}

/**
 * Checks if a user has a hold in a given makerspace
 * @param userID the id of the user to check
 * @param makerspaceID the id of the makerspace to check
 * @returns true if the user has a restriction in the given makerspace, false otherwise
 */
export async function hasRestriction(userID: number, makerspaceID: number): Promise<Boolean> {
    return (await getRestrictionsByUserID(userID)).some((restriction: RestrictionRow) => {
        return restriction.makerspaceID === makerspaceID;
    })
}