/**
 * trainingSubmissionResolver.ts
 * GraphQL Endpoint Implementations for ModuleSubmissions
 */

import * as SubmissionRepo from "../repositories/Training/SubmissionRepository.js";
import { ApolloContext } from "../context.js";

const TrainingSubmissionResolvers = {
  Query: {
    /**
     * Fetch a ModuleSubmission by ID
     * @argument submissionID ID of the ModuleSubmission
     * @returns ModuleSubmission
     * @throws GraphQLError if not authenticated or is on hold
     */
    submission: async (
      parent: any,
      args: { submissionID: string },
      { ifAuthenticated }: ApolloContext
    ) => 
      ifAuthenticated (async (user: any) => {
        return SubmissionRepo.getSubmission(Number(args.submissionID));
    }),

    /**
     * Fetch all ModuleSubmissions
     * @returns array of ModuleSubmission
     * @throws GraphQLError if not authenticated or is on hold
     */
    submissions: async (
      _parent: any,
      args: { moduleID: string },
      { ifAuthenticated }: ApolloContext
    ) =>
      ifAuthenticated(async (user: any) => {
        return args.moduleID ? 
          await SubmissionRepo.getSubmissionsByModule(user.id, Number(args.moduleID)) :
          await SubmissionRepo.getSubmissionsByUser(user.id)
    }),

    /**
     * Fetch the last submitted ModuleSubmission for the specified module
     * @argument moduleID ID of the TrainingModule to filter by
     * @returns ModuleSubmission
     * @throws GraphQLError if not authenticated or is on hold
     */
    latestSubmission: async (
      _parent: any,
      args: { moduleID: string },
      { ifAuthenticated }: ApolloContext
    ) =>
      ifAuthenticated(async (user: any) => {
        return args.moduleID ? 
          await SubmissionRepo.getLatestSubmissionByModule(user.id, Number(args.moduleID)) :
          await SubmissionRepo.getLatestSubmission(user.id)
    }),

    /**
     * Fetch failed submissions made by a user for a module
     * @argument moduleId ID of the TrainingModule 
     * @returns number of attempts made and limit allowed
     * @throws GraphQLError if not authenticated or is on hold
     */
    remainingSubmissions: async (
      _parent: any,
      args: { moduleID: string },
      { ifAuthenticated }: ApolloContext
    ) => 
      ifAuthenticated (async (user: any) => {
        var failedSubmissions = (await SubmissionRepo.getFailedSubmissionsTodayByModuleAndUser(Number(args.moduleID), user.id)).length
        return {"failedSubmissions" : failedSubmissions, "submissionLimit" : Number(process.env.TRAINING_MAX_ATTEMPTS_PER_DAY_BEFORE_LOCK)};
    }),

        /**
     * Fetch most recent passing submissions within a year made by a user for a module
     * @argument moduleId ID of the TrainingModule 
     * @returns ModuleSubmission
     * @throws GraphQLError if not authenticated or is on hold
     */
    passingSubmission: async (
      _parent: any,
      args: { moduleID: string },
      { ifAuthenticated }: ApolloContext
    ) => 
      ifAuthenticated (async (user: any) => {
        return await SubmissionRepo.getPassingSubmission(Number(args.moduleID), user.id)
    }),

  }
};

export default TrainingSubmissionResolvers;
