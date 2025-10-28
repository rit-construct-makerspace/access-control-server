import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn("Announcements", "linkText"))) {
    // create linkText column if it doesn't exist
    await knex.schema.alterTable("Announcements", (t) => {
      t.text("linkText").nullable();
    });
  }

  if (!(await knex.schema.hasColumn("Announcements", "linkUrl"))) {
    // create linkUrl column if it doesn't exist
    await knex.schema.alterTable("Announcements", (t) => {
      t.text("linkUrl").nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn("Announcements", "linkText")) {
    // drop linkText column if it exists
    await knex.schema.alterTable("Announcements", (t) => {
      t.dropColumn("linkText");
    });
  }

  if (await knex.schema.hasColumn("Announcements", "linkUrl")) {
    // drop linkUrl column if it exists
    await knex.schema.alterTable("Announcements", (t) => {
      t.dropColumn("linkUrl");
    });
  }
}