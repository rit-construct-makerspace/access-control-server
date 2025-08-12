/**
 * readersResolver.ts
 * GraphQL Endpoint Implementations for ACS Readers
 */

import * as ReaderRepo from "../repositories/Readers/ReaderRepository.js";
import { ApolloContext, CurrentUser } from "../context.js";
import { createLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import { getUserByCardTagID, getUsersFullName } from "../repositories/Users/UserRepository.js";
import { EntityNotFound } from "../EntityNotFound.js";
import { ReaderLogRow, ReaderRow } from "../db/tables.js";
import * as ShlugControl from "../wsapi.js"

import { createCipheriv, randomInt, scryptSync } from "crypto";
import { generateRandomHumanName } from "../data/humanReadableNames.js";
import { getInstanceByID } from "../repositories/Equipment/EquipmentInstancesRepository.js";
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
    if ((await ReaderRepo.getReaderByName(name)) == null) {
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
  ReaderLog: {
    reader: async (
      parent: ReaderLogRow,
      _args: any,
      _context: ApolloContext) => {
      return parent.readerID ? ReaderRepo.getReaderByID(parent.readerID) : null;
    },
    instance: async (
      parent: ReaderLogRow,
      _args: any,
      _context: ApolloContext) => {
      return parent.currentInstanceID ? getInstanceByID(parent.currentInstanceID) : null;
    }
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
     * Fetch all Websocket Readers that are not paired with a machine instance or as welcome readers
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
     * 
     * @param _args the id of the makerspace to query upon
     * @returns a list of welcome readers paired to that makerspace
     */
    welcomeReadersForMakerspace: async (
      _parent: any,
      _args: { makerspaceId: number },
      { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return await ReaderRepo.getWelcomeReadersForMakerspace(_args.makerspaceId);
      }),
    makerspaceForWelcomeReader: async (
      _parent: any,
      args: { readerId: number },
      { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return await ReaderRepo.getMakerspaceOfWelcomeReader(Number(args.readerId));
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
      }),
    /**
     * 
     * @argument makerspaceFilter the id of the current makerspace, or null to not filter by makerspace 
     * @argument from early side of date range. omit to extend to the beginning of time
     * @argument from late side of the date range. omit to extend to the end of time
     * @argument pageOffset offset into result set when paging
     * @argument pageLimit size of page when paging
     * @returns list of reader log entries
     */
    readerLogs: async (
      _parent: any,
      args: { makerspaceID?: number, from: Date, to: Date, pageOffset?: number, pageLimit: number },
      { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return await ReaderRepo.getReaderLogs(args);
      }),


    availableFirmwareVersions: async (
      _parent: any,
      args: {},
      { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return ShlugControl.getAvailableFirmwareTags();
      }),

  },

  Mutation: {
    /**
     * Create a Reader
     * @argument name Reader name
     * @returns new Reader
     * @throws GraphQLError if not MANAGER or is on hold
     */
    createReader: async (
      _parent: any,
      args: { name?: string },
      { isManager }: ApolloContext) =>
      isManager(async (user: CurrentUser) => {
        return await ReaderRepo.createReader(args);
      }),

    /**
     * Delete a reader
     * @argument id ID of reader to be deleted
     * @returns true if reader was found and deleted
     * @returns false if reader was not found and not deleted
     */
    deleteReader: async (
      _parent: any,
      args: { id: number },
      { isManager }: ApolloContext) =>
      isManager(async (user: CurrentUser) => {
        return await ReaderRepo.deleteReader(args.id);
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
      { isStaff }: ApolloContext) =>
      isStaff(async (user) => {
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

    pairAsWelcomeReader: async (
      _parent: any,
      args: { readerID: number, makerspaceID: number },
      { isStaffFor }: ApolloContext
    ) =>
      isStaffFor(args.makerspaceID, async (user) => {
        const success = await ReaderRepo.pairReaderAsMakerspaceWelcomer(args.readerID, args.makerspaceID);
        if (success) {
          ShlugControl.sendState(user, Number(args.readerID), "Welcoming");
        }
        return success;
      }),

    unpairAsWelcomeReader: async (
      _parent: any,
      args: { readerID: number, makerspaceID: number },
      { isStaffFor }: ApolloContext
    ) =>
      isStaffFor(args.makerspaceID, async (user) => {
        ShlugControl.sendState(user, Number(args.readerID), "Idle");
        return ReaderRepo.unpairReaderAsMakerspaceWelcomer(args.readerID, args.makerspaceID);
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
    setOTAVersion: async (
      _parent: any,
      args: { ids: string[], otaTag: string, updateNow: boolean },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (executingUser: any) => {
        ReaderRepo.setOTAVersions(args.ids.map(Number), args.otaTag);
        if (args.updateNow) {
          return ShlugControl.requestOTA(executingUser, args.ids.map(Number), args.otaTag);
        }
      })

  }
};

export default ReadersResolver;