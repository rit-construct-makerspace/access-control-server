/**
 * server.ts
 * Server Configuration and API
 */
import * as papercut from "./integrations/papercut/papercut.js"
import express from "express";
import expressWs from 'express-ws';
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import compression from "compression";
import cors from "cors";
import { schema } from "./schema.js";
import { setupSessions, setupDevAuth, setupStagingAuth, setupAuth } from "./auth.js";
import context, { determineUser } from "./context.js";
import path from "path";
import * as schedule from "node-schedule";
import { getUserByCardTagID, getUsersFullName, getUserStaffPerms } from "./repositories/Users/UserRepository.js";
import { createLog } from "./repositories/AuditLogs/AuditLogRepository.js";
import { getReaderBySN, getReaderCertCA } from "./repositories/Readers/ReaderRepository.js";
import morgan from "morgan"; //Log provider
import { createRequire } from "module";
import { setDataPointValue } from "./repositories/DataPoints/DataPointsRepository.js";
import { authenticateReader, ws_acs_api, wsApiLog } from "./wsapi.js"
import { addItemAmount, getItemById, getItems, getItemsWhereStaff, getItemsWhereStorefront, setItemAmount } from "./repositories/Store/InventoryRepository.js";
import { InventoryItem } from "./schemas/storeFrontSchema.js";
import { createLedger } from "./repositories/Store/InventoryLedgerRepository.js";
import { getMakerspaceHoursNextWeek } from "./repositories/Makerspaces/MakerspaceHoursRepository.js";
import { getPassedTrainingsDaysAgo, purgeExpiredPassedModules } from "./repositories/Training/PassedRepository.js";
import * as Emailer from "./integrations/email/email.js"
import { pingAtrium } from "./integrations/atrium-integration/atrium.js";
import * as S3 from "./integrations/aws/s3.js"
import { isStaff } from "./privilege.js";
import { purge_images } from "./periodicActions.js";

const require = createRequire(import.meta.url);

const allowed_origins = [process.env.VITE_ORIGIN, "https://studio.apollographql.com", "https://make.rit.edu", "https://shibboleth.main.ad.rit.edu"];
const SECURE_ORIGIN = (process.env.VITE_ORIGIN ?? "");
const __dirname = import.meta.dirname;

const EXPIRY_EMAIL_LIMIT_AT_ONCE = isNaN(Number(process.env.EXPIRY_EMAIL_LIMIT_AT_ONCE ?? "")) ? 50 : Number(process.env.EXPIRY_EMAIL_LIMIT_AT_ONCE);

/**
 * set up Cross-Origin Request allowances
 */
const CORS_CONFIG = {
  origin: process.env.VITE_ORIGIN,
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
  app.use(express.json());

  //Prepare client session handler
  setupSessions(app);


  // environment setup
  if (process.env.NODE_ENV === "development") {
    /**
    * mode: DEVELOPMENT
    * Use local dev login view instead of SAML
    * !! INSECURE !!
    */
    console.log("development active")
    setupDevAuth(app);
  } else if (process.env.NODE_ENV === "staging") {
    /**
     * mode: STAGING
     * Use the SAML configuration, but use insecure dev cookie handling
     */
    console.log("staging active");
    setupStagingAuth(app);
  } else if (process.env.NODE_ENV === "production") {
    /**
     * mode: PRODUCTION
     * Use production SAML settings. Full security
     */
    app.set("trust proxy", 1); // trust first proxy
    setupAuth(app);
  } else {
    process.exit(-1);
  }

  app.use("/app", express.static(path.join(__dirname, "../../client/npx browserslist@latest --update-db\n")));

  //serves built react app files under make.rit.edu/app
  app.use("/app/", express.static(path.join(__dirname, '../../client/build')));


  papercut.registerEndpoints(app)

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
    res.redirect(SECURE_ORIGIN+"/app/")
  })


  //redirects first landing make.rit.edu/ -> make.rit.edu/home
  app.get("/", function (req, res) {
    res.redirect(SECURE_ORIGIN+"/app/home");
  });

  app.get("/app/*apppage", function (req, res) {
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

  app.all("/api/files/*filename", async function (req, res, next) {
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
    if (reader == null) {
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
   * HOURS--
   * Fetch the hours associated with a makerspace string
   */
  app.get("/api/hours/:makerspace", async function (req, res) {
    try {
      const hourRows = await getMakerspaceHoursNextWeek(Number(req.params.makerspace));

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

  /**
   * File Uploads
   */

  app.post("/api/uploads/web-content", express.raw({ type: "application/octet-stream", limit: 8 * 1024 * 1024 }), async function (req, res) {
    if (!req.user || !isStaff(determineUser(req.user))) {
      return res.status(401).send("Only staff or higher may upload files");
    }

    const file: Buffer = req.body;

    if (!file || file.length < 0) {
      return res.status(400).send("File not found");
    }

    const new_name = (new Date()).valueOf().toString();

    try {
      await S3.putObject("user-uploads", new_name, file);
    } catch (e) {
      return res.status(400).send(e);
    }

    return res.status(201).contentType("application/text").send(new_name);
  });


  /**=================================
   * SCHEDULED ACTIONS
  ==================================*/

  async function handleTrainingExpiriesAndEmails() {
    function sendEmails(type: "warning" | "expiry", expiries: { email: string, moduleIds: number[], moduleNames: string[] }[]) {
      expiries.forEach((expiry) => {
        Emailer.send_training_expiry_email(expiry.email, {
          type: type,
          modules: expiry.moduleIds.map((id, index) => {
            return {
              name: expiry.moduleNames[index],
              link: `${process.env.VITE_ORIGIN}/app/maker/training/${id}`
            }
          })
        }
        );
      })
    };

    let expiryNotices = await getPassedTrainingsDaysAgo(365);
    if (expiryNotices.length > EXPIRY_EMAIL_LIMIT_AT_ONCE) {
      // dont overload the emails (100 / hr, 400 / day) 
      expiryNotices = expiryNotices.slice(0, EXPIRY_EMAIL_LIMIT_AT_ONCE);
    }
    sendEmails("expiry", expiryNotices)
    const numPurged = await purgeExpiredPassedModules();

    // DONT SEND THESE AT THE SAME TIME, YOULL PROBABLY LOCKOUT OUR EMAIL PROVIDER FOR SENDING TOO MANY EMAILS
    // const expiryWarnings = await getPassedTrainingsWeeksAgo(49); // 51
    // sendEmails("warning", expiryWarnings)
    // const numWarned = expiryWarnings.length;

    const numNotified = expiryNotices.length

    createLog(`Trainings: Sent ${numNotified} expiry notices, and purged ${numPurged} expired trainings.`, "server")

  }
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

    handleTrainingExpiriesAndEmails();
    //await pruneNullLengthEquipmentSessions().then(async () => await createLog('Unfinished Equipment Sessions pruned.', "server"));;

    // Find unused images on AWS and 'remove' them
    await purge_images();
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
    express.json(),
    expressMiddleware(server, { context: context })
  );

  const PORT = process.env.PORT || 3000;

  console.log(process.env.ID_FORMAT);

  const pingResponse = await pingAtrium();
  if (typeof pingResponse !== 'boolean' || pingResponse == false) {
    console.error("Unable to contact atrium api. Currency functionality may be limited", pingResponse);
  }

  app.listen({ port: PORT }, () => {
    console.log(
      `🚀 GraphQL-Server is running on https://localhost:${PORT}/graphql`
    )
  }
  );
}

startServer();