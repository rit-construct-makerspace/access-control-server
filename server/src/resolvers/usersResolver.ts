import * as UserRepo from "../repositories/Users/UserRepository.js";
import * as ModuleRepo from "../repositories/Training/ModuleRepository.js";
import * as HoldsRepo from "../repositories/Holds/HoldsRepository.js";
import * as AccessCheckRepo from "../repositories/Equipment/AccessChecksRepository.js";
import * as EquipmentRepo from "../repositories/Equipment/EquipmentRepository.js";
import * as RoomRepo from "../repositories/Rooms/RoomRepository.js";
import * as RestrictionRepo from "../repositories/Restrictions/RestrictionsRepository.js";
import * as CurrencyAccountRepo from "../repositories/Currency/CurrencyAccountsRepository.js";
import { Privilege } from "../schemas/usersSchema.js";
import { createLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import { ApolloContext, CurrentUser } from "../context.js";
import { getUsersFullName } from "../repositories/Users/UserRepository.js";
import { getActiveTrainingHoldsByUser, getTrainingHoldsByUser } from "../repositories/Training/TrainingHoldsRespository.js";
import { getZoneByID } from "../repositories/Zones/ZonesRespository.js";
import { EntityNotFound } from "../EntityNotFound.js";
import { UserRow } from "../db/tables.js";

const UsersResolvers = {
  User: {
    //Map holds field to array of Holds
    holds: async (
      parent: { id: string },
      _args: any,
      _context: ApolloContext
    ) => {
      return HoldsRepo.getHoldsByUser(Number(parent.id));
    },

    // Map restrictions field to array of Restricitons
    restrictions: async (
      parent: { id: string },
      _args: any,
      _context: ApolloContext
    ) => {
      return RestrictionRepo.getRestrictionsByUserID(Number(parent.id))
    },

    //Map passedModules field to array of passed TrainingModules
    passedModules: async (
      parent: { id: string },
      _args: any,
      _context: ApolloContext) => {
      return ModuleRepo.getPassedModulesByUser(Number(parent.id));
    },

    //Map accessChecks to array of AccessChecks
    accessChecks: async (
      parent: { id: string },
      _args: any,
      _context: ApolloContext
    ) => {
      return AccessCheckRepo.getAccessChecksByUserID(Number(parent.id));
    },

    //Map trainingHolds field to array of active TrainingHolds
    trainingHolds: async (
      parent: { id: string },
      _args: any,
      _context: ApolloContext
    ) => {
      return getActiveTrainingHoldsByUser(Number(parent.id));
    },

    manager: async (
      parent: { id: string },
      _args: any,
      _context: ApolloContext
    ) => {
      return UserRepo.getUserManagerPerms(Number(parent.id))
    },

    staff: async (
      parent: { id: string },
      _args: any,
      _context: ApolloContext
    ) => {
      return UserRepo.getUserStaffPerms(Number(parent.id))
    },

    trainer: async (
      parent: { id: string },
      _args: any,
      _context: ApolloContext
    ) => {
      return UserRepo.getUserTrainerPerms(Number(parent.id))
    },

    currencyAccount: async (
      parent: UserRow,
      _args: any,
      { ifStaffOrSelf }: ApolloContext
    ) => {
      return ifStaffOrSelf(Number(parent.id), () => (CurrencyAccountRepo.getAccountByID(Number(parent.accountID))));
    }

  },

  Query: {
    /**
     * Fetch all users by search text
     * @argument searchText String to inclusively filter by related username, firstName, and lastName
     * @returns array of Users
     */
    users: async (
      _parent: any,
      args: { searchText: string },
      { isStaff }: ApolloContext) =>
      isStaff(async () => {
        const searchText = args.searchText ?? "";
        return await UserRepo.getUsers(searchText);
      }),

    /**
     * Fetch all users by search text with a limit of 100 users
     * @argument searchText String to inclusively filter by related username, firstName, and lastName
     * @returns array of Users
     */
    usersLimit: async (
      _parent: any,
      args: { searchText: string },
      { isTrainer }: ApolloContext) =>
      isTrainer(async () => {
        const searchText = args.searchText ?? "";
        return await UserRepo.getUsersLimit(searchText);
      }),

    /**
     * Fetch a user by ID
     * @argument id ID of the User
     * @returns User
     */
    user: async (
      _parent: any,
      args: { id: string },
      { ifAuthenticated }: ApolloContext) =>
      ifAuthenticated(async () => {
        return await UserRepo.getUserByID(Number(args.id));
      }),

    /**
     * Fetch the user for the current Apollo session
     * @returns User
     */
    currentUser: async (
      _parent: any,
      _args: any,
      { user }: ApolloContext) => {
      return user;
    },

    /**
     * Fetch the number of total users
     * @returns String JSON of {count: number}
     */
    numUsers: async (
      _parent: any,
      _args: any,
      { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return await UserRepo.getNumUsers();
      }),

    /**
     * Fetch a user by search string for cardTagID or ritUsername
     * @argument value string for inclusive search
     * @returns User or undefined
     */
    userByUsernameorUID: async (
      _parent: any,
      args: { value: string },
      { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return await UserRepo.getUserByUsernameOrUID(args.value);
      }),
  },

  Mutation: {
    /**
     * Create a User
     * @argument firstName User's Preffered First Name
     * @argument lastName User's Last Name / Family Name
     * @argument ritUsername RIT ITS Username
     * @returns User
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    createUser: async (
      _parent: any,
      args: {
        firstName: string;
        lastName: string;
        ritUsername: string;
      },
      { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return await UserRepo.createUser(args);
      }),

    /**
     * Modify a User to complete other profile items
     * @argument userID ID of User to modify
     * @argument pronouns User's pronouns (ex: "They / Them")
     * @argument college User's College shorthand (ex: "KGCOE")
     * @argument expectedGraduation Expected Graduation Year and Semester (ex: "Summer 2028")
     * @returns User
     * @throws GraphQLError if not MENTOR or STAFF or is on hold. Allow if subject user is requesting user
     */
    updateStudentProfile: async (
      _: any,
      args: {
        userID: string;
        pronouns: string;
        college: string;
        expectedGraduation: string;
      },
      { ifStaffOrSelf }: ApolloContext) =>
      ifStaffOrSelf(Number(args.userID), async () => {
        return await UserRepo.updateStudentProfile({
          userID: Number(args.userID),
          pronouns: args.pronouns,
          college: args.college,
          expectedGraduation: args.expectedGraduation
        });
      }),

    /**
     * Modify a User's cardTagID
     * @argument userID ID of User to modify
     * @argument cardTagID New value
     * @returns User
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    setCardTagID: async (
      _parent: any,
      args: { userID: string, cardTagID: string },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (executingUser: any) => {
        const userSubject = await UserRepo.setCardTagID(Number(args.userID), args.cardTagID);

        await createLog(
          `{user} updated {user}'s Card Tag ID.`,
          "admin",
          { id: executingUser.id, label: getUsersFullName(executingUser) },
          { id: userSubject.id, label: getUsersFullName(userSubject) }
        );
      }),

    /**
     * Modify a User's notes field
     * @argument userID ID of User to modify
     * @argument notes New value
     * @returns User
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    setNotes: async (
      _parent: any,
      args: { userID: string, notes: string },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (executingUser: any) => {
        const userSubject = await UserRepo.setNotes(Number(args.userID), args.notes);
      }),

    /**
     * Modify a User's Privilege
     * @argument userID ID of User to modify
     * @argument privilege New value
     * @returns User
     * @throws GraphQLError if not STAFF or is on hold
     */
    setPrivilege: async (
      _parent: any,
      args: { userID: string; privilege: Privilege },
      { isManager }: ApolloContext
    ) =>
      isManager(async (executingUser: any) => {
        const userSubject = await UserRepo.setPrivilege(Number(args.userID), args.privilege);

        await createLog(
          `{user} set {user}'s access level to ${args.privilege}.`,
          "admin",
          { id: executingUser.id, label: getUsersFullName(executingUser) },
          { id: userSubject.id, label: getUsersFullName(userSubject) }
        );
      }),

    /**
     * Set a User as Archived
     * @argument userID ID of User to modify
     * @returns User
     * @throws GraphQLError if not STAFF or is on hold 
     */
    archiveUser: async (
      _parent: any,
      args: { userID: string },
      { isManager }: ApolloContext
    ) =>
      isManager(
        async (user: any) => {

          const userSubject = await UserRepo.getUserByID(Number(args.userID));

          await createLog(
            `{user} archived {user}'s profile.`,
            "admin",
            { id: user.id, label: getUsersFullName(user) },
            { id: args.userID, label: getUsersFullName(userSubject) }
          );

          return await UserRepo.archiveUser(Number(args.userID), true);
        }
      ),

    setUserAdmin: async (
      _parent: any,
      args: { userID: number, admin: boolean },
      { isAdmin }: ApolloContext
    ) => isAdmin(async (user: CurrentUser) => {
      const target = await UserRepo.getUserByID(Number(args.userID));
      await createLog(
        `{user} ${args.admin ? "granted" : "revoked"} ADMIN access ${args.admin ? "to" : "from"} {user}`,
        "admin",
        { id: user.id, label: getUsersFullName(user) },
        { id: target.id, label: getUsersFullName(target) }
      );
      return await UserRepo.setUserAdmin(args.userID, args.admin);
    }),

    makeUserManager: async (
      _parent: any,
      args: { userID: number, makerspaceID: number },
      { isAdmin }: ApolloContext
    ) => isAdmin(async (user: CurrentUser) => {
      const target = await UserRepo.getUserByID(args.userID);
      const makerspace = await getZoneByID(args.makerspaceID);
      if (makerspace === undefined) {
        throw new EntityNotFound(`Makerspace ${args.makerspaceID} Not Found`);
      }
      await createLog(
        `{user} granted MANAGER access for {makerspace} to {user}`,
        "admin",
        { id: user.id, label: getUsersFullName(user) },
        { id: args.makerspaceID, label: makerspace.name },
        { id: args.userID, label: getUsersFullName(target) }
      );
      return await UserRepo.makeUserManager(args.userID, args.makerspaceID);
    }),

    makeUserStaff: async (
      _parent: any,
      args: { userID: number, makerspaceID: number },
      { isManagerFor }: ApolloContext
    ) => isManagerFor(args.makerspaceID, async (user: CurrentUser) => {
      const target = await UserRepo.getUserByID(args.userID);
      const makerspace = await getZoneByID(args.makerspaceID);
      if (makerspace === undefined) {
        throw new EntityNotFound(`Makerspace ${args.makerspaceID} Not Found`);
      }
      await createLog(
        `{user} granted STAFF access for {makerspace} to {user}`,
        "admin",
        { id: user.id, label: getUsersFullName(user) },
        { id: args.makerspaceID, label: makerspace.name },
        { id: args.userID, label: getUsersFullName(target) }
      );
      return await UserRepo.makeUserStaff(args.userID, args.makerspaceID);
    }),

    makeUserTrainer: async (
      _parent: any,
      args: { userID: number, equipmentID: number },
      { isManagerFor }: ApolloContext
    ) => {
      const equipment = await EquipmentRepo.getEquipmentByID(args.equipmentID);
      const room = await RoomRepo.getRoomByID(equipment.roomID);
      return await isManagerFor(room?.zoneID ?? -1, async (user: CurrentUser) => {
        const target = await UserRepo.getUserByID(args.userID);
        await createLog(
          `{user} granted TRAINER access for {equipment} to {user}`,
          "admin",
          { id: user.id, label: getUsersFullName(user) },
          { id: args.equipmentID, label: equipment.name },
          { id: args.userID, label: getUsersFullName(target) }
        );
        return await UserRepo.makeUserTrainer(args.userID, args.equipmentID);
      })
    },

    revokeUserManager: async (
      _parent: any,
      args: { userID: number, makerspaceID: number },
      { isAdmin }: ApolloContext
    ) => isAdmin(async (user: CurrentUser) => {
      const target = await UserRepo.getUserByID(args.userID);
      const makerspace = await getZoneByID(args.makerspaceID);
      if (makerspace === undefined) {
        throw new EntityNotFound(`Makerspace ${args.makerspaceID} Not Found`);
      }
      await createLog(
        `{user} revoked MANAGER access for {makerspace} from {user}`,
        "admin",
        { id: user.id, label: getUsersFullName(user) },
        { id: args.makerspaceID, label: makerspace.name },
        { id: args.userID, label: getUsersFullName(target) }
      );
      return await UserRepo.revokeUserManager(args.userID, args.makerspaceID);
    }),

    revokeUserStaff: async (
      _parent: any,
      args: { userID: number, makerspaceID: number },
      { isManagerFor }: ApolloContext
    ) => isManagerFor(args.makerspaceID, async (user: CurrentUser) => {
      const target = await UserRepo.getUserByID(args.userID);
      const makerspace = await getZoneByID(args.makerspaceID);
      if (makerspace === undefined) {
        throw new EntityNotFound(`Makerspace ${args.makerspaceID} Not Found`);
      }
      await createLog(
        `{user} revoked STAFF access for {makerspace} from {user}`,
        "admin",
        { id: user.id, label: getUsersFullName(user) },
        { id: args.makerspaceID, label: makerspace.name },
        { id: args.userID, label: getUsersFullName(target) }
      );
      return await UserRepo.revokeUserStaff(args.userID, args.makerspaceID);
    }),

    revokeUserTrainer: async (
      _parent: any,
      args: { userID: number, equipmentID: number },
      { isManagerFor }: ApolloContext
    ) => {
      const equipment = await EquipmentRepo.getEquipmentByID(args.equipmentID);
      const room = await RoomRepo.getRoomByID(equipment.roomID);
      return await isManagerFor(room?.zoneID ?? -1, async (user: CurrentUser) => {
        const target = await UserRepo.getUserByID(args.userID);
        await createLog(
          `{user} revoked TRAINER access for {equipment} from {user}`,
          "admin",
          { id: user.id, label: getUsersFullName(user) },
          { id: args.equipmentID, label: equipment.name },
          { id: args.userID, label: getUsersFullName(target) }
        );
        return await UserRepo.revokeUserTrainer(args.userID, args.equipmentID);
      })
    },

    forceArchiveUser: async (
      _parent: any,
      args: {
        userID: number,
        force: boolean | null
      },
      { isManager }: ApolloContext
    ) => {
      return await isManager(async () => {
        return await UserRepo.setForceArchive(args.userID, args.force);
      })
    }

  }
};

export default UsersResolvers;
