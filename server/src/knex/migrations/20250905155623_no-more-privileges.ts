import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasColumn("Users", "privilege"))){
        // already dropped
        return;
    }
    return await knex.schema.alterTable("Users", (t)=>{
        t.dropColumns("privilege", "isStudent");
    })
}


export async function down(knex: Knex): Promise<void> {
    if (await knex.schema.hasColumn("Users", "privilege")){
        // havent dropped it yet
        return;
    }
    return await knex.schema.alterTable("Users", (t)=>{
        t.enu("privilege", ["MAKER", "MENTOR", "STAFF"]).defaultTo("MAKER");
        t.boolean("isStudent").defaultTo(true);
    })
}

