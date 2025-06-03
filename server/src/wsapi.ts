import { Request } from "express";
import * as ws from "ws";
import { createLog } from "./repositories/AuditLogs/AuditLogRepository.js";
import { createReaderFromSN, getReaderByID, getReaderByName, getReaderBySN, updateReaderStatus } from "./repositories/Readers/ReaderRepository.js";
import { EquipmentRow, ReaderRow, UserRow } from "./db/tables.js";
import { getUserByCardTagID, getUsersFullName } from "./repositories/Users/UserRepository.js";
import { getEquipmentByID, getMissingTrainingModules, hasAccessByID } from "./repositories/Equipment/EquipmentRepository.js";
import { EntityNotFound } from "./EntityNotFound.js";
import { Privilege, User } from "./schemas/usersSchema.js";
import { createEquipmentSession, setLatestEquipmentSessionLength } from "./repositories/Equipment/EquipmentSessionsRepository.js";
import { hasSwipedToday } from "./repositories/Rooms/RoomRepository.js";
import { isApproved } from "./repositories/Equipment/AccessChecksRepository.js";
import { getInstanceByReaderID } from "./repositories/Equipment/EquipmentInstancesRepository.js";
import { randomInt } from "crypto";
import { generateRandomHumanName } from "./data/humanReadableNames.js";
import { generateShlugKey } from "./resolvers/readersResolver.js";


const API_NORMAL_LOGGING = process.env.API_NORMAL_LOGGING == "true";
const API_DEBUG_LOGGING = process.env.API_DEBUG_LOGGING == "true";

const MIN_SESSION_LENGTH = 15

/**
 * Pool of active shlugs to send info to
 */
var slugPool: Map<number, ConnectionData> = new Map();

function stringSlugPool() {
    var entries = Array.from(slugPool.entries());
    var entriesNoWs = entries.map(([_, data]) => ({ "id": data?.readerId, "timeLastSent": data?.timeLastSent, "state": data?.currentState }));
    return JSON.stringify(entriesNoWs)
}

/** 
 * adds a connection to the pool such that it can be communicated with
 * @param connData connection data associated with the shlug
 */
async function addOrUpdateConnection(connData: ConnectionData) {
    if (connData.readerId == null) {
        console.error(`WSACS: Attempting to add invalid connection to active connections\nState: ${connData.currentState}\nID: ${connData.readerId}\nSeqNum: ${connData.toShlugSeqNum}`)
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
        wsApiLog("{user} identified {access_device}", "status", { id: executingUser.id, label: getUsersFullName(executingUser) }, { id: readerId, label: reader.name ?? "unknown reader" });
    }

    sendToShlugUnprompted(connData, { "Identify": doIdentify });

    return true;
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

    if (instance == null || equipment == null) {
        await createLog(
            `{user} commanded {access_device}'s state to ${state} (unpaired).`,
            "admin",
            { id: executingUser.id, label: getUsersFullName(executingUser) },
            { id: reader.id, label: reader.name }
        );
    } else {
        const equipmentLabel = { id: equipment?.id, label: equipment ? equipment?.name : "unknown equipment" }
        await createLog(
            `{user} commanded {equipment} instance ${instance.name}'s state to ${state}.`,
            "admin",
            { id: executingUser.id, label: getUsersFullName(executingUser) },
            equipmentLabel
        );

    }

    sendToShlugUnprompted(connData, { "State": state });
    return "success";
}


// Log helper
export async function wsApiDebugLog(
    message: string,
    category: string | undefined,
    ...entities: { id: any; label: string }[]
) {
    if (!API_DEBUG_LOGGING) {
        return;
    }
    createLog(message, category, ...entities);
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
    timeLastSent?: Date
}

