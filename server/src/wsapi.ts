import { Request } from "express";
import * as ws from "ws";
import { createLog } from "./repositories/AuditLogs/AuditLogRepository.js";
import { createReaderFromSN, getMakerspaceOfWelcomeReader, getReaderByID, getReaderByName, getReaderBySN, getReaderPairStatus, PairStatus, submitReaderLog, submitReaderLogWithInstance, updateReaderStatus } from "./repositories/Readers/ReaderRepository.js";
import { EquipmentInstancesRow, EquipmentRow, ReaderRow, UserRow, ZoneRow } from "./db/tables.js";
import { getEquipmentByID, getMissingTrainingModules, hasAccessByID, hasTrainingModules } from "./repositories/Equipment/EquipmentRepository.js";
import { getUserByCardTagID, getUserManagerPerms, getUsersFullName, getUserStaffPerms } from "./repositories/Users/UserRepository.js";
import { EntityNotFound } from "./EntityNotFound.js";
import { createEquipmentSession, setLatestEquipmentSessionLength } from "./repositories/Equipment/EquipmentSessionsRepository.js";
import { getRoomByID, getRoomsByZone, hasRoomTrainings, hasSwipedToday, swipeIntoRoom } from "./repositories/Rooms/RoomRepository.js";
import { isApproved } from "./repositories/Equipment/AccessChecksRepository.js";
import { getInstanceByReaderID } from "./repositories/Equipment/EquipmentInstancesRepository.js";
import { randomInt } from "crypto";
import { generateRandomHumanName } from "./data/humanReadableNames.js";
import { generateShlugKey } from "./resolvers/readersResolver.js";
import { hasActiveHolds } from "./repositories/Holds/HoldsRepository.js";
import { hasRestriction } from "./repositories/Restrictions/RestrictionsRepository.js";
import { isManagerFor } from "./context.js";
import { getZoneByID, hasZoneTrainings } from "./repositories/Zones/ZonesRespository.js";


const API_NORMAL_LOGGING = process.env.API_NORMAL_LOGGING == "true";

const MIN_SESSION_LENGTH = 15


enum WSAPIError {
  Protocol = 4000,
  InvalidMessageFormat = 4001,
  Unauthenticated = 4002,
  BadBootMessage = 4003,
}

/**
 * Pool of active shlugs to send info to
 */
var slugPool: Map<number, ConnectionData> = new Map();

function stringSlugPool() {
  var entries = Array.from(slugPool.entries());
  var entriesNoWs = entries.map(([_, data]) => ({ "id": data?.readerId, "state": data?.currentState }));
  return JSON.stringify(entriesNoWs)
}

/**
 * Generate auditlog tag for a reader for history
 * @param instance 
 * @param machine 
 * @param makerspace 
 * @returns 
 */
function pairedLabel(instance?: EquipmentInstancesRow, machine?: EquipmentRow | null, makerspace?: ZoneRow | null): [boolean, string, { id: number, label: string }] {
  if (instance && machine) {
    return [true, `{machine} instance ${instance?.name ?? "unknown instance"}`, { id: machine.id, label: machine.name }];
  } else if (makerspace) {
    return [true, "{makerspace}", { id: makerspace.id, label: makerspace.name }]
  }
  return [false, "(unpaired)", { id: 0, label: "nothing" }]
}

/** 
 * adds a connection to the pool such that it can be communicated with
 * @param connData connection data associated with the shlug
 */
async function addOrUpdateConnection(connData: ConnectionData) {
  if (connData.readerId == null) {
    console.error(`WSACS: Attempting to add invalid connection to active connections\n\tState: ${connData.currentState}\n\tID: ${connData.readerId}\n\tSeqNum: ${connData.toShlugSeqNum}`)
    return;
  }
  slugPool.set(connData.readerId, connData);
}
/**
 * removes a shlug connection from the pool
 * @param connData connection data associated with the shlug we want to remove
 * @returns true if the item was removed. false if it wasn't found
 */
function removeConnection(connData: ConnectionData): boolean {
  if (connData.readerId == null) {
    console.error(`WSACS: Attempting to remove invalid connection to shlug from pool\nData: ${JSON.stringify(connData)}\nPool:${stringSlugPool()}`);
    return false;
  } else if (!slugPool.has(connData.readerId)) {
    console.error(`WSACS: Attempting to remove nonexistent connection to shlug from pool\nData: ${JSON.stringify(connData)}\nPool:${stringSlugPool()}`);
    return false;
  }
  return slugPool.delete(connData.readerId);
}

export async function identifyReader(executingUser: UserRow, readerId: number, doIdentify: boolean): Promise<boolean> {
  let connData = slugPool.get(readerId);
  if (connData == null) {
    console.error(`WSACS: Couldn't find shlug with id ${readerId} \n in pool ${stringSlugPool()}`)
    return false;
  }

  const reader = await getReaderByID(readerId);
  if (doIdentify) {
    wsApiLog("{user} identified {access_device}", "status", { id: executingUser.id, label: getUsersFullName(executingUser) }, { id: readerId, label: reader?.name ?? "unknown reader" });
  }

  sendToShlugUnprompted(connData, { "Identify": doIdentify });

  return true;
}


export async function requestOTA(executingUser: UserRow, readerIds: number[], otaTag: string): Promise<{ id: number, ret: string }[]> {
  const url = `https://github.com/rit-construct-makerspace/access-control-firmware/releases/tag/${otaTag}`;
  await fetch(url).then(res => {
    if (res.status != 200) {
      return "no such release";
    }
  });
  async function requestOTAToOne(id: number): Promise<{ id: number, ret: string }> {
    const connData = slugPool.get(id);
    if (connData == null) {
      return { id: id, ret: "no such reader" };
    }
    sendToShlugUnprompted(connData, { "OTATag": otaTag });
    return { id: id, ret: "sent" }
  }
  return await Promise.all(
    readerIds.map(requestOTAToOne)
  );;
}


