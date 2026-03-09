import type { Knex } from "knex";

function formatAlterTableEnumSql(tableName: string, columnName: string, enums: string[]) {
  const constraintName = `${tableName}_${columnName}_check`;
  return [
    `ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}";`,
    `ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraintName}" CHECK ("${columnName}" = ANY (ARRAY[${enums.map(e => `'${e}'::text`).join(',')}]));`
  ].join('\n');
}

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable("DeviceLogs"))) {
    await knex.schema.createTable("DeviceLogs", (t) => {
      t.integer("id").primary();
      t.timestamp("dateTime").notNullable().defaultTo(knex.fn.now());
      t.integer("deviceID").references("id").inTable("Devices").onDelete("SET NULL").onUpdate("CASCADE").nullable().defaultTo(null);
      t.enum("severity", ["HIGH", "MEDIUM", "LOW"]).notNullable().defaultTo("LOW");
      t.jsonb("log");
    });
  }

  if (!(await knex.schema.hasColumn("AuditLogs", "makerspaceID"))) {
    await knex.schema.alterTable("AuditLogs", (t) => {
      t.integer("makerspaceID").nullable().defaultTo(null).references("id").inTable("Makerspaces").onDelete("SET NULL").onUpdate("CASCADE");
    });
  }

  if (!(await knex.schema.hasTable("UnlockAttemptLogs"))) {
    await knex.schema.createTable("UnlockAttemptLogs", (t) => {
      t.integer("id").primary();
      t.timestamp("dateTime").notNullable().defaultTo(knex.fn.now());
      t.integer("equipmentID").nullable().references("id").inTable("Equipment").onDelete("SET NULL").onUpdate("CASCADE");
      t.string("equipmentName").notNullable();
      t.integer("userID").nullable().references("id").inTable("Users").onDelete("SET NULL").onUpdate("CASCADE");
      t.string("username").notNullable();
      t.boolean("success").notNullable();
      t.string("reason").notNullable();
    });
  }

  if (!(await knex.schema.hasTable("FirmwareLocations"))) {
    await knex.schema.createTable("FirmwareLocations", (t) => {
      t.string("hardwareVersion").primary();
      t.string("firmwareURL", 1020).notNullable();
    })
  }

  if (!(await knex.schema.hasColumn("Cores", "reportedDeployment"))) {
    await knex.schema.alterTable("Cores", (t) => {
      t.jsonb("flags").notNullable().defaultTo({});
      t.jsonb("sealedDeployment").nullable().defaultTo(null);
      t.jsonb("reportedDeployment").nullable().defaultTo(null);
    })
  }

}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("DeviceLogs");
}

