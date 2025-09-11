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
     * Fetch all failed ModuleSubmissions for the specified module
     * @argument moduleId ID of the TrainingModule 
     * @returns array of ModuleSubmission
     * @throws GraphQLError if not authenticated or is on hold
     */
    failedSubmissions: async (
      _parent: any,
      args: { moduleID: string },
      { ifAuthenticated }: ApolloContext
    ) => 
      ifAuthenticated (async (user: any) => {
        return SubmissionRepo.getFailedSubmissionsTodayByModuleAndUser(Number(args.moduleID), user.id);
    }),

  }
};

export default TrainingSubmissionResolvers;