/**
 * Sends a state to a shlug
 * @param readerId reader to send the state to
 * @param state the string representing the target state
 * @returns text description of success or failure
 */
export async function sendState(executingUser: UserRow, readerId: number, state: string): Promise<string> {
  let connData = slugPool.get(readerId);
  if (connData == null) {
    console.error(`WSACS: Couldn't find shlug with id ${readerId} \n in pool ${stringSlugPool()}`)
    return "not found";
  }

  const reader = await getReaderByID(readerId);
  if (reader == undefined) {
    throw EntityNotFound;
  }

  const instance = await getInstanceByReaderID(readerId);
  const equipment = instance ? await getEquipmentByID(instance.equipmentID) : null;
  const makerspaceForWhomeIWelcome = await getMakerspaceOfWelcomeReader(reader.id);
  const [paired, tag, label] = pairedLabel(instance, equipment, makerspaceForWhomeIWelcome);

  if (!paired) {
    await createLog(
      `{user} commanded unpaired {access_device}'s state to ${state}.`,
      "admin",
      { id: executingUser.id, label: getUsersFullName(executingUser) },
      { id: reader.id, label: reader.name }
    );
  } else {
    await createLog(
      `{user} commanded ${tag}'s state to ${state}.`,
      "admin",
      { id: executingUser.id, label: getUsersFullName(executingUser) }, label
    );
  }

  sendToShlugUnprompted(connData, { "State": state });
  return "success";
}

// Log helper
export async function wsApiLog(
  message: string,
  category: string | undefined,
  ...entities: { id: any; label: string }[]
) {
  if (!API_NORMAL_LOGGING) {
    return;
  }
  createLog(message, category, ...entities);
}


interface ConnectionData {
  ws: ws.WebSocket
  currentState: string

  readerId?: number

  alreadyComplainedAboutInvalidReader: boolean;
  toShlugSeqNum: number
}

// Sends a message to a shlug 
function sendToShlugRaw(connData: ConnectionData, data: string) {
  connData.ws.send(data);
}

/**
 * Send a message from the server to the shlug
 * Used for things such as sending state, reconfiguring
 * @param connData State data for this connection
 * @param data the data to send. A sequence number will be added to this
 */
function sendToShlugUnprompted(connData: ConnectionData, data: any) {

  const seqNum = connData.toShlugSeqNum;
  data["Seq"] = seqNum;
  connData.toShlugSeqNum++;
  const s: string = JSON.stringify(data);

  sendToShlugRaw(connData, s);
}

/**
 * 
 * @param connData State data for this connection
 * @param data the data to send. A sequence number will be added to this 
 * @param replyTo the message number to respond to
 */
function replyToShlug(connData: ConnectionData, data: any, replyTo: number) {
  var toSend = data as ShlugResponse;
  toSend.Seq = replyTo;

  sendToShlugRaw(connData, JSON.stringify(toSend));
}

/**
 * Create a new connection state for a web socket
 * @param ws the websocket handle for this reader
 * @returns the new ConnectionData to work with
 */
function initConnectionData(ws: ws.WebSocket): ConnectionData {
  return { ws: ws, toShlugSeqNum: 0, currentState: "Idle", alreadyComplainedAboutInvalidReader: false };
}

/**
 * Check if a user is authorized to use a machine
 * @param uid the *CARD* UID to check for
 * @param readerId the ID of the reader that is being checked
 * @param inResponse the response so far to add to
 * @returns the response message
 */