// Sends a message to the shlug taking into account the time between messages 
// The shlug cannot handle messages more often than ~1 a second
function sendToShlugRaw(connData: ConnectionData, data: string) {

    const now = new Date();
    connData.timeLastSent = now;
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
    connData.timeLastSent = new Date();
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
async function authorizeUid(uid: string, readerId: number, inResponse: ShlugResponse): Promise<ShlugResponse> {
    try {
        const reader = await getReaderByID(readerId);
        if (reader == null) {
            wsApiDebugLog(`Failed to retrieve information about reader ${readerId}. Can't authorize`, "auth");
            inResponse.Auth = uid;
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
        inResponse.Auth = uid;

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

        //Staff bypass. Skip Welcome and training check.
        if (user.privilege == Privilege.STAFF) {
            wsApiLog("{user} has activated {access_device} - {equipment} with STAFF access", "auth", { id: user.id, label: getUsersFullName(user) }, { id: reader?.id, label: reader?.name }, { id: machine.id, label: machine.name });
            createEquipmentSession(machine.id, user.id, reader.name ?? undefined);
            inResponse.Verified = 1;
            return inResponse;
        }

        //If needs welcome, check that room swipe has occured in the zone today
        if (machine.needsWelcome && !(process.env.GLOBAL_WELCOME_BYPASS == "TRUE")) {
            const welcomed = await hasSwipedToday(machine.roomID, user.id);
            if (!welcomed) {
                wsApiDebugLog("{user} failed to swipe into {machine} -{equipment} with error '{error}'", "auth",
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

        //Check that all required trainings are passed
        if (!(process.env.GLOBAL_TRAINING_BYPASS == "TRUE") && !(await hasAccessByID(user.id, machine.id))) {
            const incompleteTrainings = await getMissingTrainingModules(user, machine.id);
            var incompleteTrainingsStr = ""
            incompleteTrainings.forEach((module, i) => {
                incompleteTrainingsStr += module.name;
                if (i < incompleteTrainings.length - 1) incompleteTrainingsStr += ", ";
            });
            wsApiDebugLog(`{user} failed to swipe into {machine} - {equipment} with error '{error}' [${incompleteTrainingsStr}]`, "auth",
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
            wsApiDebugLog("{user} failed to swipe into {machine} - {equipment} with error '{error}'", "auth",
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
        wsApiDebugLog(`Unhandled error when authorizing on {access_device} - ${err}`, "auth", { id: readerId, label: (await getReaderByID(readerId))?.name ?? "unknown device" })
        inResponse.Role = "unknown role";
        inResponse.Verified = 0;
        inResponse.Error = "Unknown Error";
        inResponse.Reason = "server-error";
        return inResponse;
    }
}

/**
 * Finds and packages data requested by the shlug from the server
 * @param connData state of the connection
 * @param requested_values list of keys that the shlug is requesting from us
 * @returns response containing those keys
 */
function handleRequest(connData: ConnectionData | undefined, requested_values: string[]): ShlugResponse {
    var obj: ShlugResponse = { Seq: -1 };
    for (let value of requested_values) {
        switch (value) {
            case "Time":
                obj.Time = Math.floor(Date.now() / 1000);
                break;
            case "State":
                obj.State = "Idle";
                break;
            default:
                wsApiDebugLog(`Invalid request from Shlug ${connData?.readerId}`, "ACS Message")
        }
    }
    return obj;
}

// What the shlug sends over websockets
interface ShlugMessage {
    SerialNumber?: string

    FWVersion?: string;
    HWVersion?: string;
    HWType?: string;
    Request?: string[];
    Message?: string;  // Log Message to echo to history

    State?: string; // Current State
    UID?: string; // Reason for switching to that state

    Auth?: string; // UID to authorize

    Seq: number;
    Key?: string;
}
// What the server sends to the shlug in response to a ShlugMessage
interface ShlugResponse {
    Seq: number
    Auth?: string
    Verified?: number
    Role?: string
    Error?: string
    Reason?: string

    Time?: number /// unix timestamp
    State?: string
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
        wsApiLog(`WSACS: Received valid JSON  from ${req.ip} with no Sequence Number. Got ${JSON.stringify(jdata)}`, "status")
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
        if (await getReaderByName(name) == null) {
            return name;
        }
    }
    return `${generateRandomHumanName()}-${randomInt(1000)}`
}

/**
 * Parses and handles the initial informational message sent by the shlug identifying itself
 * @param connData state of the connection
 * @param message the message that the shlug sent
 * @returns true on successful parse. False if missing fields or otherwise invalid
 */
async function handleBootupMessage(connData: ConnectionData, message: ShlugMessage, ws: ws.WebSocket, srcIp: string): Promise<boolean> {
    if (message.SerialNumber == null || message.Key == null || message.FWVersion == null || message.HWVersion == null || message.HWType == null) {
        if (message.Key) {
            message.Key = "<sanitized>";
        }
        wsApiDebugLog(`WSACS: Missing fields in boot message from ${srcIp}. Got ${JSON.stringify(message)}`, "status");
        ws.close(4000, "Invalid Fields");
        return false;
    }
    var reader: ReaderRow | undefined = await getReaderBySN(message.SerialNumber ?? "");
    if (reader?.pairTime == null || reader?.SN == null) {
        wsApiLog(`WSACS: Request from unpaired shlug ${srcIp}. Denying`, "status");
        console.error(`WSACS: Request from unpaired shlug ${srcIp}. Denying`);
        ws.close(4001, "Unpaired Reader. Rejected");
        return false;

    }
    const keyToMatch = await generateShlugKey(reader?.pairTime, reader?.SN, reader?.readerKeyCycle);
    if (message.Key != keyToMatch) {
        wsApiLog(`WSACS: Invalid key from SN ${reader?.SN} on connect.`, "status");
        console.error(`WSACS: Invalid key from SN ${reader?.SN} on connect.`);
        ws.close(4002, "Invalid Key. Rejected")
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
            wsApiDebugLog("Failed to create new access device. Error '{error}'", "status", { id: 400, label: "Reader does not exist" });
            return false;
        }
        else {
            wsApiLog("New Access Device {access_device} registered", "status", { id: reader?.id, label: reader?.name })
        }
    }

    const instance = await getInstanceByReaderID(reader.id);
    const equipment = instance ? await getEquipmentByID(instance.equipmentID) : null;
    const tag = (equipment == null) ? "reader {access_device} (unpaired)" : ("{equipment} instance " + (instance?.name ?? "unknown instance"))
    const label: { id: number, label: string } = (equipment == null) ? { id: reader.id, label: reader.name } : { id: equipment.id, label: equipment.name ?? "unknown equipment" }

    if (reader?.lastStatusTime) {
        let offlineMs = new Date().getTime() - reader.lastStatusTime.getTime();
        const timeString = new Date(offlineMs).toISOString().slice(11, 19);
        wsApiLog(`Opened WS to ${tag}. Offline for ${timeString}`, "status", label)
    } else {
        wsApiLog(`Opened WS to ${tag}`, "status", label)
    }
    connData.readerId = reader.id;

    // update with new info
    await updateReaderStatus({
        id: reader.id,
        machineID: undefined,
        machineType: "",
        zone: "",
        temp: 0,
        state: message.State ?? "unknown-state",
        currentUID: "",
        recentSessionLength: reader.recentSessionLength,
        lastStatusReason: reader.lastStatusReason,
        scheduledStatusFreq: reader.scheduledStatusFreq,
        helpRequested: reader.helpRequested,
        BEVer: message.FWVersion ?? undefined,
        FEVer: message.FWVersion ?? undefined,
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
async function handleStateTransition(reader: ReaderRow, newState: string, activeUID: string | undefined) {
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

    await updateReaderStatus(reader);

}
/**
 * Check if we need to send a response
 * If nothing was asked for, no need to send it
 * @param resp the message to check
 * @returns true if we should send this message to the reader
 */
function isReplyWorthSending(resp: ShlugResponse): boolean {
    if (resp.Verified || resp.Auth || resp.Error || resp.Reason || resp.Role || resp.State || resp.Time) {
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

    try {
        ws.onclose = async function (ev: ws.CloseEvent) {
            try {
                if (connData.readerId == null) {
                    // Connection was never associated with a real reader (boot message never sent, probably something fishy)
                    console.error(`WSACS: Websocket from non-reader ${req.ip} closed with code ${ev.code} ${ev.reason}`);
                    return;
                }
                let reader: ReaderRow | undefined = await getReaderByID(connData.readerId);
                wsApiLog(`Websocket to {access_device} closed. code:${ev.code}. ${ev.reason.length > 0 ? "Reason: " + ev.reason : ""}`, "status", { id: connData.readerId ?? 0, label: reader?.name ?? "unknown shlug" });
                removeConnection(connData);
            } catch (e) {
                console.error(`WSACS: Close Exception: ${e}`)
            }

        };

        ws.onerror = function (ev: ws.ErrorEvent) {
            wsApiDebugLog(`WSACS: Websocket unrecoverable: ${ev}`, "status")
            console.error(`WSACS: websocket error ${ev.error} - ${ev.type}: ${ev.message}`)
            ws.close(4000, "got unrecoverable error");
        }

        ws.onmessage = async function (ev: ws.MessageEvent) {
            try {
                const shlugMessage: ShlugMessage | undefined = validateShlugMessage(ev, req);
                if (shlugMessage == null) {
                    return;
                }

                // First Message is special, identifies the shlug to the server
                if (shlugMessage.Seq === 0) {
                    // Bootup message
                    if (!await handleBootupMessage(connData, shlugMessage, ws, req?.ip ?? "unknown ip")) {
                        // failed to setup  
                        return;
                    }
                }

                addOrUpdateConnection(connData);
                // Get reader that was setup by handleBootupMessage
                var reader = await getReaderByID(connData.readerId ?? 0);
                if (reader == null) {
                    if (!connData.alreadyComplainedAboutInvalidReader) {
                        wsApiDebugLog(`Failed to find entry for device ${connData.readerId}. Error '{error}'`, "status", { id: 400, label: "Reader does not exist" });
                        connData.alreadyComplainedAboutInvalidReader = true;
                    }
                    return;
                }
                var response: ShlugResponse = handleRequest(connData, shlugMessage.Request || [])


                if (shlugMessage.Message) { 
                    wsApiLog(`{access_device} message: ${shlugMessage.Message}`, "message", { id: reader.id, label: reader.name })
                }
                if (shlugMessage.State) {
                    await handleStateTransition(reader, shlugMessage.State, shlugMessage.UID)
                }

                if (shlugMessage.Auth) {
                    response = await authorizeUid(shlugMessage?.Auth, connData.readerId ?? 0, response)
                }
                if (isReplyWorthSending(response)) {
                    replyToShlug(connData, response, shlugMessage.Seq);
                }
            } catch (e: any) {
                wsApiDebugLog(`WSACS: Message Exception: ${e}`, "status");
                console.error(`WSACS: Message Exception: ${e}: ${e?.stack}`)
            }

        }

    } catch (e) {
        wsApiDebugLog(`WSACS: Exception: ${e}`, "status");
        console.error(`WSACS: Exception: ${e}`)
    }
}
