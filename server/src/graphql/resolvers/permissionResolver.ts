/**
 * permissionResolver.ts
 * GraphQL endpoint implmenentations for Permissions
 */

import { ApolloContext, CurrentUser } from "../../context.js";

const PermissionResolver = {
  Query: {
    /**
     * Return true if user is MENTOR or higher permission role
     * @returns true if user is MENTOR or higher permission role
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    isMentorOrHigher: async (
      _parent: any,
      _args: any,
      { isStaff }: ApolloContext) =>
      isStaff(async (_user: CurrentUser) => {
        return true;
      }),
  },
};

export default PermissionResolver;