async function authorizeUIDToUnlock(uid: string, readerId: number, inResponse: ShlugResponse): Promise<ShlugResponse> {
  try {
    // We should always return Auth to show we are an auth response
    inResponse.Auth = uid;
    inResponse.AuthTo = "Unlocked";

    const reader = await getReaderByID(readerId);
    if (reader == null) {
      submitReaderLog(null, new Date(), { "WsEvent": "CantProcessUnlock", "CantProcessReason": "reader not found" });

      inResponse.Verified = 0;
      inResponse.Error = "Failed to retrieve info about reader";
      inResponse.Reason = "server-error";
      return inResponse
    }
    // Find User
    const user = await getUserByCardTagID(uid);
    // Find Machine Instance
    const machineInst = await getInstanceByReaderID(readerId);

    var machine: EquipmentRow | undefined;
    if (machineInst) {
      try {
        machine = await getEquipmentByID(machineInst.equipmentID);
        if (machine == null) {
          // bizzare error handling bc api getters can be inconsistent
          throw EntityNotFound;
        }
      } catch (EntityNotFound) {
        machine = undefined;
      }
    }

    if (user == null) {
      wsApiLog("UID {conceal} failed to activate {machine} - {equipment} with error '{error}'", "auth", { id: 0, label: uid ?? "undefined_uid" }, { id: reader.id, label: reader.name ?? "undefined" }, { id: machine?.id, label: machine?.name ?? "unknown machine" }, { id: 406, label: "User does not exist" });

      inResponse.Error = "User does not exist";
      inResponse.Reason = "unknown-uid";
      return inResponse;
    }
    inResponse.Role = user.privilege;

    // Find Machine
    if (machine == null) {
      if (reader?.SN == null) {
        wsApiLog("{user} failed to swipe into a machine with error '{error}'", "auth", { id: user.id, label: getUsersFullName(user) }, { id: reader.machineID, label: `Machine ${reader.machineID} does not exist` });
        inResponse.Error = "Machine does not exist";
      } else {
        wsApiLog("{user} failed to swipe into a machine: Reader {access_device} is not paired with a machine instance", "auth", { id: user.id, label: getUsersFullName(user) }, { id: readerId, label: reader?.name });
        inResponse.Error = "Reader not paired with a machine instance";
      }
      inResponse.Reason = "unknown-machine";
      return inResponse;
    }

    //Admin bypass. Skip Welcome and training check.
    if (user.admin) {
      wsApiLog("{user} has activated {access_device} - {equipment} with ADMIN access", "auth", { id: user.id, label: getUsersFullName(user) }, { id: reader?.id, label: reader?.name }, { id: machine.id, label: machine.name });
      createEquipmentSession(machine.id, user.id, reader.name ?? undefined);
      inResponse.Verified = 1;
      return inResponse;
    }

    // Find Makerspace
    const machineMakerspace = (await getRoomByID(machine.roomID))?.zoneID

    // Hold Check
    if (await hasActiveHolds(user.id)) {
      wsApiLog("{user} failed to swipe into {access_device} - {equipment} due to an active hold", "auth",
        { id: user.id, label: getUsersFullName(user) },
        { id: reader?.id, label: reader?.name },
        { id: machine.id, label: machine.name }
      )

      inResponse.Verified = 0;
      inResponse.Error = "User has an active hold";
      inResponse.Reason = "active-hold"
      return inResponse;
    }

    // Restriction Check
    if (await hasRestriction(user.id, machineMakerspace ?? -1)) {
      wsApiLog("{user} failed to swipe into {access_device} - {equipment} due to an active restriction", "auth",
        { id: user.id, label: getUsersFullName(user) },
        { id: reader?.id, label: reader?.name },
        { id: machine.id, label: machine.name }
      )
      inResponse.Verified = 0;
      inResponse.Error = "User has an active restriction"
      inResponse.Reason = "active-restriction"
      return inResponse;
    }

    // Manager bypass. Skip welcome and training check.
    if (typeof (machineMakerspace) === "number") {
      const userManagerPerms = await getUserManagerPerms(user.id);
      if (userManagerPerms.includes(machineMakerspace)) {
        wsApiLog("{user} has activated {access_device} - {equipment} with MANAGER access", "auth", { id: user.id, label: getUsersFullName(user) }, { id: reader?.id, label: reader?.name }, { id: machine.id, label: machine.name });
        createEquipmentSession(machine.id, user.id, reader.name ?? undefined);
        inResponse.Verified = 1;
        return inResponse;
      }
    }

    //If needs welcome, check that room swipe has occured in the zone today
    if (machine.needsWelcome && !(process.env.GLOBAL_WELCOME_BYPASS == "TRUE")) {
      const welcomed = await hasSwipedToday(machine.roomID, user.id);
      if (!welcomed) {
        wsApiLog("{user} failed to swipe into {machine} -{equipment} with error '{error}'", "auth",
          { id: user.id, label: getUsersFullName(user) },
          { id: reader.id, label: reader?.name ?? "undefined" },
          { id: machine.id, label: machine.name },
          { id: 401, label: "User requires Welcome" });

        inResponse.Verified = 0;
        inResponse.Error = "User requires Welcome";
        inResponse.Reason = "no-welcome";
        return inResponse;
      }
    }

    //Check all makerspace trainings
    if (!(process.env.GLOBAL_TRAINING_BYPASS == "TRUE") && !(await hasZoneTrainings(machineMakerspace ?? -1, user.id))) {
      wsApiLog(`{user} failed to swipe into {machine} - {equipment} due to incomplete makerspace trainings`, "auth",
        { id: user.id, label: getUsersFullName(user) },
        { id: machine.id, label: reader.name ?? "undefined" },
        { id: machine.id, label: machine.name }
      );

      inResponse.Verified = 0;
      inResponse.Error = "Incomplete trainings";
      inResponse.Reason = "missing-training";
      return inResponse;
    }

    //Check all room trainings
    if (!(process.env.GLOBAL_TRAINING_BYPASS == "TRUE") && !(await hasRoomTrainings(machine.roomID, user.id))) {
      wsApiLog(`{user} failed to swipe into {machine} - {equipment} due to incomplete room trainings`, "auth",
        { id: user.id, label: getUsersFullName(user) },
        { id: machine.id, label: reader.name ?? "undefined" },
        { id: machine.id, label: machine.name }
      );

      inResponse.Verified = 0;
      inResponse.Error = "Incomplete trainings";
      inResponse.Reason = "missing-training";
      return inResponse;
    }

    //Check that all required equipment trainings are passed
    if (!(process.env.GLOBAL_TRAINING_BYPASS == "TRUE") && !(await hasTrainingModules(user, machine.id))) {
      const incompleteTrainings = await getMissingTrainingModules(user, machine.id);
      var incompleteTrainingsStr = ""
      incompleteTrainings.forEach((module, i) => {
        incompleteTrainingsStr += module.name;
        if (i < incompleteTrainings.length - 1) incompleteTrainingsStr += ", ";
      });
      wsApiLog(`{user} failed to swipe into {machine} - {equipment} with error '{error}' [${incompleteTrainingsStr}]`, "auth",
        { id: user.id, label: getUsersFullName(user) },
        { id: machine.id, label: reader.name ?? "undefined" },
        { id: machine.id, label: machine.name },
        { id: 401, label: "Incomplete trainings" });

      inResponse.Verified = 0;
      inResponse.Error = "Incomplete trainings";
      inResponse.Reason = "missing-training";
      return inResponse;
    }

    //Check that equipment access check is completed
    if (!(process.env.GLOBAL_ACCESS_CHECK_BYPASS == "TRUE") && !(await isApproved(user.id, machine.id))) {
      wsApiLog("{user} failed to swipe into {machine} - {equipment} with error '{error}'", "auth",
        { id: user.id, label: getUsersFullName(user) },
        { id: machine.id, label: reader.name },
        { id: machine.id, label: machine.name ?? "undefined" },
        { id: 401, label: "Missing Staff Approval" });
      inResponse.Verified = 0;
      inResponse.Error = "Missing Staff Approval";
      inResponse.Reason = "no-approval";
      return inResponse;
    }

    // Success
    wsApiLog("{user} has activated {machine} - {equipment}", "auth",
      { id: user.id, label: getUsersFullName(user) },
      { id: reader.id, label: reader.name ?? "undefined" },
      { id: machine.id, label: machine.name });

    createEquipmentSession(machine.id, user.id, reader.name);
    inResponse.Verified = 1;
    return inResponse;
  } catch (err) {
    wsApiLog(`Unhandled error when authorizing on {access_device} - ${err}`, "auth", { id: readerId, label: (await getReaderByID(readerId))?.name ?? "unknown device" })
    inResponse.Role = "unknown role";
    inResponse.Verified = 0;
    inResponse.Error = "Unknown Error";
    inResponse.Reason = "server-error";
    return inResponse;
  }
}

