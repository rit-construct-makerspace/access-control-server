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
import session, { Store } from "express-session";
import { v4 as uuidv4 } from "uuid";
import assert from "assert";
import express, { json } from "express";
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
import * as SessionRepo from "./repositories/Users/SessionRepository.js";

const __dirname = import.meta.dirname;

/**
 * General information gathered from a Shibboleth response
 */
interface RitSsoUser {
  firstName: string;
  lastName: string;
  ritUsername: string;
}

// Map the test users from samltest.id to match
// the format that RIT SSO will give us.
function mapSamlTestToRit(testUser: any): RitSsoUser {
  return {
    firstName: testUser["urn:oid:2.5.4.42"],
    lastName: testUser["urn:oid:2.5.4.4"],
    ritUsername: testUser.email.split("@")[0], // samltest format
  };
}

class PostgresStore extends Store {
  async get(sid: string, callback: (err: any, session?: session.SessionData | null) => void) {
    try {
      const sesh_result = await SessionRepo.getSession(sid);
      if (!sesh_result) {
        return callback(null, null);
      }

      const session_data: session.SessionData = JSON.parse(sesh_result.session);

      return callback(null, session_data);


    } catch (e) {
      return callback(e, null);
    }
  }

  async set(sid: string, session: session.SessionData, callback?: (err?: any) => void) {
    try {
      await SessionRepo.setSession(sid, JSON.stringify(session));
      if (callback) {
        return callback(null);
      }
    } catch (e) {

      if (callback) {
        return callback(e);
      }
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      await SessionRepo.deleteSession(sid);
      if (callback) {
        return callback(null);
      }
    } catch (e) {
      if (callback) {
        return callback(e);
      }
    }
  }
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
        maxAge: 86400000, // 24 hours in milliseconds
        sameSite: process.env.NODE_ENV === "development" ? "lax" : "strict" // allow cookies to send between local ports in development
      },
      store: new PostgresStore,
    })
  );
}

// Unsafe auth -- local development only
export function setupDevAuth(app: express.Application) {
  const issuer = process.env.ISSUER;
  const callbackUrl = process.env.CALLBACK_URL;
  const entryPoint = process.env.ENTRY_POINT;
  const vite_url = process.env.VITE_URL;

  assert(issuer, "ISSUER env value is null");
  assert(callbackUrl, "CALLBACK_URL env value is null");
  assert(entryPoint, "ENTRY_POINT env value is null");
  assert(vite_url, "VITE_URL env value is null");

  const authStrategy = new SamlStrategy({
    issuer: issuer,
    //path: "/login/callback",
    callbackUrl: callbackUrl,
    entryPoint: entryPoint,
    identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
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
    //user is the full response data. attributes has the things we need
    const ritUser = mapSamlTestToRit(user);

    // Create user in our database if they don't exist
    var existingUser = await getUserByRitUsername(ritUser.ritUsername);
    if (!existingUser) {
      existingUser = await createUser({
        firstName: ritUser.firstName,
        lastName: ritUser.lastName,
        ritUsername: ritUser.ritUsername,
      });
    }

    // Archive user if they do not have a whitelisted role
    if (process.env.USER_WHITELIST) { // If the env varaible is not set, skip the check. We don't want to archive everyone
      const whitelist = process.env.USER_WHITELIST.split(",");
      const roles: string[] = ["Student", "Employee"];

      if (existingUser.forceArchive !== null) {
        await archiveUser(existingUser.id, existingUser.forceArchive)
      } else {
        await archiveUser(existingUser.id, !roles.some((role) => (whitelist.includes(role))));
      }
    }

    done(null, ritUser.ritUsername);
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
    res.status(200).send(
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
    successRedirect: vite_url,
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
          res.redirect(process.env.VITE_LOGGED_OUT_URL ?? "");
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
  const reactAppUrl = process.env.VITE_URL;

  assert(issuer, "ISSUER env value is null");
  assert(callbackUrl, "CALLBACK_URL env value is null");
  assert(entryPoint, "ENTRY_POINT env value is null");
  assert(reactAppUrl, "VITE_URL env value is null");

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
    const ritUser = user.attributes; //user is the full response data. attributes has the things we need

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
          res.redirect(process.env.VITE_LOGGED_OUT_URL ?? "");
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