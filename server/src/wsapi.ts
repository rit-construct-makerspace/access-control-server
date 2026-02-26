import { Request } from "express";
import * as ws from "ws";
import { createLog } from "./repositories/AuditLogs/AuditLogRepository.js";
import { EquipmentInstancesRow, EquipmentRow, UserRow, MakerspaceRow, AccessControllerRow, AccessControllerState, DeviceRow } from "./db/tables.js";
import { getEquipmentByID, getMissingTrainingModules, hasTrainingModules } from "./repositories/Equipment/EquipmentRepository.js";
import { getUserByCardTagID, getUserManagerPerms, getUsersFullName, getUserStaffPerms } from "./repositories/Users/UserRepository.js";
import { EntityNotFound } from "./EntityNotFound.js";
import { createEquipmentSession, endLatestEquipmentSession } from "./repositories/Equipment/EquipmentSessionsRepository.js";
import { getRoomByID, getRoomsByMakerspace, hasRoomTrainings, hasSwipedToday, swipeIntoRoom } from "./repositories/Rooms/RoomRepository.js";
import { isApproved } from "./repositories/Equipment/AccessChecksRepository.js";
import { getInstanceByAccessControllerID, getInstanceByReaderID } from "./repositories/Equipment/EquipmentInstancesRepository.js";
import { randomInt } from "crypto";
import { generateRandomHumanName } from "./data/humanReadableNames.js";
import { generateShlugKey } from "./resolvers/readersResolver.js";
import { hasActiveHolds } from "./repositories/Holds/HoldsRepository.js";
import { hasRestriction } from "./repositories/Restrictions/RestrictionsRepository.js";
import { getMakerspaceByID, hasMakerspaceTrainings } from "./repositories/Makerspaces/MakerspaceRespository.js";
import * as DeviceRepo from "./repositories/Devices/DeviceRepository.js";
import * as AccessControllerRepo from "./repositories/Devices/AccessControllerRepository.js";
import * as CoreRepo from "./repositories/Devices/CoreRepository.js";
import { GraphQLError } from "graphql";
import { submitReaderLog } from "./repositories/Readers/ReaderRepository.js";
import { oldStateToStateEnum } from "./db/migrations/20260209155821_devices-overhaul.js";

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
  var entriesNoWs = entries.map(([_, data]) => ({ "id": data?.deviceID, "state": data?.currentState }));
  return JSON.stringify(entriesNoWs)
}

/**
 * Generate auditlog tag for a reader for history
 * @param instance 
 * @param machine 
 * @param makerspace 
 * @returns 
 */
function pairedLabel(instance?: EquipmentInstancesRow, machine?: EquipmentRow | null, makerspace?: MakerspaceRow | null): [boolean, string, { id: number, label: string }] {
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
  if (connData.deviceID == null) {
    console.error(`WSACS: Attempting to add invalid connection to active connections\n\tState: ${connData.currentState}\n\tID: ${connData.deviceID}\n\tSeqNum: ${connData.toShlugSeqNum}`)
    return;
  }
  slugPool.set(connData.deviceID, connData);
}
/**
 * removes a shlug connection from the pool
 * @param connData connection data associated with the shlug we want to remove
 * @returns true if the item was removed. false if it wasn't found
 */
function removeConnection(connData: ConnectionData): boolean {
  if (connData.deviceID == null) {
    console.error(`WSACS: Attempting to remove invalid connection to shlug from pool\nData: ${JSON.stringify(connData)}\nPool:${stringSlugPool()}`);
    return false;
  } else if (!slugPool.has(connData.deviceID)) {
    console.error(`WSACS: Attempting to remove nonexistent connection to shlug from pool\nData: ${JSON.stringify(connData)}\nPool:${stringSlugPool()}`);
    return false;
  }
  return slugPool.delete(connData.deviceID);
}

