/**
 * server.ts
 * Server Configuration and API
 */

import express from "express";
import expressWs from 'express-ws';
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { createServer, request } from "http";
import compression from "compression";
import cors from "cors";
import { schema } from "./schema.js";
import { setupSessions, setupDevAuth, setupStagingAuth, setupAuth } from "./auth.js";
import context from "./context.js";
import json from "body-parser";
import path from "path";
import * as schedule from "node-schedule";
import { getUserByCardTagID, getUsersFullName } from "./repositories/Users/UserRepository.js";
import { getRoomByID, hasSwipedToday, swipeIntoRoom } from "./repositories/Rooms/RoomRepository.js";
import { createLog, createLogWithArray } from "./repositories/AuditLogs/AuditLogRepository.js";
import { getEquipmentByID, getMissingTrainingModules, hasAccessByID } from "./repositories/Equipment/EquipmentRepository.js";
import { Room } from "./models/rooms/room.js";
import { Privilege } from "./schemas/usersSchema.js";
import { createReader, getReaderByID, getReaderByName, getReaderBySN, getReaderCertCA, toggleHelpRequested, updateReaderStatus } from "./repositories/Readers/ReaderRepository.js";
import { isApproved } from "./repositories/Equipment/AccessChecksRepository.js";
import morgan from "morgan"; //Log provider
import bodyParser from "body-parser"; //JSON request body parser
import { createRequire } from "module";
import { createEquipmentSession, pruneNullLengthEquipmentSessions, setLatestEquipmentSessionLength } from "./repositories/Equipment/EquipmentSessionsRepository.js";
import { setDataPointValue } from "./repositories/DataPoints/DataPointsRepository.js";
import { ReaderRow } from "./db/tables.js";
import { authenticateReader, ws_acs_api, wsApiLog } from "./wsapi.js"
import { addItemAmount, getItemById, getItems, getItemsWhereStaff, getItemsWhereStorefront, setItemAmount } from "./repositories/Store/InventoryRepository.js";
import { InventoryItem } from "./schemas/storeFrontSchema.js";
import { createLedger } from "./repositories/Store/InventoryLedgerRepository.js";
import { getZoneHoursNextWeek } from "./repositories/Zones/ZoneHoursRepository.js";
import * as Atrium from "./integrations/atrium-integration/atrium.js"

const require = createRequire(import.meta.url);

const allowed_origins = [process.env.REACT_APP_ORIGIN, "https://studio.apollographql.com", "https://make.rit.edu", "https://shibboleth.main.ad.rit.edu"];

const __dirname = import.meta.dirname;

/**
 * set up Cross-Origin Request allowances
 */
const CORS_CONFIG = {
  origin: process.env.REACT_APP_ORIGIN,
  credentials: true,
};

/**
 * Initialize the server runner
 */
