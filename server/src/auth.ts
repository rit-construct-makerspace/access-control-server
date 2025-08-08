/**
 * auth.ts
 * Authentication procedures for SAML2
 */

import fs from 'fs';
import passport from "passport";
import {
  Strategy as SamlStrategy,
  ValidateInResponseTo,
} from "@node-saml/passport-saml";

import { Strategy as LocalStrategy } from 'passport-local';
import session from "express-session";
import { v4 as uuidv4 } from "uuid";
import assert from "assert";
import express from "express";
import {
  archiveUser,
  createUser,
  getUserByRitUsername,
  getUserManagerPerms,
  getUserStaffPerms,
  getUserTrainerPerms,
  updateUserName
} from "./repositories/Users/UserRepository.js";
import { getHoldsByUser } from "./repositories/Holds/HoldsRepository.js";
import { CurrentUser } from "./context.js";
import { createLog } from "./repositories/AuditLogs/AuditLogRepository.js";
import path from "path";
import { insertTempRole } from './repositories/tempRolesRepo.js';

const __dirname = import.meta.dirname;

/**
 * General information gathered from a Shibboleth response
 */
interface RitSsoUser {
  firstName: string;
  lastName: string;
  ritUsername: string;
}

/**
 * DEV ONLY
 * Map devUsers file to users
 */
function mapToDevUser(userID: string, password: string) {
  var obj = JSON.parse(fs.readFileSync(path.join(__dirname, "/data/devUsers.json"), 'utf8'));
  const devUser = obj[userID];
  if (devUser === undefined || devUser["password"] !== password) {
    return undefined;
  }
  else {
    return {
      firstName: devUser.firstName,
      lastName: devUser.lastName,
      ritUsername: devUser.ritUsername
    };
  }
}

// Map the test users from samltest.id to match
// the format that RIT SSO will give us.
function mapSamlTestToRit(testUser: any): RitSsoUser {
  console.log("MAP TEST USER: " + testUser["urn:oid:2.5.4.42"]);
  return {
    firstName: testUser["urn:oid:2.5.4.42"],
    lastName: testUser["urn:oid:2.5.4.4"],
    ritUsername: testUser.email.split("@")[0], // samltest format
  };
}

/**
 * Initialize client session
 * @param app NodeJS application context
 */
export function setupSessions(app: express.Application) {
  const secret = process.env.SESSION_SECRET;
  assert(secret, "SESSION_SECRET env value is null");

  app.use(
    session({
      genid: (req) => uuidv4(),
      secret: secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production" ? true : false, // this will make cookies send only over https
        httpOnly: true, // cookies are sent in requests, but not accessible to client-side JS
        maxAge: 7200000, // 40 minutes in milliseconds
        sameSite: process.env.NODE_ENV === "development" ? "lax" : "strict" // allow cookies to send between local ports in development
      },
    })
  );
}

// Unsafe auth -- local development only
export function setupDevAuth(app: express.Application) {
  const reactAppUrl = process.env.REACT_APP_URL;

  assert(reactAppUrl, "REACT_APP_URL env value is null");

  const authStrategy = new LocalStrategy(
    async function (username: string, password: string, done: any) {
      try {
        const devUser = mapToDevUser(username, password);

        if (devUser === undefined) {
          console.log("failed")
          return done(null, false, { message: 'Incorrect username or password.' });
        }
        else {
          console.log("valid login");
          return done(null, devUser);
        }
      }
      catch (err) {
        console.log(err)
        done(null, false, { message: 'some error' });
      }
    }
  );

  //Use SAML strategy
  passport.use(authStrategy);

  //Start Passport SAML
  app.use(passport.initialize());
  //User Passport for user session definitions
  app.use(passport.session());

  //Enable URL parsing for request handling
  app.use(express.urlencoded({ extended: false }));
  //Enable JSON body parsing for request handling
  app.use(express.json());

  //Render dev login page (if DEVELOPMENT mode)
  app.get('/login', function (req, res, next) {
    res.render('login');
  });

  //Handle dev login
  app.post('/login/password', passport.authenticate('local', {
    successRedirect: reactAppUrl,
    failureRedirect: '/login'
  }));

  //Handle logout and session destruction
  //TODO Figure out how to call for the destruction of Shibboleth Session
  app.post("/logout", (req, res) => {

    // for development purposes just nuking the session whenever it is requested
    passport.session().destroy

    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          res.status(400).send("Logout failed");
        } else {
          res.clearCookie("connect.sid");

          res.redirect(process.env.REACT_APP_LOGGED_OUT_URL ?? "");
        }
      });
    } else {
      res.end();
    }
  });
}