async function welcomeUID(uid: string, readerID: number, inResponse: ShlugResponse): Promise<ShlugResponse> {
  inResponse.Auth = uid;
  inResponse.AuthTo = "Welcomed";

  const reader = await getReaderByID(readerID);
  const user = await getUserByCardTagID(uid);

  const makerspace = await getMakerspaceOfWelcomeReader(readerID);
  if (makerspace == null) {
    await wsApiLog("failed to welcome {user} with {access_device}. Reader not paired with makerspace. MisconfigurationPossible ?", "status", { id: user?.id ?? 0, label: user ? getUsersFullName(user) : "Unknown User" }, { id: readerID, label: reader?.name ?? "unknown reader" });
    inResponse.Error = "Not paired with makerspace";
    inResponse.Verified = 0;
    return inResponse;
  }

  if (user == null) {
    inResponse.Error = "user not found";
    inResponse.Verified = 0;
    // TODO: Report as such
    wsApiLog("UID {conceal} failed to swipe into {makerspace} with error {error}", "welcome", { id: 0, label: uid }, { id: makerspace.id, label: makerspace.name }, { id: 406, label: "User does not exist" });
    return inResponse;
  }
  try {
    const rooms = await getRoomsByZone(makerspace.id);
    for (let i = 0; i < rooms.length; i++) {
      // TODO: MakerspaceSwipes not RoomSwipes
      await swipeIntoRoom(rooms[i].id, user.id);
    }
    inResponse.Verified = 1;
    await wsApiLog("{user} has signed into {makerspace}", "welcome", { id: user.id, label: getUsersFullName(user) }, { id: makerspace.id, label: makerspace.name });
  } catch (e) {
    inResponse.Verified = 0;
    inResponse.Error = "Server Error";
    await wsApiLog(`{user} failed to sign into {makerspace} with exception ${JSON.stringify(e)}`, "welcome", { id: user.id, label: getUsersFullName(user) }, { id: makerspace.id, label: makerspace.name })
  }


  return inResponse;
}

async function authorizeUidToStateChange(uid: string, toState: string, readerId: number, inResponse: ShlugResponse): Promise<ShlugResponse> {
  inResponse.Auth = uid;
  const user = await getUserByCardTagID(uid);

  if (user == null) {
    inResponse.Error = "User not found";
    inResponse.Verified = 0;
    await wsApiLog(`UID {conceal} could not set state to ${toState}. No such user`, "status", { id: 0, label: uid });
    return inResponse;
  }
  const ulabel = { id: user.id, label: getUsersFullName(user) };
  const reader = await getReaderByID(readerId);
  if (reader == null) {
    inResponse.Error = "Reader not found";
    inResponse.Verified = 0;
    wsApiLog("Could not set state. Programming error trying to find reader", "status");
    return inResponse;
  }
  const rlabel = { id: reader.id, label: reader.name };

  if (!["Idle", "Lockout", "AlwaysOn"].includes(toState)) {
    inResponse.Error = "Invalid target state";
    inResponse.Verified = 0;
    await wsApiLog(`{user} could not set state to ${toState}. {error}`, "status", ulabel, { id: 0, label: "Invalid State" });
    return inResponse;
  }

  const instance = await getInstanceByReaderID(readerId);
  if (instance == null) {
    inResponse.Error = "Not paired with instance";
    inResponse.Verified = 0;
    await wsApiLog(`{user} could not set state to ${toState}. {error}`, "status", ulabel, { id: 0, label: "Not paired with instance" });
    return inResponse;
  }

  const equipment = await getEquipmentByID(instance.equipmentID);
  const room = await getRoomByID(equipment.roomID);
  const makerspace = await getZoneByID(room?.zoneID ?? 0);

  if (equipment == null || room == null || makerspace == null) {
    inResponse.Error = "Programmer Error";
    inResponse.Verified = 0;

    return inResponse;
  }
  const elabel = { id: equipment.id, label: equipment.name };

  const canUnlockBcAdmin = user.admin;
  const canUnlockBcManager = makerspace?.id ? (await getUserManagerPerms(user.id)).includes(makerspace.id) : false;
  const canUnlockBcStaff = makerspace?.id ? (await getUserStaffPerms(user.id)).includes(makerspace.id) : false
  const canUnlock = canUnlockBcAdmin || canUnlockBcManager || canUnlockBcStaff;


  if (canUnlock) {
    const level = canUnlockBcAdmin ? "ADMIN" : (canUnlockBcManager ? "MANAGER" : "STAFF");
    await wsApiLog(`{user} set {equipment}-:{reader} with ${level} priveleges`, "status", ulabel, elabel, rlabel)
    inResponse.Verified = 1;
    inResponse.AuthTo = toState;
    return inResponse;
  } else {
    await wsApiLog(`{user} failed to set {equipment}:{reader} to ${toState}. {error}`, "status", ulabel, elabel, rlabel, { id: 0, label: "Insuffecient Permissions!" })
    inResponse.Error = "Insuffecient Perms";
    inResponse.Verified = 0;
    return inResponse;
  }
}

