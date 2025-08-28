import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    if (await knex.schema.hasColumn("CurrencyLedger", "creditAmount")) {
        // already added that column
        return;
    }
    return await knex.schema.alterTable("CurrencyLedger", (t)=>{
        t.renameColumn("amount", "creditAmount");
        t.integer("atriumAmount").notNullable().defaultTo(0);
        t.bigInteger("printerJobId").nullable();
        t.text("atriumTerminal").nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    // no non-destructive way to do this
}

