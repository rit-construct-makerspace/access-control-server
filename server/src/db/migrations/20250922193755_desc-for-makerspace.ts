import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    if (await knex.schema.hasColumn("Makerspaces", "description")){
        return;
    }
    await knex.schema.alterTable("Makerspaces", (t) => {
        t.text("description").notNullable().defaultTo("");
        t.text("docsLink").notNullable().defaultTo("");
    })
}


export async function down(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasColumn("Makerspaces", "description"))){
        return;
    }
    await knex.schema.alterTable("Makerspaces", (t) => {
        t.dropColumns("description", "docsLink");
    })
}

