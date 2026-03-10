import type { Knex } from "knex";
import { AccessControllerState, CoreInputMode, ReaderRow } from "../tables.js";
import * as ReaderRepo from "../../repositories/Readers/ReaderRepository.js"
import * as EquipmentInstanceRepo from "../../repositories/Equipment/EquipmentInstancesRepository.js"
import * as EquipmentRepo from "../../repositories/Equipment/EquipmentRepository.js";
import * as RoomRepo from "../../repositories/Rooms/RoomRepository.js";
import { DispenserError } from "../../api/devices/cards/cardApi.js";

export function oldStateToStateEnum(oldState: string) {
  switch (oldState) {
    case "Welcoming":
      return AccessControllerState.WELCOMING;
    case "Idle":
      return AccessControllerState.IDLE;
    case "Unlocked":
      return AccessControllerState.UNLOCKED;
    case "AlwaysOn":
      return AccessControllerState.ALWAYS_ON;
    case "Lockout":
      return AccessControllerState.LOCKED_OUT;
    case "Fault":
      return AccessControllerState.FAULT;
    default:
      return AccessControllerState.IDLE;
  }
}


async function getMakerspaceOfReader(reader: ReaderRow, knex: Knex): Promise<number | undefined> {
  let status = ReaderRepo.PairStatus.Unpaired
  const instances = await knex("EquipmentInstances").select("*").where("readerID", "=", reader.id);
  if (instances.length > 0) {
    status = ReaderRepo.PairStatus.PairedAsInstance;
  } else {
    const makerspaces = await knex("MakerspaceWelcomeReaders").where("readerID", "=", reader.id);
    if (makerspaces.length > 0) {
      status = ReaderRepo.PairStatus.PairedAsWelcomer;
    }
  }

  if (status === ReaderRepo.PairStatus.PairedAsWelcomer) {
    return (await knex("MakerspaceWelcomeReaders").first().where({ readerID: reader.id }).select("makerspaceID"))?.makerspaceID;
  } else if (status === ReaderRepo.PairStatus.PairedAsInstance) {
    const instance = await knex("EquipmentInstances").select().where({ readerID: reader.id }).first();
    if (instance === undefined) { return undefined; }
    const equipment = await knex("Equipment").where({ id: instance.equipmentID }).first();
    if (equipment === undefined) { return undefined; }
    const room = await knex.first("id", "name", "archived", "makerspaceID").from("Rooms").where("id", equipment.roomID);
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
    t.integer("keyCycle").notNullable().defaultTo(0);
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
    t.enum("state", ["IDLE", "UNLOCKED", "ALWAYS_ON", "LOCKED_OUT", "FAULT", "WELCOMING"]);
  });

  await knex.schema.createTable("Dispensers", (t) => {
    t.increments("deviceID").references("id").inTable("Devices")
      .onUpdate("CASCADE")
      .onDelete("CASCADE")
    t.integer("cardsLeft").notNullable().defaultTo(0);
    t.enum("error", [DispenserError.CARD_STUCK, DispenserError.OUT_OF_CARDS]).nullable().defaultTo(null);
  });

  await knex.schema.alterTable("EquipmentInstances", (t) => {
    t.integer("accessControllerID").references("id").inTable("AccessControllers").nullable().defaultTo(null);
  });

  await knex.schema.alterTable("MakerspaceWelcomeReaders", (t) => {
    t.integer("deviceID").references("id").inTable("Devices");
  });

  const readers = await knex("Readers").select("*");
  for (let i = 0; i < readers.length; i++) {
    let reader = readers[i];
    const makerspaceID = await getMakerspaceOfReader(reader, knex);

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
      makerspaceID: makerspaceID,
      keyCycle: reader.readerKeyCycle
    }).returning("*"))[0];

    const readerMakerspace = (await knex("MakerspaceWelcomeReaders").first().where({ readerID: reader.id }))?.makerspaceID;

    const core = await knex("Cores").insert({
      deviceID: device.id,
      channels: 1,
      // @ts-expect-error retroactive due to change in input modes
      inputMode: readerMakerspace === undefined ? CoreInputMode.INSERT : CoreInputMode.TEMP,
      tempDuration: readerMakerspace === undefined ? undefined : 0
    }).returning("*");

    if (readerMakerspace) {
      await knex("MakerspaceWelcomeReaders").update({ deviceID: device.id }).where({ readerID: reader.id });
    }

    const accessController = (await knex("AccessControllers").insert({
      deviceID: device.id,
      channelID: 0,
      state: oldStateToStateEnum(reader.state)
    }).returning("*"))[0];

    await knex("EquipmentInstances").update({ accessControllerID: accessController.id }).where("readerID", "=", reader.id);
  }

  await knex.schema.alterTable("MakerspaceWelcomeReaders", (t) => {
    t.dropPrimary();
    t.primary(["makerspaceID", "deviceID"]);
    t.dropColumn("readerID");
  })

  await knex.schema.alterTable("ReaderLogs", (t) => {
    t.dropForeign("readerID");
  })
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

