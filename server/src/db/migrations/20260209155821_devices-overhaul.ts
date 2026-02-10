import type { Knex } from "knex";
import { CoreInputMode } from "../tables.js";
import * as ReaderRepo from "../../repositories/Readers/ReaderRepository.js"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("Devices")) { return; }

  await knex.schema.createTable("Devices", (t) => {
    t.increments("id").primary();
    t.string("name").notNullable();
    t.string("SN").unique().notNullable();
    t.timestamp("pairTime").notNullable().defaultTo(knex.fn.now());
    t.string("hardwareVersion").nullable();
    t.string("firmwareVersion").nullable();
    t.string("targetFirmware").nullable();
  });

  await knex.schema.createTable("Cores", (t) => {
    t.integer("deviceID").references("id").inTable("Devices").primary()
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    t.integer("channels").notNullable();
    t.enum("inputMode", ["INSERT", "TEMP", "TOGGLE"]).notNullable();
    t.integer("tempDuration");
  });

  await knex.schema.createTable("AccessControllers", (t) => {
    t.increments("id").primary();
    t.integer("deviceID").references("id").inTable("Devices").notNullable()
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    t.integer("channelID").notNullable();
    t.unique(["deviceID", "channelID"]);
    t.enum("state", ["IDLE", "UNLOCKED", "ALWAYS_ON", "LOCKED_OUT", "FAULT"]);
  });

  await knex.schema.createTable("Dispensers", (t) => {
    t.increments("deviceID").references("id").inTable("Devices")
      .onUpdate("CASCADE")
      .onDelete("CASCADE")
    t.integer("cardsLeft").notNullable().defaultTo(0);
  });

  await knex.schema.alterTable("EquipmentInstances", (t) => {
    t.integer("accessControllerID").references("id").inTable("AccessController").nullable().defaultTo(null);
  })

  const readers = await knex("Readers").select("*");
  for (let i = 0; i < readers.length; i++) {
    let reader = readers[i];
    const device = (await knex("Devices").insert({
      name: reader.name,
      SN: reader.SN,
      pairTime: reader.pairTime,
      hardwareVersion: reader.HWVer,
      firmwareVersion: null,
      targetFirmware: reader.targetFirmwareVersion
    }).returning("*"))[0];

    const readerMakerspace = await ReaderRepo.getMakerspaceOfWelcomeReader(reader.id);

    const core = await knex("Cores").insert({
      deviceID: device.id,
      channels: 1,
      inputMode: readerMakerspace === undefined ? CoreInputMode.INSERT : CoreInputMode.TEMP,
      tempDuration: readerMakerspace === undefined ? undefined : 250
    }).returning("*");

    const accessController = (await knex("AccessControllers").insert({
      deviceID: device.id,
      channelID: 0
    }).returning("*"))[0];

    await knex("EquipmentInstances").insert({ accessControllerID: accessController.id }).where("readerID", "=", reader.id);

    await knex.schema.alterTable("MakerspaceWelcomeReaders", (t) => {
      t.integer("deviceID").references("id").inTable("Devices");
      t.dropPrimary();
      t.primary(["makerspaceID", "deviceID"]);
      t.dropColumn("readerID");
    })
  }
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("Devices");
  await knex.schema.dropTableIfExists("Cores");
  await knex.schema.dropTableIfExists("AccessControllers");
  await knex.schema.dropTableIfExists("Dispensers");

  if (await knex.schema.hasColumn("EquipmentInstances", "accessControllerID")) {
    await knex.schema.alterTable("EquipmentInstances", (t) => {
      t.dropColumn("accessControllerID")
    });
  }
}

