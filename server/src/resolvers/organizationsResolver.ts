import { ApolloContext } from "../context.js";
import { OrganizationsRow } from "../db/tables.js";
import { createLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import * as OrgRepo from "../repositories/Users/OrganizationRepository.js";
import * as CurrencyAccountRepo from "../repositories/Currency/CurrencyAccountsRepository.js"
import { getUsersFullName } from "../repositories/Users/UserRepository.js";

export const OrganizationResolver = {

  Organization: {
    account: async (
      parent: OrganizationsRow,
      _agrs: any
    ) => {
      return await CurrencyAccountRepo.getAccountByID(parent.accountID);
    }
  },

  Query: {
    searchOrganizationsLimit: async (
      _parent: any,
      args: {
        searchText: string
      },
      { isStaff }: ApolloContext
    ) => {
      return isStaff(async () => {
        return await OrgRepo.searchOrganizationsLimit(args.searchText);
      })
    }
  },

  Mutation: {
    createOrganization: async (
      _parent: any,
      args: {
        username: string,
        displayname: string
      },
      { isManager }: ApolloContext
    ) => {
      return await isManager(async (user) => {
        const result = await OrgRepo.createOrganization(args.username, args.displayname);

        createLog("{user} created the {organization} organization", "admin",
          { id: user.id, label: getUsersFullName(user) },
          { id: result, label: args.displayname }
        );

        return result;
      })
    },

    deleteOrganization: async (
      _parent: any,
      args: {
        orgID: number
      },
      { isManager }: ApolloContext
    ) => {
      return isManager(async (user) => {
        const org = await OrgRepo.getOrganizationByOrgID(args.orgID);
        const result = await OrgRepo.deleteOrganization(args.orgID);

        if (!result) {
          return false;
        }

        createLog(`{user} deleted the ${org?.displayname} organization`, "admin",
          { id: user.id, label: getUsersFullName(user) }
        )

        return result;
      })
    }
  }
};