async function lookupMostRecentGitTagForTrack(trackname: string): Promise<string> {
  const github_api_url = 'https://api.github.com/repos/rit-construct-makerspace/access-control-firmware/releases';
  var tag = "";

  try {
    interface Version {
      tagname: string,
      name: string,
      published_at: Date,
    };
    await fetch(github_api_url).then(async resp => {
      if (resp.body == null) { return; }
      const res: any[] = await resp.json();

      var releases: Version[] = res.map(r => { return { tagname: r.tag_name as string, name: r.name as string, published_at: new Date(r.published_at) } });
      releases.sort((a, b) => (b.published_at.getTime() - a.published_at.getTime()))
      const release = releases.filter(v => v.name.startsWith(trackname))[0];
      if (release) {
        tag = release.tagname;
      } else {
        console.error(`Failed to find matching release for '${trackname}' track OTA`)
      }
    })
  } catch (e) {
    console.error("Failed to query github api for OTA version: ", e);
    return "";

  }
  return tag;
}

export async function getAvailableFirmwareTags(): Promise<string[]> {
  const github_api_url = 'https://api.github.com/repos/rit-construct-makerspace/access-control-firmware/releases';

  return await fetch(github_api_url).then(async resp => {
    if (resp.body == null) { return []; }
    const res: any[] = await resp.json();
    return res.map(o => o.tag_name)
  })
}

async function lookupGitTagForShlug(reader: ReaderRow): Promise<string | null> {
  const currentVer = reader.BEVer;
  const track = reader.targetFirmwareVersion ?? "stable";

  if (track == "no-ota") {
    return "";
  } else if (track == "stable") {
    const tag = await lookupMostRecentGitTagForTrack(track);
    if (tag == currentVer || tag == "") {
      return null;
    } else {
      return tag;
    }
  }

  // the track is just a github tag
  return reader.targetFirmwareVersion ?? null;
}

/**
 * Finds and packages data requested by the shlug from the server
 * @param connData state of the connection
 * @param requested_values list of keys that the shlug is requesting from us
 * @returns response containing those keys
 */
async function handleRequest(connData: ConnectionData | undefined, requested_values: string[], currentFWVersion: string): Promise<ShlugResponse> {
  const reader: ReaderRow | undefined = await getReaderByID(connData?.readerId ?? 0);

  var obj: ShlugResponse = { Seq: -1 };
  for (let value of requested_values) {
    switch (value) {
      case "Time":
        obj.Time = Math.floor(Date.now() / 1000);
        break;
      case "State":
        if (reader?.id == null) {
          wsApiLog(`Couldn't find requested reader information for id ${connData?.readerId}. Telling Idle`, "State")
          obj.State = "Idle";
        } else {
          const pairStatus: PairStatus = await getReaderPairStatus(reader.id);
          if (pairStatus == PairStatus.PairedAsWelcomer) {
            obj.State = "Welcoming";
          } else if (reader.state) {
            if (["Lockout", "Welcoming"].includes(reader.state)) {
              obj.State = reader.state;
            } else {
              obj.State = "Idle"
            }

          }
        }
        break;
      case "OTATag":
        if (reader == null) {
          break;
        }
        const gittag: string | null = await lookupGitTagForShlug(reader);
        if (gittag && gittag != currentFWVersion) {
          obj.OTATag = gittag;
        }
        break;
      default:
        console.error(`Invalid request from Shlug ${connData?.readerId}:`, value);
    }
  }
  return obj;
}

// What the shlug sends over websockets
interface ShlugMessage {
  SerialNumber?: string

  FWVersion?: string;
  FEVer?: string;
  BEVer?: string;
  HWVersion?: string;
  HWType?: string;
  Request?: string[];
  Message?: string;  // Log Message to echo to history
  Log?: string;      // Structured log message to save. Should be JSON 
  State?: string; // Current State
  UID?: string; // Reason for switching to that state

  Auth?: string; // UID to authorize
  AuthTo?: string // state that the person wants to go to

  Temp?: number

  Seq: number;
  Key?: string;
}
// What the server sends to the shlug in response to a ShlugMessage
interface ShlugResponse {
  Seq: number
  Connected?: boolean
  Auth?: string
  AuthTo?: string
  Verified?: number
  Role?: string
  Error?: string
  Reason?: string

  Time?: number /// unix timestamp
  State?: string
  OTATag?: string // git tag
}

/**
 * Validates that a websocket message is actually JSON from a shlug
 * @param ev The data that came over the websocket. Valid if textual json
 * @param req Information about the initial request (ip, flags, etc)
 * @returns a valid ShlugMessage on successful parsing. null on error
 */
