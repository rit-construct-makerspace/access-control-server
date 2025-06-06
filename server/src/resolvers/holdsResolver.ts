import { ApolloContext, CurrentUser } from "../context.js";
import { Privilege } from "../schemas/usersSchema.js";
import * as HoldsRepo from "../repositories/Holds/HoldsRepository.js";
import * as UsersRepo from "../repositories/Users/UserRepository.js";
import { createLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import { getUsersFullName } from "../repositories/Users/UserRepository.js";
import { HoldRow } from "../db/tables.js";

const HoldsResolvers = {
  Hold: {
    //Map creator field to User
    creator: async (
      parent: HoldRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user: CurrentUser) => {
        return UsersRepo.getUserByID(parent.creatorID);
      }),

    //Map remover field to User
    remover: async (
      parent: HoldRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(
        async (user: CurrentUser) => parent.removerID && UsersRepo.getUserByID(parent.removerID)
      ),
  },

  Mutation: {
    /**
     * Create a Hold
     * @argument userID ID of User subject to the hold
     * @argument description Reason for the hold
     * @returns new Hold
     */
    createHold: async (
      _parent: any,
      args: { userID: string; description: string },
      { isManager }: ApolloContext
    ) =>
      isManager(async (user: CurrentUser) => {
        const userWithHold = await UsersRepo.getUserByID(Number(args.userID));

        await createLog(
          "{user} placed a hold on {user}'s account.",
          "admin",
          { id: user.id, label: getUsersFullName(user) },
          { id: Number(args.userID), label: getUsersFullName(userWithHold) }
        );

        await UsersRepo.setActiveHold(Number(args.userID), true)
        return HoldsRepo.createHold(user.id, Number(args.userID), args.description);
      }),

    /**
     * Set a Hold as inactive
     * @argument holdID ID of the Hold to remove
     * @returns updated Hold
     */
    removeHold: async (
      _parent: any,
      args: { holdID: string },
      { isManager }: ApolloContext
    ) =>
      isManager(async (user: CurrentUser) => {
        const hold = await HoldsRepo.getHold(Number(args.holdID));
        const userWithHold = await UsersRepo.getUserByID(hold.userID);

        await createLog(
          "{user} removed a hold on {user}'s account.",
          "admin",
          { id: user.id, label: getUsersFullName(user) },
          { id: userWithHold.id, label: getUsersFullName(userWithHold) }
        );

        await UsersRepo.setActiveHold(Number(userWithHold.id), false)
        return HoldsRepo.removeHold(Number(args.holdID), user.id);
      }),
  },
};

export default HoldsResolvers;
