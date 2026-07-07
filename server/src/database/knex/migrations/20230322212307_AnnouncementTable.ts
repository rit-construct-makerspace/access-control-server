import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("Announcements").then(function (exists) {
        if (exists) return;

        return knex.schema.createTable("Announcements", function (t) {
            t.increments('id').primary;
            t.string('title', 255).notNullable();
            t.text('description');
            t.date('postDate').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
            t.date('expDate').defaultTo(knex.raw("(CURRENT_TIMESTAMP + '1 week'::interval)"));
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("Users").then(function (exists) {
        if (!exists) return;
    
        return knex.schema.dropTable("Announcements");
    });
}
