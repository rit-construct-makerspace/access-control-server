/**
 * readersResolver.ts
 * GraphQL Endpoint Implementations for ACS Readers
 */

import * as ReaderRepo from "../repositories/Readers/ReaderRepository.js";
import { ApolloContext, CurrentUser } from "../context.js";
import { Privilege } from "../schemas/usersSchema.js";
import { createLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import { getUserByCardTagID, getUsersFullName } from "../repositories/Users/UserRepository.js";
import { EntityNotFound } from "../EntityNotFound.js";
import { ReaderRow } from "../db/tables.js";
import * as ShlugControl from "../wsapi.js"

import { createCipheriv, randomInt, scryptSync } from "crypto";
import { generateRandomHumanName } from "../data/humanReadableNames.js";
import { getInstanceByReaderID } from "../repositories/Equipment/EquipmentInstancesRepository.js";
import { getEquipmentByID } from "../repositories/Equipment/EquipmentRepository.js";
const serverApiPass = process.env.SERVER_API_PASSWORD ?? 'unsecure_server_password';
const serverKey = scryptSync(serverApiPass, 'makerspace-salt¯\_(ツ)_/¯', 24);
const algorithm = 'aes-192-cbc';

export async function generateShlugKey(pairTime: Date, SN: string, keyCycle: number): Promise<string> {
  const plainText = `shlug:${SN}:${keyCycle}`;
  // generate iv from pairTime so when a key differs only by its keyCycle the front part of the hash doesnt look the same
  const iv: ArrayBuffer = (await crypto.subtle.digest('SHA-256', Buffer.from(pairTime.toISOString(), 'utf-8'))).slice(0, 16);

  let encrypted = '';
  var cipher;
  cipher = createCipheriv(algorithm, serverKey, Buffer.from(iv));

  cipher.setEncoding('hex');

  cipher.on('data', (chunk) => encrypted += chunk);

  cipher.write(plainText);
  cipher.end();

  return encrypted;
}

async function generateUniqueHumanName() {
  const RANDOM_TRIES = 10;
  for (var i = 0; i < RANDOM_TRIES; i++) {
    const name = generateRandomHumanName();
    if (await ReaderRepo.getReaderByName(name) == null) {
      return name;
    }
  }
  return `${generateRandomHumanName()}-${randomInt(1000)}`
}



const ReadersResolver = {
  Reader: {
    //Map user field to User
    user: async (
      parent: ReaderRow,
      _args: any,
      _context: ApolloContext) => {
      return getUserByCardTagID(parent.currentUID);
    },
  },

  Query: {
    /**
     * Fetch all Readers
     * @returns all Readers
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    readers: async (
      _parent: any,
      _args: any,
      { isStaff }: ApolloContext) =>
      isStaff(async (user: CurrentUser) => {
        return await ReaderRepo.getReaders();
      }),

    /**
     * Fetch all Websocket Readers that are not paired with a machine instance
     * @returns non paired readers
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    unpairedReaders: async (
      _parent: any,
      _args: any,
      { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return await ReaderRepo.getUnpairedReaders();
      }),

      /**
     * Fetch Reader by ID
     * @argument id ID of Reader
     * @returns Reader
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    reader: async (
      _parent: any,
      args: { id: string },
      { isStaff }: ApolloContext) =>
      isStaff(async (user: CurrentUser) => {
        return await ReaderRepo.getReaderByID(Number(args.id));
      })
  },

  Mutation: {
    /**
     * Create a Reader
     * @argument machineID ID of Equipment
     * @argument machineType Type indication string (mostly deprecated)
     * @argument name Reader name
     * @argument zone comma seperated list of zone IDs the machine resides in (usually just the one)
     * @returns new Reader
     * @throws GraphQLError if not STAFF or is on hold
     */
    createReader: async (
      _parent: any,
      args: {machineID?: number, machineType?: string, name?: string, zone?: string},
      { isManager }: ApolloContext) =>
      isManager(async (user: CurrentUser) => {
        return await ReaderRepo.createReader(args);
      }),

    /**
     * Pair a new Reader
     * @argument SN serial number of the shlug
     * @returns SerialNumber, ShlugKey, Certs, Domain
     * @throws GraphQLError if not STAFF or is on hold
     */
    pairReader: async (
      _parent: any,
      args: { SN: string },
      { isManager }: ApolloContext) =>
      isManager(async (user) => {
        const timeOfPair = new Date();

        var reader = await ReaderRepo.getReaderBySN(args.SN);
        if (reader == null) {
          const name = await generateUniqueHumanName();
          reader = await ReaderRepo.createReaderFromSN({ SN: args.SN, name: name });
        }
        if (reader == null) {
          // Not found and can't create a new one, we're really out of lukc
          throw "Unable to pair new reader";
        }

        var keyCycle = (reader?.readerKeyCycle ?? 0) + 1;

        reader.readerKeyCycle = keyCycle;
        reader.pairTime = timeOfPair;

        const newKey = await generateShlugKey(timeOfPair, args.SN, keyCycle);
        await ReaderRepo.updateReaderStatus(reader);

        const certCa = (await ReaderRepo.getReaderCertCA())?.value;
        if (certCa == null) {
          throw EntityNotFound;
        }

        createLog(`{user} Paired with new reader ${reader.name} (SN ${args.SN})`, "status", { id: user.id, label: getUsersFullName(user) });

        return { readerKey: newKey, name: reader.name, siteName: process.env.READER_API_URL, certs: certCa }
      }),




    /**
     * Update the name of a Reader
     * @argument id of Reader to modify
     * @argument name new Reader name
     * @returns updated Reader
     * @throws GraphQLError if not STAFF or is on hold
     */
    setName: async (
      _parent: any,
      args: { id: string; name: string },
      { isManager }: ApolloContext
    ) =>
      isManager(async (user: CurrentUser) => {
        const readerSubject = await ReaderRepo.getReaderByID(Number(args.id));
        if (readerSubject == undefined) {
          throw EntityNotFound;
        }
        await ReaderRepo.setReaderName(Number(args.id), args.name);

        await createLog(
          `{user} set {reader}'s name to ${args.name}.`,
          "admin",
          { id: user.id, label: getUsersFullName(user) },
          { id: readerSubject.id, label: readerSubject.name }
        );
      }),

    setState: async (
      _parent: any,
      args: { id: number; state: string },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (executingUser: any) => {
        try {
          return ShlugControl.sendState(executingUser, Number(args.id), args.state);
        } catch (e) {
          return `failed to parse id: ${e}`;
        }
      }),
    identifyReader: async (
      _parent: any,
      args: { id: number, doIdentify: boolean },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (executingUser: any) => {
        try {
          return ShlugControl.identifyReader(executingUser, Number(args.id), args.doIdentify);
        } catch (e) {
          return false;
        }
      }),

  }
};

export default ReadersResolver;