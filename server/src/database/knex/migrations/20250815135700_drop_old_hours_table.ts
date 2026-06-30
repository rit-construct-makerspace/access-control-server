import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    if (await knex.schema.hasTable("OpenHours")){
        return knex.schema.dropTable("OpenHours")
    }
}


export async function down(knex: Knex): Promise<void> {
    if (await knex.schema.hasTable("OpenHours")){
        return;
    }
    return knex.schema.dropTable("OpenHours")

}

