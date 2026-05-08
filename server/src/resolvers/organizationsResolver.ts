import { ApolloContext } from "../context.js";
import { OrganizationsRow } from "../knex/tables.js";
import { createUnassocaitedAuditLog } from "../repositories/AuditLogs/AuditLogRepository.js";
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
    },
    getOrganizationByID: async (
      _parent: any,
      args: {
        id: number
      },
      { isStaff }: ApolloContext
    ) => {
      return isStaff(async () => {
        return await OrgRepo.getOrganizationByOrgID(args.id);
      })
    },
  },

  Mutation: {
    createOrganization: async (
      _parent: any,
      args: {
        username: string,
        displayname: string,
        notes: string
      },
      { isManager }: ApolloContext
    ) => {
      return await isManager(async (user) => {
        const result = await OrgRepo.createOrganization(args.username, args.notes, args.displayname);

        createUnassocaitedAuditLog("{user} created the {organization} organization", "admin",
          { id: user.id, label: getUsersFullName(user) },
          { id: result.id, label: args.displayname }
        );

        return result;
      })
    },

    editOrganizationNotes: async (
      _parent: any,
      args: {
        orgID: number,
        notes: string
      },
      { isManager }: ApolloContext
    ) => {
      return isManager(async (_user) => {
        const result = await OrgRepo.editOrganizationNotes(args.orgID, args.notes);

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

        createUnassocaitedAuditLog(`{user} deleted the ${org?.displayname} organization`, "admin",
          { id: user.id, label: getUsersFullName(user) }
        )

        return result;
      })
    }
  }
};