function validateShlugMessage(ev: ws.MessageEvent, req: Request): ShlugMessage | undefined {
  if (typeof ev.data != 'string') {
    // malformed data
    console.error(`WSACS: Non-string data received from ${req.ip}`);
    return undefined;
  }
  var jdata: ShlugMessage;
  try {
    jdata = JSON.parse(ev.data as string) as ShlugMessage;
  } catch (err: any) {
    console.error(`WSACS: Text data from ${req.ip} was not valid JSON: ${err}. Text was: ${ev.data as string}`);
    return undefined;
  }
  if (jdata.Seq == null) {
    console.error(`WSACS: Received valid JSON  from ${req.ip} with no Sequence Number. Got ${JSON.stringify(jdata)}`);
    return undefined;
  }
  return jdata;
}

/**
 * Generates a human readable name for a reader
 * @returns a uniquely generated adjective-color-slug name
 */
async function generateUniqueHumanName() {
  const RANDOM_TRIES = 10;
  for (var i = 0; i < RANDOM_TRIES; i++) {
    const name = generateRandomHumanName();
    if ((await getReaderByName(name)) == null) {
      return name;
    }
  }
  return `${generateRandomHumanName()}-${randomInt(1000)}`
}

/**
 * Checks if a shlug is valid, paired, and authenticated
 * @param reader the machine that is trying to authenticate
 * @param submittedKey Key associated with that SN that a client gave
 * @returns true if that is a valid, paired shlug
 */
export async function authenticateReader(reader: ReaderRow, submittedKey: string): Promise<boolean> {
  if (!reader || !submittedKey) {
    return false;
  }
  if (reader?.pairTime == null || reader?.SN == null || reader?.readerKeyCycle == null) {
    return false;

  }
  const keyToMatch = await generateShlugKey(reader.pairTime, reader.SN, reader.readerKeyCycle);
  if (submittedKey != keyToMatch) {
    return false;
  }
  return true;
}



/**
 * Parses and handles the initial informational message sent by the shlug identifying itself
 * @param connData state of the connection
 * @param message the message that the shlug sent
 * @returns true on successful parse. False if missing fields or otherwise invalid
 */
async function handleBootupMessage(connData: ConnectionData, message: ShlugMessage, ws: ws.WebSocket, srcIp: string): Promise<boolean> {
  const hasSWVersions = (message.FWVersion != null) || (message.FEVer != null && message.BEVer != null);
  if (message.SerialNumber == null || message.Key == null || !hasSWVersions || message.HWVersion == null || message.HWType == null) {
    if (message.Key) {
      message.Key = "<sanitized>";
    }
    console.error(`WSACS: Missing fields in boot message from ${srcIp}. Got ${JSON.stringify(message)}`);
    submitReaderLog(null, new Date(), { "WsEvent": "bad boot msg", "BadBootMsgReason": "missing fields", "ReaderIP": srcIp, "message": message });
    ws.close(WSAPIError.InvalidMessageFormat, "Invalid Fields");
    return false;
  }
  var reader: ReaderRow | undefined = await getReaderBySN(message.SerialNumber ?? "");
  if (reader?.pairTime == null || reader?.SN == null) {
    wsApiLog(`WSACS: Request from unpaired shlug ${srcIp} (SN: ${reader?.SN}). Denying`, "status");
    console.error(`WSACS: Request from unpaired shlug ${srcIp}. Denying`);
    submitReaderLog(null, new Date(), { "WsEvent": "bad boot msg", "BadBootMsgReason": "unpaired", "ReaderIP": srcIp, "ReaderSN": reader?.SN, "message": message });
    ws.close(WSAPIError.Protocol, "Unpaired Reader. Rejected");
    return false;

  }

  if (!authenticateReader(reader, message.Key)) {
    wsApiLog(`WSACS: Invalid key from SN ${reader?.SN} on connect. Was it paired correctly?`, "status");
    message.Key = "<sanitized>";
    await submitReaderLog(null, new Date(), { "WsEvent": "bad boot msg", "BadBootMsgReason": "wrong key", "ReaderIP": srcIp, "ReaderSN": reader?.SN, "message": message });
    console.error(`WSACS: Invalid key from SN ${reader?.SN} on connect.`);
    ws.close(WSAPIError.Unauthenticated, "Invalid Key. Rejected")
    return false;
  }


  connData.readerId = reader?.id;
  if (reader == null) {
    reader = await createReaderFromSN({
      SN: message.SerialNumber, name: await generateUniqueHumanName(),
    });
    console.log("WSACS: Creating new Reader for SN ", message.SerialNumber);
    connData.readerId = reader?.id;


    if (reader == undefined) {
      wsApiLog("Failed to create new access device. Error '{error}'", "status", { id: 400, label: "Reader does not exist" });
      return false;
    }
    else {
      wsApiLog("New Access Device {access_device} registered", "status", { id: reader?.id, label: reader?.name })
    }
  }

  const instance = await getInstanceByReaderID(reader.id);
  const equipment = instance ? await getEquipmentByID(instance.equipmentID) : null;
  let offlineForSec = null;
  if (reader?.lastStatusTime) {
    let offlineMs = new Date().getTime() - reader.lastStatusTime.getTime();
    offlineForSec = Math.floor(offlineMs / 1000);

  }
  submitReaderLogWithInstance(reader.id, instance?.id ?? null, new Date(), {
    "WsEvent": "open",
    "ReaderIP": srcIp,
    "OfflineFor": offlineForSec,
  });


  connData.readerId = reader.id;

  let newState: string = message.State ?? reader.state;
  if ((message?.Request ?? []).includes("State")) {
    // If requesting a new state, don't blindly accept a new one
    // Wait for request handler to do logic about this
    newState = reader.state;
  }

  // update with new info
  await updateReaderStatus({
    id: reader.id,
    machineID: undefined,
    machineType: "",
    zone: "",
    temp: 0,
    state: newState,
    currentUID: "",
    recentSessionLength: reader.recentSessionLength,
    lastStatusReason: reader.lastStatusReason,
    scheduledStatusFreq: reader.scheduledStatusFreq,
    helpRequested: reader.helpRequested,
    BEVer: message.BEVer ?? message.FWVersion ?? undefined,
    FEVer: message.FEVer ?? message.FWVersion ?? undefined,
    HWVer: message.HWVersion ?? undefined,
    SN: message.SerialNumber,
  });

  return true;
}

