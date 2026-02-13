import type { Knex } from "knex";
import { CoreInputMode, ReaderRow } from "../tables.js";
import * as ReaderRepo from "../../repositories/Readers/ReaderRepository.js"
import * as EquipmentInstanceRepo from "../../repositories/Equipment/EquipmentInstancesRepository.js"
import * as EquipmentRepo from "../../repositories/Equipment/EquipmentRepository.js";
import * as RoomRepo from "../../repositories/Rooms/RoomRepository.js";
import { DispenserError } from "../../api/devices/cards/cardApi.js";

async function getMakerspaceOfReader(reader: ReaderRow): Promise<number | undefined> {
  const status = await ReaderRepo.getReaderPairStatus(reader.id);

  if (status === ReaderRepo.PairStatus.PairedAsWelcomer) {
    return (await ReaderRepo.getMakerspaceOfWelcomeReader(status))?.id ?? undefined;
  } else if (status === ReaderRepo.PairStatus.PairedAsInstance) {
    const instance = await EquipmentInstanceRepo.getInstanceByReaderID(reader.id);
    if (instance === undefined) { return undefined; }
    const equipment = await EquipmentRepo.getEquipmentByID(instance.equipmentID);
    if (equipment === undefined) { return undefined; }
    const room = await RoomRepo.getRoomByID(equipment.roomID);
    if (room === undefined || room === null) { return undefined; }
    return room.makerspaceID ?? undefined;
  }

  return undefined;
}

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
    t.integer("keyCyle").notNullable().defaultTo(0);
    t.integer("makerspaceID").references("id").inTable("Makerspaces").notNullable();
  });

  await knex.schema.createTable("Cores", (t) => {
    t.integer("deviceID").references("id").inTable("Devices").primary()
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    t.integer("channels").notNullable();
    t.enum("inputMode", ["INSERT", "TEMP", "TOGGLE"]).notNullable();
    t.integer("tempDuration");
    t.string("currentCardTag").nullable().defaultTo(null);
    t.timestamp("lastStatusTime").nullable();
    t.timestamp("sessionStartTime").nullable();
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
    t.enum("error", [DispenserError.CARD_STUCK, DispenserError.OUT_OF_CARDS]).nullable().defaultTo(null);
  });

  await knex.schema.alterTable("EquipmentInstances", (t) => {
    t.integer("accessControllerID").references("id").inTable("AccessController").nullable().defaultTo(null);
  })

  const readers = await knex("Readers").select("*");
  for (let i = 0; i < readers.length; i++) {
    let reader = readers[i];
    const makerspaceID = await getMakerspaceOfReader(reader);

    if (makerspaceID === undefined) {
      continue;
    }

    const device = (await knex("Devices").insert({
      name: reader.name,
      SN: reader.SN,
      pairTime: reader.pairTime,
      hardwareVersion: reader.HWVer,
      firmwareVersion: reader.BEVer,
      targetFirmware: reader.targetFirmwareVersion,
      makerspaceID: makerspaceID
    }).returning("*"))[0];

    const readerMakerspace = await ReaderRepo.getMakerspaceOfWelcomeReader(reader.id);

    const core = await knex("Cores").insert({
      deviceID: device.id,
      channels: 1,
      inputMode: readerMakerspace === undefined ? CoreInputMode.INSERT : CoreInputMode.TEMP,
      tempDuration: readerMakerspace === undefined ? undefined : 0
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

    await knex.schema.alterTable("ReaderLogs", (t) => {
      t.dropForeign("readerID");
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