async function startServer() {
  require("dotenv").config({ path: __dirname + "/./../.env" });

  //Init with Node Express
  var exp = express();
  var wsserver = expressWs(exp);
  var app = wsserver.app;

  //Configure CORS
  app.use(cors(CORS_CONFIG));

  //Active File compression 
  app.use(compression());

  //Combined logging
  app.use(morgan("combined"));

  //JSON request body parsing
  app.use(bodyParser.json());

  //Prepare client session handler
  setupSessions(app);


  // environment setup
  /**
   * mode: DEVELOPMENT
   * Use local dev login view instead of SAML
   * !! INSECURE !!
   */
  if (process.env.NODE_ENV === "development") {
    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    setupDevAuth(app);
  }
  /**
   * mode: STAGING
   * Use the SAML configuration, but use insecure dev cookie handling
   */
  else if (process.env.NODE_ENV === "staging") {
    console.log("staging active");
    setupStagingAuth(app);
  }
  /**
   * mode: PRODUCTION
   * Use production SAML settings. Full security
   */
  else if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1); // trust first proxy
    setupAuth(app);
  } else {
    process.exit(-1);
  }

  app.use("/app", express.static(path.join(__dirname, "../../client/npx browserslist@latest --update-db\n")));

  //serves built react app files under make.rit.edu/app
  app.use("/app/", express.static(path.join(__dirname, '../../client/build')));


  /**
   * REGEX QUERY:
   * matches to all urls EXCEPT:
   *    /app/
   *    /app/home
   *    /app/makerspace/##
   *    /app/display/...
   *      (# is a number)
   * This is so some parts of the website can be publicly accessible w/o logging in.
   * // /\/app(?!\/makerspace\/\d+|\/home|\/display)\/.+/gm
   */
  app.all(/\/app(?!\/makerspace\/\d+|\/home|\/display)\/.+/gm, (req, res, next) => {
    //process.env.USE_TEST_DEV_USER_DANGER=="TRUE" || 
    if (process.env.USE_TEST_DEV_USER_DANGER == "TRUE" || req.user) {
      return next();
    }
    console.log("LOGIN REDIRECT");
    //Redirect to login path
    //In staging/prod, /login will then redirect to the IdP
    res.redirect("/login");
  });


  //it might seem like you should be able to redirect straight to /app/ from / but for some reason it infitely refreshes
  // and this solves the issue
  app.get("/app/home", function (req, res) {
    res.redirect("/app/")
  })


  //redirects first landing make.rit.edu/ -> make.rit.edu/home
  app.get("/", function (req, res) {
    res.redirect("/app/home");
  });





  app.get("/app/*", function (req, res) {
    res.header
    res.sendFile(path.join(__dirname, "../../client/build", "index.html"));
  });

  // app.get('*', (req, res) => {
  //   res.redirect("/app");
  // });



  /** ===============================================================================================
   * ACS Hardware Endpoints
   * --
   * These are the endpoints that the ACS hardware will access to authorize users and perform checks.
   * Note: JSON attributes are all Title case
  ===================================================================================================*/
  const API_NORMAL_LOGGING = process.env.API_NORMAL_LOGGING == "true";
  const API_DEBUG_LOGGING = process.env.API_DEBUG_LOGGING == "true";


  /**
   * Websocket
   * Handler for upgrading api call to websocket connection
   * Details of protocol are handled in wsapi.ts
   */
  // Websocket ACS Handler
  app.ws("/api/ws", ws_acs_api);

  app.all("/api/files/*", async function (req, res, next) {
    const SNHeader = 'shlug-sn';
    const KeyHeader = 'shlug-key';
    if (!req.headers[SNHeader] || !req.headers[KeyHeader]) {
      return res.status(401).send();
    }
    const SN = req.headers[SNHeader];
    const Key = req.headers[KeyHeader];
    if (typeof SN !== "string" || typeof Key !== "string") {
      return res.status(401).send();
    }

    const reader = await getReaderBySN(SN);
    if (reader == null){
      return res.status(404).send();
    }

    const ok = await authenticateReader(reader, Key);
    if (!ok) {
      wsApiLog("Declining API file to unauthed shlug with SN " + SN, "file");
      return res.status(403).send();
    }
    return next();
  });
  app.use("/api/files/", express.static(path.join(__dirname, '../../client/shlug-files/')));

  app.get("/api/files/certCA", async function (req, res) {
    const certca = (await getReaderCertCA())?.value;
    if (certca == null) {
      return res.status(404).send();
    }
    return res.send(certca);
  })

  app.get('/api/files/ota/:tagname', async function (req, res) {
    const tag = req.params["tagname"];
    console.log(`SN: ${req.headers['shlug-sn']} requested OTA to ${tag}`);
    
    const ota_url = `https://github.com/rit-construct-makerspace/access-control-firmware/releases/download/${tag}/Core.bin`
    fetch(ota_url).then(actual => {
      actual.headers.forEach((v, n) => res.setHeader(n, v));
      if (actual?.body) {
        actual.body.pipeTo(
          new WritableStream({
            start() { },
            write(chunk) {
              res.write(chunk);
            },
            close() {
              res.end();
            },
          })
        );
      }
    })
  })

  /**
   * WELCOME----
   * Log a user signing in to a makerspace room. Return whether the user is in the database
   * Request (JSON body):
   * - Type: "Welcome"
   * - Zone: the room ids
   * - ID: the uid of the requesting user
   * - Key: a verification token
   * Response:
   * HTTP 202: User in system
   * HTTP 406: User/Zone not exists
   * HTTP 403: Key mismatch
   */
  app.put("/api/welcome", async function (req, res) {
    try {
      //If API Keys dont match, fail
      if (req.body.Key != process.env.API_KEY) {
        if (API_DEBUG_LOGGING) createLog("UID {conceal} failed to swipe into a room with error '{error}'", "welcome", { id: 0, label: req.body.ID }, { id: 403, label: "Invalid Key" });
        return res.status(403).json({ error: "Invalid Key" }).send();
      }

      const uid = req.body.ID;

      const user = await getUserByCardTagID(uid);

      if (req.body.Zone.toString().length == 0) {
        return res.status(406).json({ error: "Empty Zone" }).send();
      }
      var roomIDs = req.body.Zone.toString().split(",");

      var rooms: (Room | null)[] = [];

      // .forEach will not await the interior statements. Unsure why, so we use a normal for loop
      for (var i = 0; i < roomIDs.length; i++) {
        var idString = roomIDs[i];
        //console.log(await getRoomByID(parseInt(idString)));
        rooms.push(await getRoomByID(parseInt(idString)));
      }

      //If room is not found, fail
      if (rooms.some(function (room) {
        return room == null;
      })) {
        if (API_DEBUG_LOGGING) {
          if (!user) createLog("UID {conceal} failed to swipe into a room with error '{error}'", "welcome", { id: 0, label: req.body.ID }, { id: 406, label: "Room does not exist" });
          else createLog("{user} failed to swipe into a room with error '{error}'", "welcome", { id: user.id, label: getUsersFullName(user) }, { id: 406, label: "Room does not exist" });
        }
        return res.status(406).json({ error: "Room does not exist" }).send();
      }
      //If user is not found, fail
      else if (user == undefined) {
        var attemptRoomNamesArray = [{ id: 0, label: req.body.ID }];
        var attemptMessageString = "";
        rooms.forEach(function (room) {
          if (room != null) {
            attemptRoomNamesArray.push({ id: room.id, label: room.name });
            attemptMessageString += "{room}, ";
          }
        });
        attemptRoomNamesArray.push({ id: 406, label: "User does not exist" });

        if (API_DEBUG_LOGGING) createLogWithArray(`UID {conceal} failed to swipe into ${attemptMessageString.substring(0, attemptMessageString.length - 2)} with error '{error}'`, "welcome", attemptRoomNamesArray);
        return res.status(406).json({ error: "User does not exist" }).send();
      }
      //Success. Log and return.
      else {
        var roomNamesArray = [{ id: user.id, label: getUsersFullName(user) }];
        var messageString = "{user} has signed into ";
        rooms.forEach(function (room) {
          if (room != null) {
            roomNamesArray.push({ id: room.id, label: room.name });
            messageString += "{room}, ";
            swipeIntoRoom(room.id, user.id);
          }
        });
        if (API_NORMAL_LOGGING) createLogWithArray(messageString.substring(0, messageString.length - 2), "welcome", roomNamesArray);
        return res.status(202).send();
      }
    } catch (err) {
      console.error(err);
      return res.status(500).send();
    }

  });


  /**
   * AUTHORIZATION----
   * Check whether a user has authorized access to a machine.
   * Request (Header):
   * - type: string representing the machine type
   * - machine: the ID of the machine according to the database
   * - needswelcome: If true, check if user has signed into the room within the day
   * - id: user uid
   */
  app.get("/api/auth", async function (req, res) {
    try {
      if (req.query.id == undefined || req.query.needswelcome == undefined || req.query.type == undefined) {
        if (API_DEBUG_LOGGING) createLog("Request failed to gain equipment access with error '{error}'", "auth", { id: 400, label: "Missing paramaters" });
        return res.status(400).json({ error: "Missing paramaters" }).send();
      }

      const user = await getUserByCardTagID(req.query.id.toString());

      //If user is not found, fail
      if (user == undefined) {
        var machine;
        try {
          machine = await getEquipmentByID(parseInt(req.query.type.toString()));
        } catch (EntityNotFound) {
          if (API_DEBUG_LOGGING) createLog("UID {conceal} failed to activate a machine with error '{error}'", "auth", { id: 0, label: req.query.id?.toString() ?? "undefined_uid" }, { id: 406, label: "User does not exist" });
          return res.status(406).json({
            "Type": "Authorization",
            "Machine": req.query.machine,
            "UID": req.query.id,
            "Allowed": 0,
            "Error": "User does not exist",
            "Reason": "unknown-uid"
          }).send();
        }


        if (API_DEBUG_LOGGING) createLog("UID {conceal} failed to activate {machine} - {equipment} with error '{error}'", "auth", { id: 0, label: req.query.id?.toString() ?? "undefined_uid" }, { id: machine.id, label: req.query.machine?.toString() ?? "undefined" }, { id: machine.id, label: machine.name }, { id: 406, label: "User does not exist" });
        return res.status(406).json({
          "Type": "Authorization",
          "Machine": req.query.machine,
          "UID": req.query.id,
          "Allowed": 0,
          "Error": "User does not exist",
          "Reason": "unknown-uid"
        }).send();
      }

      var machine;
      try {
        machine = await getEquipmentByID(parseInt(req.query.type.toString()));
      } catch (EntityNotFound) {
        if (API_DEBUG_LOGGING) createLog("{user} failed to swipe into a machine with error '{error}'", "auth", { id: user.id, label: getUsersFullName(user) }, { id: 406, label: "Machine " + req.query.type.toString() + " does not exist" });
        return res.status(406).json({
          "Type": "Authorization",
          "Machine": req.query.type,
          "UID": req.query.id,
          "Allowed": 0,
          "Error": "Machine does not exist",
          "Reason": "unknown-machine",
          "Role": user.privilege
        }).send();
      }

      //If machine is not found, fail
      if (machine == null) {
        if (API_DEBUG_LOGGING) createLog("{user} failed to swipe into a machine with error '{error}'", "auth", { id: user.id, label: getUsersFullName(user) }, { id: 406, label: "Machine " + req.query.type.toString() + " does not exist" });
        return res.status(406).json({
          "Type": "Authorization",
          "Machine": req.query.type,
          "UID": req.query.id,
          "Allowed": 0,
          "Error": "Machine does not exist",
          "Reason": "unknown-machine",
          "Role": user.privilege
        }).send();
      }


      //Staff bypass. Skip Welcome and training check.
      if (user.privilege == Privilege.STAFF) {
        if (API_NORMAL_LOGGING) createLog("{user} has activated {machine} - {equipment} with STAFF access", "auth", { id: user.id, label: getUsersFullName(user) }, { id: machine.id, label: req.query.machine?.toString() ?? "undefined" }, { id: machine.id, label: machine.name });
        createEquipmentSession(machine.id, user.id, req.query.machine?.toString() ?? undefined);
        return res.status(202).json({
          "Type": "Authorization",
          "Machine": machine.id,
          "UID": req.query.id,
          "Allowed": 1,
          "Role": user.privilege
        }).send();
      }


      //If needs welcome, check that room swipe has occured in the zone today
      if (!(process.env.GLOBAL_WELCOME_BYPASS == "TRUE") && req.query.needswelcome != undefined && req.query.needswelcome.toString() === "1") {
        //console.log("Checking welcome status");
        const welcomed = await hasSwipedToday(machine.roomID, user.id);
        if (!welcomed) {
          if (API_DEBUG_LOGGING) createLog("{user} failed to swipe into {machine} -{equipment} with error '{error}'", "auth", { id: user.id, label: getUsersFullName(user) }, { id: machine.id, label: req.query.machine?.toString() ?? "undefined" }, { id: machine.id, label: machine.name }, { id: 401, label: "User requires Welcome" });
          return res.status(401).json({
            "Type": "Authorization",
            "Machine": machine.id,
            "UID": req.query.id,
            "Allowed": 0,
            "Error": "User requires Welcome",
            "Reason": "no-welcome",
            "Role": user.privilege
          }).send();
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
        if (API_DEBUG_LOGGING) createLog(`{user} failed to swipe into {machine} - {equipment} with error '{error}' [${incompleteTrainingsStr}]`, "auth", { id: user.id, label: getUsersFullName(user) }, { id: machine.id, label: req.query.machine?.toString() ?? "undefined" }, { id: machine.id, label: machine.name }, { id: 401, label: "Incomplete trainings" });
        return res.status(401).json({
          "Type": "Authorization",
          "Machine": machine.id,
          "UID": req.query.id,
          "Allowed": 0,
          "Error": "Incomplete trainings",
          "Reason": "missing-training",
          "Role": user.privilege
        }).send();
      }

      //Check that equipment access check is completed
      if (!(process.env.GLOBAL_ACCESS_CHECK_BYPASS == "TRUE") && !(await isApproved(user.id, machine.id))) {
        if (API_DEBUG_LOGGING) createLog("{user} failed to swipe into {machine} - {equipment} with error '{error}'", "auth", { id: user.id, label: getUsersFullName(user) }, { id: machine.id, label: machine.name }, { id: machine.id, label: req.query.machine?.toString() ?? "undefined" }, { id: 401, label: "Missing Staff Approval" });
        return res.status(401).json({
          "Type": "Authorization",
          "Machine": machine.id,
          "UID": req.query.id,
          "Allowed": 0,
          "Error": "Missing Staff Approval",
          "Reason": "no-approval",
          "Role": user.privilege
        }).send();
      }

      //Success
      if (API_NORMAL_LOGGING) createLog("{user} has activated {machine} - {equipment}", "auth", { id: user.id, label: getUsersFullName(user) }, { id: machine.id, label: req.query.machine?.toString() ?? "undefined" }, { id: machine.id, label: machine.name });
      createEquipmentSession(machine.id, user.id, req.query.machine?.toString() ?? undefined);
      return res.status(202).json({
        "Type": "Authorization",
        "Machine": machine.id,
        "UID": req.query.id,
        "Allowed": 1,
        "Role": user.privilege
      }).send();
    } catch (err) {
      console.error(err);
      return res.status(500).send();
    }
  });


  /**
   * STATUS----
   * Report a card reader's current state to the database
   * Request (JSON body):
   * - Type: "Status"
   * - Machine: the ID of the machine according to the database
   * - MachineType: string representing the machine type
   * - Zone: the room ID according to the database
   * - Temp: Device temperature
   * - State: Device operation state string
   * - UID: If active, the UID of the current user
   * - Time: The length of the last (or current if active) session
   * - Source: Reason for the status message
   * - Frequency: How often scheduled status messages will be sent
   * - Key: API key for authorization
   */
  app.put("/api/status", async function (req, res) {
    try {
      //If API Keys dont match, fail
      if (req.body.Key != process.env.API_KEY) {
        if (API_DEBUG_LOGGING) createLog("Access Device Status Update failed. Error '{error}'", "status", { id: req.body.ID, label: req.body.ID }, { id: 403, label: "Invalid Key" });
        return res.status(403).json({ error: "Invalid Key" }).send();
      }

      //console.log(req.body.Machine);
      var reader = await getReaderByName(req.body.Machine);
      //console.log(reader);
      if (reader == undefined) {
        reader = await createReader({
          name: req.body.Machine,
          machineID: req.body.MachineType,
          machineType: req.body.MachineType,
          zone: req.body.Zone
        });
        if (reader == undefined) {
          if (API_DEBUG_LOGGING) await createLog("Access Device Status Update failed. Error '{error}'", "status", { id: req.body.ID, label: req.body.ID }, { id: 400, label: "Reader does not exist" });
          return res.status(400).json({ error: "Reader does not exist" }).send();
        }
        else if (API_NORMAL_LOGGING) await createLog(`New Access Device {access_device} registered.`, "status", { id: reader?.id, label: reader?.name });
      }

      const newReader = await updateReaderStatus({
        id: reader.id,
        machineID: parseInt(reader.machineType),
        machineType: reader.machineType,
        zone: reader.zone,
        temp: req.body.Temp,
        state: req.body.State,
        currentUID: req.body.UID,
        recentSessionLength: req.body.Time,
        lastStatusReason: req.body.Source,
        scheduledStatusFreq: req.body.Frequency,
        helpRequested: req.body.Help == null ? reader.helpRequested : (req.body.Help === "1"),
        BEVer: req.body.BEVer ?? null,
        FEVer: req.body.FEVer ?? null,
        HWVer: req.body.HWVer ?? null,
      });

      const user = await getUserByCardTagID(reader.currentUID);
      const newUser = await getUserByCardTagID(req.body.UID);

      //If state change
      if (API_NORMAL_LOGGING && reader.state != req.body.State) {
        //If no user responsible, dont print a user
        if (!newUser) await createLog(`State of {access_device} changed: ${reader.state} -> ${req.body.State}`, "state", { id: reader?.id, label: reader?.name });
        else await createLog(`{user} changed state of {access_device}: ${reader.state} -> ${req.body.State}`, "state", { id: newUser ? newUser.id : 0, label: newUser ? getUsersFullName(newUser) : "NULL" }, { id: reader?.id, label: reader?.name });
        // await createLog(`DEBUG: {Machine: ${req.body.Machine}, Time: ${req.body.Time}, Source: ${req.body.Source}}`, "status")
      }

      //if(reader.id == 290) await createLog(`DEBUG: scrollsaw state change: ${reader.state} -> ${req.body.State}; {Machine: ${req.body.Machine}, MachineType: ${req.body.MachineType}, UID: ${req.body.UID}, Source: ${req.body.Source}}`, "message");

      //If in a user session or just finished a user session
      if (reader.state == "Active" && req.body.Time != 0) {
        //Update said user session length
        await setLatestEquipmentSessionLength(parseInt(reader.machineType), req.body.Time, req.body.Machine);
      }
      //If session just finished
      if (req.body.Source == "Card Removed") {
        const equipment = await getEquipmentByID(parseInt(reader.machineType));
        await setLatestEquipmentSessionLength(parseInt(reader.machineType), req.body.Time, req.body.Machine);
        if (user != undefined) {
          await createLog(`{user} signed out of {machine} - {equipment} (Session: ${new Date(Number(req.body.Time) * 1000).toISOString().substring(11, 19)})`, "status", { id: user.id, label: getUsersFullName(user) }, { id: reader.id, label: req.body.Machine ?? "undefined" }, { id: equipment.id, label: equipment.name });
        }
      }

      return res.status(200).send();
    } catch (err) {
      console.error(err);
      return res.status(500).send();
    }
  });


  /**
   * HELP----
   * Report to the database that a user has pressed the help button on their machine
   * Request (JSON body):
   * - Type: "Help"
   * - Machine: the ID of the machine according to the database
   * - Zone: the room ID according to the database
   * - Key: API key for authorization
   */
  app.put("/api/help", async function (req, res) {
    try {
      //If API Keys dont match, fail
      //console.log("HELP: " + JSON.stringify(req.body, null, 4));
      if (req.body.Key != process.env.API_KEY) {
        if (API_DEBUG_LOGGING) createLog("Access Device Help request failed with error '{error}'", "help", { id: 403, label: "Invalid Key" });
        return res.status(403).json({ error: "Invalid Key" }).send();
      }

      const reader = await getReaderByName(req.body.Machine);
      if (reader == undefined) {
        if (API_DEBUG_LOGGING) createLog("Access Device Help request failed. Error '{error}'", "help", { id: req.body.ID, label: req.body.ID }, { id: 400, label: "Reader does not exist" });
        return res.status(400).json({ error: "Reader does not exist" }).send();
      }
      await toggleHelpRequested(reader?.id);
      if (API_NORMAL_LOGGING) {
        if (!reader.helpRequested) createLog("Help requested at {access_device}!", "help", { id: reader.id, label: reader.name }); //Prev was false, new is true
        else createLog("Help dismissed at {access_device}", "help", { id: reader.id, label: reader.name }); //Prev was true, new is false
      }
      return res.status(200).send();
    } catch (err) {
      console.error(err);
      return res.status(500).send();
    }
  });


  /**
   * MESSAGE----
   * Submit an audit log
   * Request (header):
   * - message: The audit log message
   */
  app.get("/api/message/:MachineID", async function (req, res) {
    try {
      const machine = await getReaderByName(req.params.MachineID);

      if (req.query.message != undefined && machine != undefined) {
        createLog("{access_device} message: " + req.query.message.toString(), "message", { id: machine.id, label: machine.name });
        return res.status(200).send();
      }
      return res.status(400).send();
    } catch (err) {
      console.error(err);
      return res.status(500).send();
    }
  });

  /**
   * CHECK----
   * Return 200
   */
  app.get("/api/check/:MachineID", function (req, res) {
    //I see no possible way this could fail so no try/catch
    return res.status(200).send();
  });


  /**
   * STATE----
   * Check a machine's last returned State or Help if Help status is active
   */
  app.get("/api/state/:MachineID", async function (req, res) {
    try {
      const reader = await getReaderByName(req.params.MachineID);

      if (reader == undefined) {
        if (API_DEBUG_LOGGING) createLog("Access Device {access_device} State fetch failed. Error '{error}'", "state", { id: req.body.ID, label: req.body.ID }, { id: 400, label: "Reader does not exist" });
        return res.status(400).json({ error: "Reader does not exist" }).send();
      }

      return res.status(200).json({
        Type: "State",
        MachineID: reader?.name,
        State: reader?.helpRequested ? "Help" : reader?.state
      })
    } catch (err) {
      console.error(err);
      return res.status(500).send();
    }

  });

  /**
   * BATCH----
   * Check multiple machine's last returned State or Help if Help status is active
   */
  app.get("/api/batch", async function (req, res) {
    try {
      var machineIDs = [];
      var i = 1;
      while (req.header.arguments[`machine${i}`]) {
        machineIDs.push(req.header.arguments[`machine${i++}`]);
      }

      if (machineIDs.length == 0) {
        if (API_DEBUG_LOGGING) createLog("Access Device Batch State fetch failed. Error '{error}'", "state", { id: 401, label: "Missing arguments" });
        return res.status(401).json({ error: "Missing arguments" }).send();
      }

      var machines: ReaderRow[] = [];
      for (var x = 0; x < machineIDs.length; x++) {
        const machine = await getReaderByID(machineIDs[x]);
        if (!machine) {
          if (API_DEBUG_LOGGING) createLog("Access Device Batch State fetch failed. Error '{error}'", "state", { id: 400, label: `Reader ${x + 1} does not exist` });
          return res.status(400).json({ error: `Reader ${x + 1} does not exist` }).send();
        }
      }

      var jsonBody: any = { Type: "Batch" };

      for (var x = 0; x < machines.length; x++) {
        jsonBody["MachineID"] = machines[x].helpRequested ? "Help" : machines[x].state;
      }

      return res.status(200).json(jsonBody)
    } catch (err) {
      console.error(err);
      return res.status(500).send();
    }
  });

  /**
   * HOURS--
   * Fetch the hours associated with a zone string
   */
  app.get("/api/hours/:zone", async function (req, res) {
    try {
      const hourRows = await getZoneHoursNextWeek(Number(req.params.zone));

      return res.status(200).json({
        obj: hourRows
      }).send();
    } catch (err) {
      console.error(err);
      return res.status(500).send();
    }
  });


  /**
   * Inventory API
   * 
   * DO NOT REMOVE THIS SECTION WHEN DEPRECATING THE OLD API
   */

  /**
   * INVENTORY--
   * Fetch a list of inventory items according to the fetch type
   * Request (JSON Body):
   * - Type: The type of items to fetch
   *    * "public" | "internal" | "staff" | "all"
   * - Key: API key for authorization. Required for fetch types "internal", "staff", "all"
   */
  app.get("/api/inv", async function (req, res) {
    try {
      const fetchType: "public" | "internal" | "staff" | "all" = req.body.Type ?? "public";
      var items: InventoryItem[] = [];

      if (fetchType === "internal" || fetchType === "staff" || fetchType === "all") {
        if (req.body.Key != process.env.INV_API_KEY) {
          if (API_DEBUG_LOGGING) createLog("Inventory Get request failed with error '{error}'", "inventory", { id: 403, label: "Invalid Key" });
          return res.status(403).json({ error: "Invalid Key" }).send();
        }

        switch (fetchType) {
          case "all":
            items = await getItems();
            break;
          case "internal":
            items = await getItemsWhereStorefront(false);
            break;
          case "staff":
            items = await getItemsWhereStaff(true);
            break;
        }

        return res.status(200).json({
          count: items.length,
          type: fetchType,
          items
        }).send();
      } else {
        //fetchType === "public"

        items = await getItemsWhereStorefront(true);

        return res.status(200).json({
          count: items.length,
          type: fetchType,
          items
        }).send();
      }


    } catch (err) {
      console.error(err);
      return res.status(500).send();
    }
  });

  /**
   * COUNT--
   * Fetch a count for a specified inventory item
   */
  app.get("/api/inv/:id", async function (req, res) {
    try {
      const id = parseInt(req.params.id);
      return res.status(200).json({ count: (await getItemById(id))?.count ?? 0 }).send();
    } catch (err) {
      console.error(err);
      return res.status(500).send();
    }
  });

  /**
   * ADD--
   * Increment the count of a defined item by the declared amount
   * Request (JSON Body):
   * - UID: NFC ID of the user 
   * - Inc: Number to add to the count. Can be negative.
   * - Key: API key for authorization.
   */
  app.post("/api/inv/add/:id", async function (req, res) {
    try {
      const id = parseInt(req.params.id);
      const item = await getItemById(id);
      const user = req.body.UID ? await getUserByCardTagID(req.body.UID) : undefined;

      if (req.body.Key != process.env.INV_API_KEY) {
        if (API_DEBUG_LOGGING) createLog("Inventory Add request failed with error '{error}'", "inventory", { id: 403, label: "Invalid Key" });
        return res.status(403).json({ error: "Invalid Key" }).send();
      }

      if (!item) return res.status(404).json({ error: "Item does not exist" }).send();
      if (!req.body.Inc) return res.status(403).json({ error: "Missing Inc" }).send();

      const count = parseInt(req.body.Inc);

      if (count < 0 && count * -1 > item.count) res.status(403).json({ error: "Operation would set count to negative value" }).send();

      if (count != 0) {
        await addItemAmount(id, count);
        if (count > 0) {
          if (user) {
            await createLedger(user.id, "Modify", item.pricePerUnit * count, undefined, "", [{ name: item.name, quantity: Number(count) }]);
            await createLog(`{user} added ${count} ${count === 1 ? item.unit : item.pluralUnit} to the {inventory} inventory`, "inventory", { id: user.id, label: getUsersFullName(user) }, { id: item.id, label: item.name });
          } else {
            await createLedger(undefined, "Modify", item.pricePerUnit * count, undefined, "", [{ name: item.name, quantity: Number(count) }]);
            await createLog(`User added ${count} ${count === 1 ? item.unit : item.pluralUnit} to the {inventory} inventory`, "inventory", { id: item.id, label: item.name });
          }
        } else {
          if (user) {
            await createLedger(user.id, "Modify", item.pricePerUnit * count, undefined, "", [{ name: item.name, quantity: Number(count) }]);
            await createLog(`{user} removed ${count * -1} ${count === 1 ? item.unit : item.pluralUnit} from the {inventory} inventory`, "inventory", { id: user.id, label: getUsersFullName(user) }, { id: item.id, label: item.name });
          } else {
            await createLedger(undefined, "Modify", item.pricePerUnit * count, undefined, "", [{ name: item.name, quantity: Number(count) }]);
            await createLog(`User removed ${count * -1} ${count === 1 ? item.unit : item.pluralUnit} from the {inventory} inventory`, "inventory", { id: item.id, label: item.name });
          }
        }
      }

      return res.status(200).json({
        count: item.count + count,
      });

    } catch (err) {
      console.error(err);
      return res.status(500).send();
    }
  });

  /**
 * SET--
 * Set the count of a declared item to a specified amount
 * Request (JSON Body):
 * - UID: NFC ID of the user 
 * - Count: Number to set as the count. Cannot be negative.
 * - Key: API key for authorization.
 */
  app.post("/api/inv/set/:id", async function (req, res) {
    try {
      const id = parseInt(req.params.id);
      const item = await getItemById(id);
      const user = req.body.UID ? await getUserByCardTagID(req.body.UID) : undefined;

      if (req.body.Key != process.env.INV_API_KEY) {
        if (API_DEBUG_LOGGING) createLog("Inventory Set request failed with error '{error}'", "inventory", { id: 403, label: "Invalid Key" });
        return res.status(403).json({ error: "Invalid Key" }).send();
      }

      if (!item) return res.status(404).json({ error: "Item does not exist" }).send();
      if (!req.body.Count) return res.status(403).json({ error: "Missing Count" }).send();

      const count = parseInt(req.body.Count);

      if (count >= 0) {
        await setItemAmount(id, count);
        if (user) {
          await createLedger(user.id, "Modify", item.pricePerUnit * count, undefined, "", [{ name: item.name, quantity: Number(count) }]);
          await createLog(`{user} set ${count} ${count === 1 ? item.unit : item.pluralUnit} as the {inventory} inventory`, "inventory", { id: user.id, label: getUsersFullName(user) }, { id: item.id, label: item.name });
        } else {
          await createLedger(undefined, "Modify", item.pricePerUnit * count, undefined, "", [{ name: item.name, quantity: Number(count) }]);
          await createLog(`User set ${count} ${count === 1 ? item.unit : item.pluralUnit} as the {inventory} inventory`, "inventory", { id: item.id, label: item.name });
        }
      } else {
        return res.status(403).json({ error: "Cannot have negative count" }).send();
      }

      return res.status(200).json({
        count: count,
      });

    } catch (err) {
      console.error(err);
      return res.status(500).send();
    }
  });


  /**=================================
   * SCHEDULED ACTIONS
  ==================================*/

  /**
   Cron Format:
    *    *    *    *    *    *
    ┬    ┬    ┬    ┬    ┬    ┬
    │    │    │    │    │    │
    │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
    │    │    │    │    └───── month (1 - 12)
    │    │    │    └────────── day of month (1 - 31)
    │    │    └─────────────── hour (0 - 23)
    │    └──────────────────── minute (0 - 59)
    └───────────────────────── second (0 - 59, OPTIONAL)

    --REMEMBER HEROKU SERVER RUNS IN UTC (EST+4)--
   */

  const dailyJob = schedule.scheduleJob("0 0 4 * * *", async function () {
    console.log('Wiping daily records...');
    if (API_DEBUG_LOGGING) await createLog('It is now 4:00am. Wiping Daily Temp Records...', "server")
    await setDataPointValue(1, 0).then(async () => await createLog('Daily Visits reset.', "server"));
    //await pruneNullLengthEquipmentSessions().then(async () => await createLog('Unfinished Equipment Sessions pruned.', "server"));;
  });



  const server = new ApolloServer({
    schema,
    plugins: [],
  });


  await server.start();
  //Enable GraphQL
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(CORS_CONFIG),
    json(),
    expressMiddleware(server, { context: context })
  );

  const PORT = process.env.PORT || 3000;

  console.log(process.env.ID_FORMAT);

  app.listen({ port: PORT }, (): void =>
    console.log(
      `🚀 GraphQL-Server is running on https://localhost:${PORT}/graphql`
    )
  );
}

startServer();