/**
 * handles a state change as told by the shlug
 * @param reader information about the reader that is changing
 * @param newState the state the shlug changed to
 * @param activeUID the active UID if there is one. null if no card inserted
 */
async function handleStateUpdateMessage(reader: ReaderRow, newState: string, activeUID: string | undefined, temp: number | undefined, nextAppVersion: string | undefined) {
  const timeOfChange: Date = new Date();
  const oldState = reader.state;
  const oldUID = reader.currentUID;

  reader.state = newState;
  reader.currentUID = activeUID ?? "";
  reader.lastStatusTime = timeOfChange;
  reader.lastStatusReason = "websocket-poll";

  if (reader.recentSessionLength == null) {
    reader.recentSessionLength = 0;
  }

  const user = await getUserByCardTagID(oldUID ?? "");
  const instance = await getInstanceByReaderID(reader.id);
  const equipment = instance ? await getEquipmentByID(instance.equipmentID) : null;
  const tag = (equipment == null) ? "reader {access_device} (unpaired)" : ("{equipment} instance " + (instance?.name ?? "unknown instance"))
  const label: { id: number, label: string } = (equipment == null) ? { id: reader.id, label: reader.name } : { id: equipment.id, label: equipment.name ?? "unknown equipment" }


  if (oldState != newState) {
    if (user == null) {
      wsApiLog(`State of ${tag} changed: ${oldState} -> ${newState}`, "state", label);
    } else {
      wsApiLog(`{user} changed state of ${tag}: ${oldState} -> ${newState}`, "state", { id: user.id ?? 0, label: user ? getUsersFullName(user) : "NULL" }, label);
    }
    submitReaderLogWithInstance(reader.id, instance?.id ?? null, new Date(), { "ACSEvent": "StateChange", "From": oldState, "To": newState, "User": user?.id })
    if (newState == "Unlocked") {
      reader.sessionStartTime = new Date();
      reader.recentSessionLength = 0;
    }

    if (oldState == "Unlocked" && reader.recentSessionLength > MIN_SESSION_LENGTH) {
      // end last session normally
      reader.currentUID = activeUID ?? '';
      const timeString = new Date(reader.recentSessionLength * 1000).toISOString().slice(11, 19);

      if (instance == null || equipment == null) {
        if (user != null) {
          await createLog(`{user} signed out of {access_device} that was not paired with any instance (Unpaired while in use) (Session: ${timeString})`, "status", { id: user.id, label: getUsersFullName(user) }, { id: reader.id, label: reader.name ?? "undefined" });
        }
      } else {
        // Update equipment session that was created when we authed
        await setLatestEquipmentSessionLength(equipment.id, reader.recentSessionLength, reader.name);
        if (user != null) {
          await createLog(`{user} signed out of {equipment} (Session: ${timeString})`, "status", { id: user.id, label: getUsersFullName(user) }, label);
        }
      }
    }
  }
  if (newState == "Unlocked") {
    const now = new Date();
    const then = reader.sessionStartTime ?? new Date(); // if not there, set ot 0
    const elapsedSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    reader.recentSessionLength = elapsedSeconds;
  }
  reader.temp = temp ?? reader.temp;
  reader.FEVer = nextAppVersion ?? reader.FEVer;
  await updateReaderStatus(reader);

}
/**
 * Check if we need to send a response
 * If nothing was asked for, no need to send it
 * @param resp the message to check
 * @returns true if we should send this message to the reader
 */
function isReplyWorthSending(resp: ShlugResponse): boolean {
  if (resp.Verified || resp.Auth || resp.Error || resp.Reason || resp.Role || resp.State || resp.Time || resp.Connected) {
    return true
  }
  return false
}

/**
 * Handler for the ACS Websocket API
 * @param ws handle for websocket
 * @param req data from the original request to the endpoint (one per shlug)
 */
