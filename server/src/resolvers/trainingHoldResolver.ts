/**
 * trainingHoldResolver.ts
 * GraphQL Endpoint Implementations for TrainingHolds
 */

import { ApolloContext } from "../context.js";
import { TrainingHoldsRow } from "../knex/tables.js";
import { createUnassocaitedAuditLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import { getModuleByID } from "../repositories/Training/ModuleRepository.js";
import { deleteTrainingHold, getTrainingHoldByID } from "../repositories/Training/TrainingHoldsRespository.js";
import { getUserByID, getUsersFullName } from "../repositories/Users/UserRepository.js";

export const TrainingHoldResolver = {
  TrainingHold: {
    //Map the module field to TrainingModule
    module: async (
      parent: TrainingHoldsRow,
      _: any,
      { ifAuthenticated }: ApolloContext
    ) =>
      ifAuthenticated(async () => {
        return await getModuleByID(parent.moduleID)
      }),

    //Map the user field to User
    user: async (
      parent: TrainingHoldsRow,
      _: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(async () => {
        return await getUserByID(parent.userID)
      }),
  },

  Mutation: {
    /**
     * Delete a TrainingHold
     * @argument id ID of TrainingHold to delete
     * @returns true
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    deleteTrainingHold: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user) => {
        const hold = await getTrainingHoldByID(args.id);
        if (!hold) throw Error("Training hold does not exist.");
        const recipient = await getUserByID(hold.userID)
        if (!recipient) throw Error("Recipient User does not exist.");
        const module = await getModuleByID(hold.moduleID)
        if (!module) throw Error("Held Module does not exist.");
        await createUnassocaitedAuditLog("{user} has removed a hold on training {module} for {user}", "admin", { id: user.id, label: getUsersFullName(user) }, { id: module.id, label: module.name }, { id: recipient.id, label: getUsersFullName(recipient) });
        return await deleteTrainingHold(args.id);
      }),
  }
}