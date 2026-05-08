import { UserRow } from "./database/knex/tables.js";
import { GraphQLError } from "graphql/error/GraphQLError.js";
import { knex } from "./database/knex/index.js";

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

export interface ApolloContext {
  user: CurrentUser | undefined;
  logout: () => void;
  ifAuthenticated: (callback: (user: CurrentUser) => any) => any;
  ifStaffOrSelf: (targetedUserID: number, callback: (user: CurrentUser) => any) => any;
  ifManagerOrSelf: (targetedUserID: number, callback: (user: CurrentUser) => any) => any;
  isAdmin: (callback: (user: CurrentUser) => any) => any;
  isManager: (callback: (user: CurrentUser) => any) => any;
  isStaff: (callback: (user: CurrentUser) => any) => any;
  isTrainer: (callback: (user: CurrentUser) => any) => any;
  isManagerFor: (makerspaceID: number, callback: (user: CurrentUser) => any) => any;
  isStaffFor: (makerspaceID: number, callback: (user: CurrentUser) => any) => any;
  isTrainerFor: (equipmentID: number, callback: (user: CurrentUser) => any) => any;
}

function authenticated(expressUser: Express.User | undefined) {
  if (!expressUser) {
    throw new GraphQLError("Unauthenticated");
  }
}

export function determineUser(expressUser: Express.User | undefined) {
  return expressUser as CurrentUser;
}

// Checks if a user is an admin
const isAdmin =
  (expressUser: Express.User | undefined) =>
    (callback: (user: CurrentUser) => any) => {
      authenticated(expressUser);
      const user = determineUser(expressUser);

      if (!user.admin) {
        throw new GraphQLError("Insufficent Privilege | Not an Admin")
      }

      return callback(user);
    }

/**
 * Checks if a user is a manager for a specific makerspace or higher
 * Admin
 * ^ Manager
 */
const isManagerFor =
  (expressUser: Express.User | undefined) =>
    (makerspaceID: number, callback: (user: CurrentUser) => any) => {
      makerspaceID = Number(makerspaceID);
      authenticated(expressUser);
      const user = determineUser(expressUser);

      if (!user.manager.includes(makerspaceID) && !user.admin) {
        throw new GraphQLError(`Insufficent Privilege | Not Manager of Makerspace ${makerspaceID}`);
      }

      return callback(user);
    }

/**
 * Checks if a user is staff for a specific makerspace or higher
 * Admin
 * ^ Manager
 * ^ Staff
 */
const isStaffFor =
  (expressUser: Express.User | undefined) =>
    (makerspaceID: number, callback: (user: CurrentUser) => any) => {
      makerspaceID = Number(makerspaceID);
      authenticated(expressUser);
      const user = determineUser(expressUser);
      if (!user.staff.includes(makerspaceID) && !user.manager.includes(makerspaceID) && !user.admin) {
        throw new GraphQLError(`Insufficent Privilege | Not Staff of Makersapce ${makerspaceID}`);
      }

      return callback(user);
    }

/**
 * Checks if a user is a trainer for a specific piece of equipment or if they are an admin
 * Admin
 * ^ Trainer
 */
const isTrainerFor =
  (expressUser: Express.User | undefined) =>
    (equipmentID: number, callback: (user: CurrentUser) => any) => {
      equipmentID = Number(equipmentID);
      authenticated(expressUser);
      const user = determineUser(expressUser);

      if (!user.trainer.includes(equipmentID) && !user.admin) {
        throw new GraphQLError(`Insufficent Privilege | Not Trainer for Equipment ${equipmentID}`);
      }

      return callback(user);
    }

/**
 * Checks if a user is a manager or higher
 * Admin
 * ^ Manager
 */
const isManager =
  (expressUser: Express.User | undefined) =>
    (callback: (user: CurrentUser) => any) => {
      authenticated(expressUser);
      const user = determineUser(expressUser);

      if (user.manager.length <= 0 && !user.admin) {
        throw new GraphQLError("Insufficent Privilege | Not a Manager");
      }

      return callback(user);
    }

/**
 * Checks if a user is staff or higher
 * Admin
 * ^ Manager
 * ^ Staff
 */
const isStaff =
  (expressUser: Express.User) =>
    (callback: (user: CurrentUser) => any) => {
      authenticated(expressUser);
      const user = determineUser(expressUser);

      if (user.staff.length <= 0 && user.manager.length <= 0 && !user.admin) {
        throw new GraphQLError("Insufficent Privilege | Not a Staff");
      }

      return callback(user);
    }

/**
 * Checks if a user is a trainer or higher
 * Admin
 * ^ Manager
 * ^ Staff
 * ^ Trainer
 */
const isTrainer =
  (expressUser: Express.User | undefined) =>
    (callback: (user: CurrentUser) => any) => {
      authenticated(expressUser);
      const user = determineUser(expressUser);

      if (user.trainer.length <= 0 && user.staff.length <= 0 && user.manager.length <= 0 && !user.admin) {
        throw new GraphQLError("Insufficent Privilege | Not a Trainer");
      }

      return callback(user);
    }

/**
 * Checks if a user is staff or self
 * Admin
 * ^ Manager
 * ^ Staff
 */
const ifStaffOrSelf =
  (expressUser: Express.User | undefined) =>
    (targetedUserID: number, callback: (user: CurrentUser) => any) => {
      authenticated(expressUser);
      const user = determineUser(expressUser);

      if (user.id === targetedUserID) {
        return callback(user);
      } else if (user.staff.length > 0 || user.manager.length > 0 || user.admin) {
        return callback(user);
      } else {
        throw new GraphQLError(`Forbidden | Not User ${targetedUserID} or Staff`);
      }
    };

// only checks if user is authenticated (for actions where holds or privileges do not matter)
const ifAuthenticated =
  (expressUser: Express.User | undefined) =>
    (callback: (user: CurrentUser) => any) => {
      if (!expressUser) {
        throw new GraphQLError("Unauthenticated");
      }

      const user = expressUser as CurrentUser;
      return callback(user);
    };

const ifManagerOrSelf = (expressUser: Express.User | undefined) => (targetedUserID: number, callback: (user: CurrentUser) => any) => {
  if (!expressUser) {
    throw new GraphQLError("Unauthenticated");
  }

  const user = determineUser(expressUser);
  if (user.id === targetedUserID) {
    return callback(user);
  } else if (user.manager.length > 0 || user.admin) {
    return callback(user);
  } else {
    throw new GraphQLError(`Forbidden | Not User ${targetedUserID} or Manager`)
  }
}

const context = async ({ req }: { req: any }) => ({
  user: req.user,
  logout: () => req.logout(),
  isAdmin: isAdmin(req.user),
  isManager: isManager(req.user),
  isStaff: isStaff(req.user),
  isTrainer: isTrainer(req.user),
  isManagerFor: isManagerFor(req.user),
  isStaffFor: isStaffFor(req.user),
  isTrainerFor: isTrainerFor(req.user),
  ifAuthenticated: ifAuthenticated(req.user),
  ifStaffOrSelf: ifStaffOrSelf(req.user),
  ifManagerOrSelf: ifManagerOrSelf(req.user),
});

export default context;