//Setup Passport SAML configuration
export function setupStagingAuth(app: express.Application) {
  const issuer = process.env.ISSUER;
  const callbackUrl = process.env.CALLBACK_URL;
  const entryPoint = process.env.ENTRY_POINT;
  const reactAppUrl = process.env.REACT_APP_URL;

  assert(issuer, "ISSUER env value is null");
  assert(callbackUrl, "CALLBACK_URL env value is null");
  assert(entryPoint, "ENTRY_POINT env value is null");
  assert(reactAppUrl, "REACT_APP_URL env value is null");

  /*
  identifierFormat defaults to urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress.
  ITS demanded we use urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified

  this unspecified format is not allowed by samltest.id so in order to test with samltest the variable must be
  temporarily switched back to undefined to use  passportsaml's default nameid-format:emailAddress
   */

  // const samlConfig = {
  //   issuer: issuer,
  //   path: "/login/callback",
  //   callbackUrl: callbackUrl,
  //   entryPoint: entryPoint,
  //   identifierFormat: process.env.ID_FORMAT ?? "",
  //   decryptionPvk: process.env.SSL_PVKEY ?? "",
  //   privateKey: process.env.SSL_PVKEY ?? "",
  //   cert: process.env.IDP_PUBKEY ?? "",
  //   validateInResponseTo: ValidateInResponseTo.never,
  //   disableRequestedAuthnContext: true,
  //   signatureAlgorithm: 'sha256',

  //   // TODO production solution
  //   acceptedClockSkewMs: 1000, // "SAML assertion not yet valid" fix
  // };

  const authStrategy = new SamlStrategy(
    {
      issuer: issuer,
      //path: "/login/callback",
      callbackUrl: callbackUrl,
      entryPoint: entryPoint,
      identifierFormat: process.env.ID_FORMAT ?? "",
      decryptionPvk: process.env.SSL_PVKEY ?? "",
      //privateKey: process.env.SSL_PVKEY ?? "",
      idpCert: (process.env.IDP_PUBKEY ?? "").replace(' ', '').replace('\n', '').replace('\r', ''),
      //validateInResponseTo: ValidateInResponseTo.never,
      disableRequestedAuthnContext: true,
      signatureAlgorithm: "sha256",
      //wantAssertionsSigned: true,
      digestAlgorithm: "sha256",

      // TODO production solution
      acceptedClockSkewMs: 180, // "SAML assertion not yet valid" fix
    },
    (profile: any, done: any) => {
      // your body implementation on success, this is where we get attributes from the idp
      return done(null, profile);
    },
    (profile: any, done: any) => {
      // your body implementation on success, this is where we get attributes from the idp
      return done(null, profile);
    }
  );

  passport.serializeUser(async (user: any, done) => {
    const ritUser =
      process.env.SAML_IDP === "TEST" ? mapSamlTestToRit(user) : user.attributes; //user is the full response data. attributes has the things we need

    console.log("Username: " + ritUser["urn:oid:0.9.2342.19200300.100.1.1"] + "\nRoles: " + ritUser["urn:oid:1.3.6.1.4.1.4447.1.41"]);

    // TEMPORARY -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    try {
      ritUser["urn:oid:1.3.6.1.4.1.4447.1.41"].forEach(async (element: string) => {
        try {
          await insertTempRole(element);
          //Name is unique, so will fail on duplicates
        } catch (error) {
          //nothig
        }
      });
    } catch (error) {
      console.error("Error iterating temp roles:", error);
    }

    /*
      "attributes": {
        "urn:oid:2.5.4.42": "FirstName",
        "urn:oid:2.5.4.4": "LastName",
        "urn:oid:0.9.2342.19200300.100.1.1": "userName",
        "urn:oid:1.3.6.1.4.1.4447.1.20": "uid",
        "urn:oid:1.3.6.1.4.1.4447.1.41": ["roles"]
      }
    */

    // Create user in our database if they don't exist
    var existingUser = await getUserByRitUsername(ritUser["urn:oid:0.9.2342.19200300.100.1.1"]);
    if (!existingUser) {
      existingUser = await createUser({
        firstName: ritUser["urn:oid:2.5.4.42"],
        lastName: ritUser["urn:oid:2.5.4.4"],
        ritUsername: ritUser["urn:oid:0.9.2342.19200300.100.1.1"],
      });
    } else if (existingUser.firstName !== ritUser["urn:oid:2.5.4.42"] || existingUser.lastName != ritUser["urn:oid:2.5.4.4"]) {
      //If Shibboleth name does not match, overwrite user's name to Shibboleth provided info
      await updateUserName(existingUser.id, ritUser["urn:oid:2.5.4.42"], ritUser["urn:oid:2.5.4.4"]);
    }

    // Archive user if they do not have a whitelisted role
    if (process.env.USER_WHITELIST) { // If the env varaible is not set, skip the check. We don't want to archive everyone
      const whitelist = process.env.USER_WHITELIST.split(",");
      const roles: string[] = ritUser["urn:oid:1.3.6.1.4.1.4447.1.41"];

      if (existingUser.forceArchive !== null) {
        await archiveUser(existingUser.id, existingUser.forceArchive)
      } else {
        await archiveUser(existingUser.id, !roles.some((role) => (whitelist.includes(role))));
      }


    }

    done(null, ritUser["urn:oid:0.9.2342.19200300.100.1.1"]);
  });

  passport.deserializeUser(async (user: any, done) => {
    //Here, it is just the username string, not the full object
    const currUser = (await getUserByRitUsername(user)) as unknown as CurrentUser;

    if (!user) throw new Error("Tried to deserialize user that doesn't exist");

    // Populate user.hasHolds
    const holds = await getHoldsByUser(currUser.id);
    currUser.hasHolds = holds.some((hold) => !hold.removeDate);
    currUser.hasCardTag = (currUser.cardTagID != null && currUser.cardTagID != "");

    // Populate user.manager
    const managerPerms: number[] = await getUserManagerPerms(currUser.id);
    currUser.manager = managerPerms;

    // Populate user.staff
    const staffPerms: number[] = await getUserStaffPerms(currUser.id);
    currUser.staff = staffPerms;

    // Populate user.trainer
    const trainerPerms: number[] = await getUserTrainerPerms(currUser.id);
    currUser.trainer = trainerPerms;

    // Populate user.restrictions

    done(null, currUser);
  });

  app.get("/Shibboleth.sso/Metadata", function (req, res) {
    res.type("application/xml");
    res
      .status(200)
      .send(
        authStrategy.generateServiceProviderMetadata(
          process.env.SSL_PUBKEY ?? ""
        )
      );
  });

  passport.use(authStrategy);

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  const authenticate = passport.authenticate("saml", {
    failureFlash: true,
    failureRedirect: "/login/fail",
    successRedirect: reactAppUrl,
  });

  app.get("/login", authenticate);

  app.post("/login/callback", authenticate,

    async (req, res) => {
      console.log("Logged in")
      if (req.user && 'id' in req.user && 'firstName' in req.user && 'lastName' in req.user) {
        await createLog(
          `{user} logged in.`,
          "server",
          { id: req.user.id, label: `${req.user.firstName} ${req.user.lastName}` }
        );
      }
    }
  );

  app.get("/login/fail", function (req, res) {
    console.log("Login failed");
    res.status(401).send("Login failed");
  });

  app.post("/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          res.status(400).send("Logout failed");
        } else {
          // res.clearCookie("connect.sid");
          res.redirect(process.env.REACT_APP_LOGGED_OUT_URL ?? "");
        }
      });
    } else {
      res.end();
    }
  });

}

// TODO: Remove this and any references to this
export function setupAuth(app: express.Application) {
  //DEPRECATE
}