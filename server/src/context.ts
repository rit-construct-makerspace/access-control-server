import { Privilege } from "./schemas/usersSchema.js";
import { UserRow } from "./db/tables.js";
import { GraphQLError } from "graphql/error/GraphQLError.js";
import { knex } from "./db/index.js";

// console.log("Migrating");
// const ret = await knex.migrate.latest()
// console.log("Done", ret);

export interface CurrentUser extends UserRow {
  hasHolds: boolean;
  hasCardTag: boolean;
  manager: number[];
  staff: number[];
  trainer: number[];
}

const testuser: CurrentUser = {
  id: 16,
  firstName: "Test",
  lastName: "User",
  pronouns: "They / Them",
  isStudent: true,
  privilege: Privilege.STAFF,
  registrationDate: new Date(),
  expectedGraduation: "June 2077",
  college: "GCCIS",
  setupComplete: true,
  ritUsername: "jxh6319",
  archived: false,
  balance: "0",
  manager: [],
  staff: [],
  trainer: [],
  cardTagID: "12345",
  notes: "",
  activeHold: false,
  admin: true,
  hasHolds: false,
  hasCardTag: true,
};

export interface ApolloContext {
  user: CurrentUser | undefined;
  logout: () => void;
  ifAuthenticated: (callback: (user: CurrentUser) => any) => any;
  ifStaffOrSelf: (callback: (user: CurrentUser) => any) => any;
  isAdmin: (callback: (user: CurrentUser) => any) => any;
  isManager: (callback: (user: CurrentUser) => any) => any;
  isStaff: (callback: (user: CurrentUser) => any) => any;
  isTrainer: (callback: (user: CurrentUser) => any) => any;
  isManagerFor: (makerspaceID: number, callback: (user: CurrentUser) => any) => any;
  isStaffFor: (makerspaceID: number, callback: (user: CurrentUser) => any) => any;
  isTrainerFor: (equipmentID: number, callback: (user: CurrentUser) => any) => any;
}

function authenticated(expressUser: Express.User | undefined) {
  if (process.env.USE_TEST_DEV_USER_DANGER != "TRUE" && !expressUser) {
    throw new GraphQLError("Unauthenticated");
  } 
}

// Checks if a user is an admin
export const isAdmin =
  (expressUser: Express.User | undefined) =>
  (callback: (user: CurrentUser) => any) => {
    authenticated(expressUser);
    const user = expressUser as CurrentUser;

    if (!user.admin) {
      throw new GraphQLError("Insufficent Privilege | Not an Admin")
    }

    return callback(process.env.USE_TEST_DEV_USER_DANGER != "TRUE" ? user : testuser);
  }

/**
 * Checks if a user is a manager for a specific makerspace or higher
 * Admin
 * ^ Manager
 */
export const isManagerFor =
  (expressUser: Express.User | undefined) =>
  (makerspaceID: number, callback: (user: CurrentUser) => any) => {
    authenticated(expressUser);
    const user = expressUser as CurrentUser;

    if (!user.manager.includes(makerspaceID) && !user.admin) {
      throw new GraphQLError(`Insufficent Privilege | Not Manager of Makerspace ${makerspaceID}`);
    }

    return callback(process.env.USE_TEST_DEV_USER_DANGER != "TRUE" ? user : testuser);
  }

/**
 * Checks if a user is staff for a specific makerspace or higher
 * Admin
 * ^ Manager
 * ^ Staff
 */
export const isStaffFor =
  (expressUser: Express.User | undefined) =>
  (makerspaceID: number, callback: (user: CurrentUser) => any) => {
    authenticated(expressUser);
    const user = expressUser as CurrentUser;
    if (!user.staff.includes(makerspaceID) && !user.manager.includes(makerspaceID) && !user.admin) {
      throw new GraphQLError(`Insufficent Privilege | Not Staff of Makersapce ${makerspaceID}`);
    }

    return callback(process.env.USE_TEST_DEV_USER_DANGER != "TRUE" ? user : testuser);
  }

/**
 * Checks if a user is a trainer for a specific piece of equipment or if they are an admin
 * Admin
 * ^ Trainer
 */
