/**
 * termsResolver.ts
 * GraphQL Endpoint Implementations for the Terms value of the TextFields table
 */

import { ApolloContext } from "../context.js";
import { getTerms, setTerms } from "../database/repositories/TextItems/TermsRepository.js";

const TermsResolver = {
  Query: {
    getTerms: async (
      _parent: any,
      _args: any) =>
      (await getTerms())?.value
  },

  Mutation: {
    setTerms: async (
      _parent: any,
      args: { value: string },
      { isManager }: ApolloContext) =>
      isManager(async () => {
        return (await setTerms(args.value));
      }),
  }
};

export default TermsResolver;