export async function identifyReader(executingUser: UserRow, deviceID: number, doIdentify: boolean): Promise<boolean> {
  let connData = slugPool.get(deviceID);
  if (connData == null) {
    console.error(`WSACS: Couldn't find shlug with id ${deviceID} \n in pool ${stringSlugPool()}`)
    return false;
  }

  const device = await DeviceRepo.getDeviceByID(deviceID);
  if (doIdentify) {
    wsApiLog("{user} identified {access_device}", "status", { id: executingUser.id, label: getUsersFullName(executingUser) }, { id: deviceID, label: device?.name ?? "unknown device" });
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

async function getSimpleController(deviceID: number): Promise<AccessControllerRow> {
  const accessControllers = await AccessControllerRepo.getAccessControllersByDeviceID(deviceID);
  if (accessControllers.length < 1) {
    throw EntityNotFound;
  } else if (accessControllers.length > 1) {
    throw new GraphQLError("Too many access controllers for old wsapi");
  }
  return accessControllers[0];
}

export function stateEnumToOldString(newState: AccessControllerState) {
  switch (newState) {
    case AccessControllerState.IDLE:
      return "Idle";
    case AccessControllerState.ALWAYS_ON:
      return "AlwaysOn";
    case AccessControllerState.LOCKED_OUT:
      return "Lockout";
    case AccessControllerState.FAULT:
      return "Fault";
    case AccessControllerState.UNLOCKED:
      return "Unlocked";
    case AccessControllerState.WELCOMING:
      return "Welcoming";
    default:
      return "Startup";
  }
}

/**
 * Sends a state to a shlug
 * @param readerId reader to send the state to
 * @param state the string representing the target state
 * @returns text description of success or failure
 */
export async function sendState(executingUser: UserRow, deviceID: number, state: AccessControllerState | "Restart"): Promise<string> {
  let connData = slugPool.get(deviceID);
  if (connData == null) {
    console.error(`WSACS: Couldn't find shlug with id ${deviceID} \n in pool ${stringSlugPool()}`)
    return "not found";
  }

  const device = await DeviceRepo.getDeviceByID(deviceID);
  if (device == undefined) {
    throw EntityNotFound;
  }

  const controller = await getSimpleController(device.id);

  const instance = await getInstanceByReaderID(controller.id);
  const equipment = instance ? await getEquipmentByID(instance.equipmentID) : null;
  const makerspaceForWhomeIWelcome = await DeviceRepo.getMakerspaceOfWelcomeDevice(device.id);
  const [paired, tag, label] = pairedLabel(instance, equipment, makerspaceForWhomeIWelcome);

  if (!paired) {
    await createLog(
      `{user} commanded unpaired {access_device}'s state to ${state}.`,
      "admin",
      { id: executingUser.id, label: getUsersFullName(executingUser) },
      { id: device.id, label: device.name }
    );
  } else {
    await createLog(
      `{user} commanded ${tag}'s state to ${state}.`,
      "admin",
      { id: executingUser.id, label: getUsersFullName(executingUser) }, label
    );
  }

  sendToShlugUnprompted(connData, { "State": state === "Restart" ? "Restart" : stateEnumToOldString(state) });
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

  deviceID?: number

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
async function authorizeUIDToUnlock(uid: string, deviceID: number, inResponse: ShlugResponse): Promise<ShlugResponse> {
  try {
    // We should always return Auth to show we are an auth response
    inResponse.Auth = uid;
    inResponse.AuthTo = "Unlocked";

    const device = await DeviceRepo.getDeviceByID(deviceID);
    if (device === undefined) {
      //submitReaderLog(null, new Date(), { "WsEvent": "CantProcessUnlock", "CantProcessReason": "reader not found" });

      inResponse.Verified = 0;
      inResponse.Error = "Failed to retrieve info about reader";
      inResponse.Reason = "server-error";
      return inResponse
    }
    // Find User
    const user = await getUserByCardTagID(uid);
    // Find Machine Instance
    const controller = await getSimpleController(device.id);
    const machineInst = await getInstanceByAccessControllerID(controller.id);

    var machine: EquipmentRow | undefined = undefined;
    if (machineInst) {
      try {
        machine = await getEquipmentByID(machineInst.equipmentID);
      } catch (EntityNotFound) {
        machine = undefined;
      }
    }

    if (user == null) {
      wsApiLog("UID {conceal} failed to activate {machine} - {equipment} with error '{error}'", "auth", { id: 0, label: uid ?? "undefined_uid" }, { id: device.id, label: device.name ?? "undefined" }, { id: machine?.id, label: machine?.name ?? "unknown machine" }, { id: 406, label: "User does not exist" });

      inResponse.Error = "User does not exist";
      inResponse.Reason = "unknown-uid";
      return inResponse;
    }

    // Find Machine
    if (machineInst === undefined || machine === undefined) {
      wsApiLog("{user} failed to swipe into a machine: Reader {access_device} is not paired with a machine instance", "auth", { id: user.id, label: getUsersFullName(user) }, { id: deviceID, label: device?.name });
      inResponse.Error = "Reader not paired with a machine instance";
      inResponse.Reason = "unknown-machine";
      return inResponse;
    }

    const room = (await getRoomByID(machine.roomID));
    const makerspaceID = room?.makerspaceID ?? -1;

    const canUnlockBcAdmin = user.admin;
    const canUnlockBcManager = makerspaceID ? (await getUserManagerPerms(user.id)).includes(makerspaceID) : false;
    const canUnlockBcStaff = makerspaceID ? (await getUserStaffPerms(user.id)).includes(makerspaceID) : false
    const canUnlock = canUnlockBcAdmin || canUnlockBcManager || canUnlockBcStaff;
    inResponse.Role = canUnlockBcAdmin ? "ADMIN" : (canUnlockBcManager ? "MANAGER" : (canUnlockBcStaff ? "STAFF" : (canUnlock ? "MAKER" : "UNKNOWN")));



    //Admin bypass. Skip Welcome and training check.
    if (canUnlockBcAdmin) {
      wsApiLog("{user} has activated {access_device} - {equipment} with ADMIN access", "auth", { id: user.id, label: getUsersFullName(user) }, { id: device?.id, label: device?.name }, { id: machine.id, label: machine.name });
      createEquipmentSession(machine.id, user.id, device.name ?? undefined);
      inResponse.Verified = 1;
      return inResponse;
    }

    if (user.archived) {
      wsApiLog("{user} failed to swipe into {access_device} - {euipment} due to being archived", "auth",
        { id: user.id, label: getUsersFullName(user) },
        { id: device?.id, label: device?.name },
        { id: machine.id, label: machine.name }
      );

      inResponse.Verified = 0;
      inResponse.Error = "User is archived";
      inResponse.Reason = "user-archived"
      return inResponse;
    }

    // Find Makerspace
    // Hold Check
    if (await hasActiveHolds(user.id)) {
      wsApiLog("{user} failed to swipe into {access_device} - {equipment} due to an active hold", "auth",
        { id: user.id, label: getUsersFullName(user) },
        { id: device?.id, label: device?.name },
        { id: machine.id, label: machine.name }
      )

      inResponse.Verified = 0;
      inResponse.Error = "User has an active hold";
      inResponse.Reason = "active-hold"
      return inResponse;
    }

    // Restriction Check
    if (await hasRestriction(user.id, makerspaceID)) {
      wsApiLog("{user} failed to swipe into {access_device} - {equipment} due to an active restriction", "auth",
        { id: user.id, label: getUsersFullName(user) },
        { id: device?.id, label: device?.name },
        { id: machine.id, label: machine.name }
      )
      inResponse.Verified = 0;
      inResponse.Error = "User has an active restriction"
      inResponse.Reason = "active-restriction"
      return inResponse;
    }

    // Manager bypass. Skip welcome and training check.
    if (canUnlockBcManager) {
      wsApiLog("{user} has activated {access_device} - {equipment} with MANAGER access", "auth", { id: user.id, label: getUsersFullName(user) }, { id: device?.id, label: device?.name }, { id: machine.id, label: machine.name });
      createEquipmentSession(machine.id, user.id, device.name ?? undefined);
      inResponse.Verified = 1;
      return inResponse;
    }

    //If needs welcome, check that room swipe has occured in the makerspace today
    if (machine.needsWelcome && !(process.env.GLOBAL_WELCOME_BYPASS == "TRUE")) {
      const welcomed = await hasSwipedToday(machine.roomID, user.id);
      if (!welcomed) {
        wsApiLog("{user} failed to swipe into {machine} -{equipment} with error '{error}'", "auth",
          { id: user.id, label: getUsersFullName(user) },
          { id: device.id, label: device?.name ?? "undefined" },
          { id: machine.id, label: machine.name },
          { id: 401, label: "User requires Welcome" });

        inResponse.Verified = 0;
        inResponse.Error = "User requires Welcome";
        inResponse.Reason = "no-welcome";
        return inResponse;
      }
    }

    //Check all makerspace trainings
    if (!(process.env.GLOBAL_TRAINING_BYPASS == "TRUE") && !(await hasMakerspaceTrainings(makerspaceID, user.id))) {
      wsApiLog(`{user} failed to swipe into {machine} - {equipment} due to incomplete makerspace trainings`, "auth",
        { id: user.id, label: getUsersFullName(user) },
        { id: machine.id, label: device.name ?? "undefined" },
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
        { id: machine.id, label: device.name ?? "undefined" },
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
        { id: machine.id, label: device.name ?? "undefined" },
        { id: machine.id, label: machine.name },
        { id: 401, label: "Incomplete trainings" });

      inResponse.Verified = 0;
      inResponse.Error = "Incomplete trainings";
      inResponse.Reason = "missing-training";
      return inResponse;
    }

    //Check that equipment access check is completed
    if (!(process.env.GLOBAL_ACCESS_CHECK_BYPASS == "TRUE") && (machine.requiresInPerson) && !(await isApproved(user.id, machine.id))) {
      wsApiLog("{user} failed to swipe into {machine} - {equipment} with error '{error}'", "auth",
        { id: user.id, label: getUsersFullName(user) },
        { id: machine.id, label: device.name },
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
      { id: device.id, label: device.name ?? "undefined" },
      { id: machine.id, label: machine.name });

    createEquipmentSession(machine.id, user.id, device.name);
    inResponse.Verified = 1;
    return inResponse;
  } catch (err) {
    wsApiLog(`Unhandled error when authorizing on {access_device} - ${err}`, "auth", { id: deviceID, label: (await DeviceRepo.getDeviceByID(deviceID))?.name ?? "unknown device" })
    inResponse.Role = "unknown role";
    inResponse.Verified = 0;
    inResponse.Error = "Unknown Error";
    inResponse.Reason = "server-error";
    return inResponse;
  }
}

async function welcomeUID(uid: string, deviceID: number, inResponse: ShlugResponse): Promise<ShlugResponse> {
  inResponse.Auth = uid;
  inResponse.AuthTo = "Welcomed";

  const device = await DeviceRepo.getDeviceByID(deviceID);
  const user = await getUserByCardTagID(uid);

  const makerspace = await DeviceRepo.getMakerspaceOfWelcomeDevice(deviceID);
  if (makerspace == null) {
    await wsApiLog("failed to welcome {user} with {access_device}. Reader not paired with makerspace. MisconfigurationPossible ?", "status", { id: user?.id ?? 0, label: user ? getUsersFullName(user) : "Unknown User" }, { id: deviceID, label: device?.name ?? "unknown reader" });
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
    const rooms = await getRoomsByMakerspace(makerspace.id);
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

async function authorizeUidToStateChange(uid: string, toState: string, deviceID: number, inResponse: ShlugResponse): Promise<ShlugResponse> {
  inResponse.Auth = uid;
  const user = await getUserByCardTagID(uid);

  if (user == null) {
    inResponse.Error = "User not found";
    inResponse.Verified = 0;
    await wsApiLog(`UID {conceal} could not set state to ${toState}. No such user`, "status", { id: 0, label: uid });
    return inResponse;
  }
  const ulabel = { id: user.id, label: getUsersFullName(user) };
  const reader = await DeviceRepo.getDeviceByID(deviceID);
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

  const controller = await getSimpleController(deviceID);
  const instance = await getInstanceByAccessControllerID(controller.id);
  if (instance == null) {
    inResponse.Error = "Not paired with instance";
    inResponse.Verified = 0;
    await wsApiLog(`{user} could not set state to ${toState}. {error}`, "status", ulabel, { id: 0, label: "Not paired with instance" });
    return inResponse;
  }

  const equipment = await getEquipmentByID(instance.equipmentID);
  const room = await getRoomByID(equipment.roomID);
  const makerspace = await getMakerspaceByID(room?.makerspaceID ?? 0);

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
  inResponse.Role = canUnlockBcAdmin ? "ADMIN" : (canUnlockBcManager ? "MANAGER" : (canUnlockBcStaff ? "STAFF" : (canUnlock ? "MAKER" : "UNKNOWN")));


  if (canUnlock) {
    await wsApiLog(`{user} set {equipment}-:{reader} with ${inResponse.Role} privileges`, "status", ulabel, elabel, rlabel)
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

async function lookupGitTagForShlug(device: DeviceRow): Promise<string | null> {
  const currentVer = device.hardwareVersion;
  const track = device.targetFirmware ?? "stable";

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
  return device.targetFirmware ?? null;
}

/**
 * Finds and packages data requested by the shlug from the server
 * @param connData state of the connection
 * @param requested_values list of keys that the shlug is requesting from us
 * @returns response containing those keys
 */
async function handleRequest(connData: ConnectionData | undefined, requested_values: string[], currentFWVersion: string): Promise<ShlugResponse> {
  const device = await DeviceRepo.getDeviceByID(connData?.deviceID ?? 0);

  var obj: ShlugResponse = { Seq: -1 };
  for (let value of requested_values) {
    switch (value) {
      case "Time":
        obj.Time = Math.floor(Date.now() / 1000);
        break;
      case "State":
        if (device?.id === undefined) {
          wsApiLog(`Couldn't find requested reader information for id ${connData?.deviceID}. Telling Idle`, "State")
          obj.State = "Idle";
        } else {
          const welcomeSpace = await DeviceRepo.getMakerspaceOfWelcomeDevice(device.id);
          const controller = await getSimpleController(device.id);
          if (welcomeSpace !== undefined) {
            obj.State = "Welcoming";
          } else if (controller.state) {
            if ([AccessControllerState.LOCKED_OUT].includes(controller.state)) {
              obj.State = "Lockout";
            } else {
              obj.State = "Idle"
            }

          }
        }
        break;
      case "OTATag":
        if (device === undefined) {
          break;
        }
        const gittag: string | null = await lookupGitTagForShlug(device);
        if (gittag && gittag != currentFWVersion) {
          obj.OTATag = gittag;
        }
        break;
      default:
        console.error(`Invalid request from Shlug ${connData?.deviceID}:`, value);
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
    if ((await DeviceRepo.getDeviceByName(name)) == null) {
      return name;
    }
  }
  return `${generateRandomHumanName()}-${randomInt(1000)}`
}

/**
 * Checks if a shlug is valid, paired, and authenticated
 * @param device the machine that is trying to authenticate
 * @param submittedKey Key associated with that SN that a client gave
 * @returns true if that is a valid, paired shlug
 */
export async function authenticateReader(device: DeviceRow, submittedKey: string): Promise<boolean> {
  if (!device || !submittedKey) {
    return false;
  }

  const keyToMatch = await generateShlugKey(device.pairTime, device.SN, device.keyCycle);
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
    //submitReaderLog(null, new Date(), { "WsEvent": "bad boot msg", "BadBootMsgReason": "missing fields", "ReaderIP": srcIp, "message": message });
    ws.close(WSAPIError.InvalidMessageFormat, "Invalid Fields");
    return false;
  }
  var device = await DeviceRepo.getDeviceBySN(message.SerialNumber ?? "");
  if (device?.pairTime === undefined || device?.SN === undefined) {
    wsApiLog(`WSACS: Request from unpaired shlug ${srcIp} (SN: ${device?.SN}). Denying`, "status");
    console.error(`WSACS: Request from unpaired shlug ${srcIp}. Denying`);
    //submitReaderLog(null, new Date(), { "WsEvent": "bad boot msg", "BadBootMsgReason": "unpaired", "ReaderIP": srcIp, "ReaderSN": reader?.SN, "message": message });
    ws.close(WSAPIError.Protocol, "Unpaired Reader. Rejected");
    return false;
  }

  if (!authenticateReader(device, message.Key)) {
    wsApiLog(`WSACS: Invalid key from SN ${device?.SN} on connect. Was it paired correctly?`, "status");
    message.Key = "<sanitized>";
    //await submitReaderLog(null, new Date(), { "WsEvent": "bad boot msg", "BadBootMsgReason": "wrong key", "ReaderIP": srcIp, "ReaderSN": reader?.SN, "message": message });
    console.error(`WSACS: Invalid key from SN ${device?.SN} on connect.`);
    ws.close(WSAPIError.Unauthenticated, "Invalid Key. Rejected")
    return false;
  }

  connData.deviceID = device?.id;

  const controller = await getSimpleController(device.id);
  const instance = await getInstanceByAccessControllerID(controller.id);
  const equipment = instance ? await getEquipmentByID(instance.equipmentID) : null;
  const core = await CoreRepo.getCoreByDeviceID(device.id);
  let offlineForSec = null;
  if (core?.lastStatusTime) {
    let offlineMs = new Date().getTime() - core.lastStatusTime.getTime();
    offlineForSec = Math.floor(offlineMs / 1000);
  }
  // submitReaderLogWithInstance(reader.id, instance?.id ?? null, new Date(), {
  //   "WsEvent": "open",
  //   "ReaderIP": srcIp,
  //   "OfflineFor": offlineForSec,
  // });


  connData.deviceID = device.id;

  let newState: string = message.State ?? controller.state ?? "";
  if ((message?.Request ?? []).includes("State")) {
    // If requesting a new state, don't blindly accept a new one
    // Wait for request handler to do logic about this
    newState = controller.state ?? "";
  }

  // update with new info
  await DeviceRepo.updateDevie(device);
  if (core !== undefined) {
    await CoreRepo.updateCore(core.getRow());
  }
  await AccessControllerRepo.updateAccessController(controller);

  return true;
}

function stringStateToEnumState(oldState: string): AccessControllerState {
  switch (oldState) {
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

/**
 * handles a state change as told by the shlug
 * @param reader information about the reader that is changing
 * @param newState the state the shlug changed to
 * @param activeUID the active UID if there is one. null if no card inserted
 */
async function handleStateUpdateMessage(device: DeviceRow, newState: string, activeUID: string | undefined, temp: number | undefined, nextAppVersion: string | undefined) {
  const timeOfChange: Date = new Date();
  const core = await CoreRepo.getCoreByDeviceID(device.id);
  const controller = await getSimpleController(device.id);

  if (core === undefined) { return; }

  const oldState = controller.state;
  const oldUID = core?.currentCardTag;

  controller.state = stringStateToEnumState(newState);
  core.currentCardTag = activeUID;
  core.lastStatusTime = timeOfChange;

  const user = await getUserByCardTagID(oldUID ?? "");
  const instance = await getInstanceByAccessControllerID(controller.id);
  const equipment = instance ? await getEquipmentByID(instance.equipmentID) : null;
  const tag = (equipment == null) ? "reader {access_device} (unpaired)" : ("{equipment} instance " + (instance?.name ?? "unknown instance"))
  const label: { id: number, label: string } = (equipment == null) ? { id: device.id, label: device.name } : { id: equipment.id, label: equipment.name ?? "unknown equipment" }


  if (oldState != oldStateToStateEnum(newState)) {
    if (user == null) {
      wsApiLog(`State of ${tag} changed: ${oldState} -> ${newState}`, "state", label);
    } else {
      wsApiLog(`{user} changed state of ${tag}: ${oldState} -> ${newState}`, "state", { id: user.id ?? 0, label: user ? getUsersFullName(user) : "NULL" }, label);
    }
    // submitReaderLogWithInstance(reader.id, instance?.id ?? null, new Date(), { "ACSEvent": "StateChange", "From": oldState, "To": newState, "User": user?.id })
    if (newState == "Unlocked") {
      core.sessionStartTime = new Date();
    }

    if (oldState == AccessControllerState.UNLOCKED) {
      // end last session normally
      core.currentCardTag = activeUID ?? '';

      if (instance == null || equipment == null) {
        if (user != null) {
          await createLog(
            `{user} signed out of {access_device} that was not paired with any instance (Unpaired while in use)`, "status",
            { id: user.id, label: getUsersFullName(user) },
            { id: device.id, label: device.name ?? "undefined" }
          );
        }
      } else {
        // Update equipment session that was created when we authed
        await endLatestEquipmentSession(equipment.id, device.name);
        if (user != null) {
          await createLog(`{user} signed out of {equipment}`, "status", { id: user.id, label: getUsersFullName(user) }, label);
        }
      }
    }
  }

  await DeviceRepo.updateDevie(device);
  await CoreRepo.updateCore(core.getRow());
  await AccessControllerRepo.updateAccessController(controller);

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
  // submitReaderLog(null, new Date(), { "WsEvent": "initial connect", "IP": req.ip })
  try {
    ws.onclose = async function (ev: ws.CloseEvent) {
      try {
        if (connData.deviceID == null) {
          // Connection was never associated with a real reader (boot message never sent, probably something fishy)
          console.error(`WSACS: Websocket from non-reader ${req.ip} closed with code ${ev.code} ${ev.reason}`);
          // submitReaderLog(null, new Date(), { "WsEvent": "close nonreader", "IP": req.ip, "WsCloseCode": ev.code, "WsCloseReason": ev.reason });
          return;
        }
        let device = await DeviceRepo.getDeviceByID(connData.deviceID);
        if (device === undefined) {
          await submitReaderLog(null, new Date(), {
            "WsEvent": "closed",
            "WsClosedCode": ev.code,
            "WsClosedReason": ev.reason,
            "IP": req.ip,
          });
        } else {
          await submitReaderLog(device.id, new Date(), {
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

      await submitReaderLog(connData.deviceID ?? null, new Date(), { "WsEvent": "error", "WsErrorMsg": ev.message });
      console.error(`WSACS: websocket error ${ev.error} - ${ev.type}: ${ev.message}`)
      ws.close(WSAPIError.Protocol, "got unrecoverable error");
    }

    ws.onmessage = async function (ev: ws.MessageEvent) {
      try {
        const shlugMessage: ShlugMessage | undefined = validateShlugMessage(ev, req);
        if (shlugMessage == null) {
          console.error(`Invalid Shlug Message: ${JSON.stringify(ev.data)}. Forcing reconnect`);
          await submitReaderLog(connData.deviceID ?? null, new Date(), { "WsEvent": "invalid message", "Data": ev.data });

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
        if (connData.deviceID == null) {
          console.error("WSACS: Can not process WSAPI message -> forcing disconnect. Null reader ID: ")
          submitReaderLog(null, new Date(), { "WsEvent": "cant process", "CantProcessReason": "NullReaderID", "message": ev.data });
          ws.close(WSAPIError.Protocol, "Server couldnt process due to null reader id");
          return;
        }

        addOrUpdateConnection(connData);
        // Get reader that was setup by handleBootupMessage
        var device = await DeviceRepo.getDeviceByID(connData.deviceID ?? -1);
        if (device === undefined) {
          submitReaderLog(null, new Date(), { "WsEvent": "undefined reader", "ReaderIP": req.ip, "ReaderID": connData?.deviceID });
          console.error(`Failed to find entry for device. Forcing Reconnect. ID: ${connData.deviceID}, Last State: ${connData.currentState}. IP: ${req.ip}: ${JSON.stringify(shlugMessage)}`);
          // Closing the websocket will make it reauth and hopefully tell us its id
          ws.close(WSAPIError.Protocol, "No Device Found");
          return;
        }
        var response: ShlugResponse = await handleRequest(connData, shlugMessage.Request || [], device.firmwareVersion ?? "");
        if (shlugMessage.Seq == 0) {
          // always send a response back on connect
          response.Connected = true;
        }
        if (shlugMessage.Message) {
          const controller = await getSimpleController(device.id);
          const instance = await getInstanceByAccessControllerID(controller.id);
          const machine = instance ? await getEquipmentByID(instance.equipmentID) : undefined;
          const makerspaceForWhomeIWelcome = await DeviceRepo.getMakerspaceOfWelcomeDevice(device.id);
          const [paired, tag, label] = pairedLabel(instance, machine, makerspaceForWhomeIWelcome);
          if (paired) {
            wsApiLog(`{access_device} - ${tag} message: ${shlugMessage.Message}`, "message", label, { id: device.id, label: device.name })
          } else {
            wsApiLog(
              `{access_device} (unpaired) message: ${shlugMessage.Message}`, "message",
              { id: device.id, label: device.name },
              { id: device.id, label: device.name }
            );
          }
        }
        if (shlugMessage.Log) {
          try {
            await submitReaderLog(connData.deviceID ?? null, new Date(), shlugMessage.Log);
          } catch (e: any) {
            wsApiLog(`Unable to submit Reader Log '${JSON.stringify(shlugMessage.Log)}': ${e}`, "status");
          }
        }
        if (shlugMessage.State) {
          await handleStateUpdateMessage(device, shlugMessage.State, shlugMessage.UID, shlugMessage?.Temp, shlugMessage?.FEVer)
        }

        if (shlugMessage.Auth && (shlugMessage.AuthTo == null || shlugMessage.AuthTo == "Unlocked")) {
          response = await authorizeUIDToUnlock(shlugMessage?.Auth, connData.deviceID ?? 0, response)
        } else if (shlugMessage.Auth && shlugMessage.AuthTo === "Welcomed" && shlugMessage.Auth) {
          response = await welcomeUID(shlugMessage.Auth, connData.deviceID, response)
        } else if (shlugMessage.Auth && shlugMessage.AuthTo) {
          response = await authorizeUidToStateChange(shlugMessage.Auth, shlugMessage.AuthTo, connData.deviceID, response);
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