export async function ws_acs_api(ws: ws.WebSocket, req: Request) {
  var connData: ConnectionData = initConnectionData(ws);
  console.log(`WSACS: Websocket opened to ${req.ip}`);
  submitReaderLog(null, new Date(), { "WsEvent": "initial connect", "IP": req.ip })
  try {
    ws.onclose = async function (ev: ws.CloseEvent) {
      try {
        if (connData.readerId == null) {
          // Connection was never associated with a real reader (boot message never sent, probably something fishy)
          console.error(`WSACS: Websocket from non-reader ${req.ip} closed with code ${ev.code} ${ev.reason}`);
          submitReaderLog(null, new Date(), { "WsEvent": "close nonreader", "IP": req.ip, "WsCloseCode": ev.code, "WsCloseReason": ev.reason });
          return;
        }
        let reader: ReaderRow | undefined = await getReaderByID(connData.readerId);
        if (reader == null) {
          await submitReaderLog(null, new Date(), {
            "WsEvent": "closed",
            "WsClosedCode": ev.code,
            "WsClosedReason": ev.reason,
            "IP": req.ip,
          });
        } else {
          await submitReaderLog(reader.id, new Date(), {
            "WsEvent": "closed",
            "WsClosedCode": ev.code,
            "WsClosedReason": ev.reason,
          });
        }
        removeConnection(connData);
      } catch (e) {
        console.error(`WSACS: Close Exception: ${e}`)
      }

    };

    ws.onerror = async function (ev: ws.ErrorEvent) {

      await submitReaderLog(connData.readerId ?? null, new Date(), { "WsEvent": "error", "WsErrorMsg": ev.message });
      console.error(`WSACS: websocket error ${ev.error} - ${ev.type}: ${ev.message}`)
      ws.close(WSAPIError.Protocol, "got unrecoverable error");
    }

    ws.onmessage = async function (ev: ws.MessageEvent) {
      try {
        const shlugMessage: ShlugMessage | undefined = validateShlugMessage(ev, req);
        if (shlugMessage == null) {
          console.error(`Invalid Shlug Message: ${JSON.stringify(ev.data)}. Forcing reconnect`);
          await submitReaderLog(connData.readerId ?? null, new Date(), { "WsEvent": "invalid message", "Data": ev.data });

          ws.close(WSAPIError.InvalidMessageFormat, "Invalid Message");
          return;
        }

        // First Message is special, identifies the shlug to the server
        if (shlugMessage.Seq === 0) {
          // Bootup message
          if (!(await handleBootupMessage(connData, shlugMessage, ws, req.ip ?? "unknown ip"))) {
            // failed to setup  
            console.error("WSACS: Incorrect Boot Message. Forcing Reconnect")
            ws.close(WSAPIError.BadBootMessage, "Invalid Boot Message");

            return;
          }
        }
        if (connData.readerId == null) {
          console.error("WSACS: Can not process WSAPI message -> forcing disconnect. Null reader ID: ")
          submitReaderLog(null, new Date(), { "WsEvent": "cant process", "CantProcessReason": "NullReaderID", "message": ev.data });
          ws.close(WSAPIError.Protocol, "Server couldnt process due to null reader id");
          return;
        }

        addOrUpdateConnection(connData);
        // Get reader that was setup by handleBootupMessage
        var reader = await getReaderByID(connData.readerId ?? 0);
        if (reader == null) {
          submitReaderLog(null, new Date(), { "WsEvent": "undefined reader", "ReaderIP": req.ip, "ReaderID": connData?.readerId });
          console.error(`Failed to find entry for device. Forcing Reconnect. ID: ${connData.readerId}, Last State: ${connData.currentState}. IP: ${req.ip}: ${JSON.stringify(shlugMessage)}`);
          // Closing the websocket will make it reauth and hopefully tell us its id
          ws.close(WSAPIError.Protocol, "No Device Found");
          return;
        }
        var response: ShlugResponse = await handleRequest(connData, shlugMessage.Request || [], reader.BEVer);
        if (shlugMessage.Seq == 0) {
          // always send a response back on connect
          response.Connected = true;
        }
        if (shlugMessage.Message) {
          const instance = await getInstanceByReaderID(reader.id);
          const machine =instance ?  await getEquipmentByID(instance.equipmentID) : undefined;
          const makerspaceForWhomeIWelcome = await getMakerspaceOfWelcomeReader(reader.id);
          const [paired, tag, label] = pairedLabel(instance, machine, makerspaceForWhomeIWelcome);
          if(paired){
            wsApiLog(`{access_device} - ${tag} message: ${shlugMessage.Message}`, "message", label, { id: reader.id, label: reader.name }, { id: machine.id, label: machine.name })
          } else {
            wsApiLog(`{access_device} (unpaired) message: ${shlugMessage.Message}`, "message", { id: reader.id, label: reader.name }, { id: reader.id, label: reader.name })
          }
        }
        if (shlugMessage.Log) {
          try {
            await submitReaderLog(connData.readerId ?? null, new Date(), shlugMessage.Log);
          } catch (e: any) {
            wsApiLog(`Unable to submit Reader Log '${JSON.stringify(shlugMessage.Log)}': ${e}`, "status");
          }
        }
        if (shlugMessage.State) {
          await handleStateUpdateMessage(reader, shlugMessage.State, shlugMessage.UID, shlugMessage?.Temp, shlugMessage?.FEVer)
        }

        if (shlugMessage.Auth && (shlugMessage.AuthTo == null || shlugMessage.AuthTo == "Unlocked")) {
          response = await authorizeUIDToUnlock(shlugMessage?.Auth, connData.readerId ?? 0, response)
        } else if (shlugMessage.Auth && shlugMessage.AuthTo === "Welcomed" && shlugMessage.Auth) {
          response = await welcomeUID(shlugMessage.Auth, connData.readerId, response)
        } else if (shlugMessage.Auth && shlugMessage.AuthTo) {
          response = await authorizeUidToStateChange(shlugMessage.Auth, shlugMessage.AuthTo, connData.readerId, response);
        }
        if (isReplyWorthSending(response)) {
          replyToShlug(connData, response, shlugMessage.Seq);
        }
      } catch (e: any) {
        wsApiLog(`WSACS: Message Exception: ${e}`, "status");
        console.error(`WSACS: Message Exception: ${e}: ${e?.stack}`)
      }

    }

  } catch (e) {
    wsApiLog(`WSACS: Exception: ${e}`, "status");
    console.error(`WSACS: Exception: ${e}`)
  }
}