export const isTrainerFor = 
  (expressUser: Express.User | undefined) =>
  (equipmentID: number, callback: (user: CurrentUser) => any) => {
    authenticated(expressUser);
    const user = expressUser as CurrentUser;

    if (!user.trainer.includes(equipmentID) && !user.admin) {
      throw new GraphQLError(`Insufficent Privilege | Not Trainer for Equipment ${equipmentID}`);
    }

    return callback(process.env.USE_TEST_DEV_USER_DANGER != "TRUE" ? user : testuser);
  }

/**
 * Checks if a user is a manager or higher
 * Admin
 * ^ Manager
 */
export const isManager =
  (expressUser: Express.User | undefined) =>
  (callback: (user: CurrentUser) => any) => {
    authenticated(expressUser);
    const user = expressUser as CurrentUser;

    if (user.manager.length <= 0 && !user.admin) {
      throw new GraphQLError("Insufficent Privilege | Not a Manager");
    }

    return callback(process.env.USE_TEST_DEV_USER_DANGER != "TRUE" ? user : testuser);
  }

/**
 * Checks if a user is staff or higher
 * Admin
 * ^ Manager
 * ^ Staff
 */
export const isStaff =
  (expressUser: Express.User) =>
  (callback: (user: CurrentUser) => any) => {
    authenticated(expressUser);
    const user = expressUser as CurrentUser;
    console.log(user)
    if (user.staff.length <= 0 && user.manager.length <= 0 && !user.admin) {
      throw new GraphQLError("Insufficent Privilege | Not a Staff");
    }

    return callback(process.env.USE_TEST_DEV_USER_DANGER != "TRUE" ? user : testuser);
  }

/**
 * Checks if a user is a trainer or higher
 * Admin
 * ^ Manager
 * ^ Staff
 * ^ Trainer
 */
export const isTrainer =
  (expressUser: Express.User | undefined) =>
  (callback: (user: CurrentUser) => any) => {
    authenticated(expressUser);
    const user = expressUser as CurrentUser;

    if (user.trainer.length <= 0 && user.staff.length <= 0 && user.manager.length <= 0 && !user.admin) {
      throw new GraphQLError("Insufficent Privilege | Not a Trainer");
    }

    return callback(process.env.USE_TEST_DEV_USER_DANGER != "TRUE" ? user : testuser);
  }

/**
 * Checks if a user is staff or self
 * Admin
 * ^ Manager
 * ^ Staff
 */
export const ifStaffOrSelf =
  (expressUser: Express.User | undefined) =>
  (targetedUserID: number, callback: (user: CurrentUser) => any) => {
    authenticated(expressUser);
    const user = expressUser as CurrentUser;

    if (user.id === targetedUserID) {
      return callback(user);
    } else if (user.staff.length > 0 || user.manager.length > 0 || user.admin) {
      return callback(user);
    } else {
      throw new GraphQLError(`Forbidden | Not User ${targetedUserID} or Staff`);
    }
  };

// only checks if user is authenticated (for actions where holds or privileges do not matter)
export const ifAuthenticated =
  (expressUser: Express.User | undefined) =>
  (callback: (user: CurrentUser) => any) => {
    if (process.env.USE_TEST_DEV_USER_DANGER != "TRUE" && !expressUser) {
      throw new GraphQLError("Unauthenticated");
    }

    const user = expressUser as CurrentUser;
    return callback(process.env.USE_TEST_DEV_USER_DANGER != "TRUE" ? user : testuser);
  };

const context = async ({ req }: { req: any }) => ({
  user: process.env.USE_TEST_DEV_USER_DANGER != "TRUE" ? req.user : testuser,
  logout: () => req.logout(),
  isAdmin: isAdmin(req.user),
  isManager: isManager(req.user),
  isStaff: isStaff(req.user),
  isTrainer: isTrainer(req.user),
  isManagerFor: isManagerFor(req.user),
  isStaffFor: isStaffFor(req.user),
  isTrainerFor: isTrainerFor(req.user),
  ifAuthenticated: ifAuthenticated(req.user)
});

export default context;