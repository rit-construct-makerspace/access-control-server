import { ApolloContext } from "../context.js";
import { CurrencyAccountsRow } from "../knex/tables.js";
import { send_cc_balance_change_email } from "../integrations/email/email.js";
import * as CurrencyAccountRepo from "../repositories/Currency/CurrencyAccountsRepository.js"

export const CurrencyAccountResolvers = {
  CurrencyAccount: {
    owner: async (
      parent: CurrencyAccountsRow,
      _args: any,
      _context: ApolloContext
    ) => {
      return await CurrencyAccountRepo.getAccountOwner(parent.id);
    }
  },

  Query: {
    currencyAccount: async (
      _parent: any,
      args: {
        accountID: number,
      },
      { isStaff }: ApolloContext
    ) => {
      return isStaff(async () => (await CurrencyAccountRepo.getAccountByID(args.accountID)));
    },

    currencyAccountsLimit: async (
      _parent: any,
      args: {
        searchText: string
      },
      { isManager }: ApolloContext
    ) => {
      return isManager(async () => (await CurrencyAccountRepo.getAccountsLimit(args.searchText)));
    }
  },

  Mutation: {
    adjustAccountBalanceCents: async (
      _parent: any,
      args: {
        accountID: number,
        amount: number,
        description: string,
      },
      { isManager }: ApolloContext
    ) => {
      const owner = await CurrencyAccountRepo.getAccountOwner(args.accountID);
      send_cc_balance_change_email(owner?.username + "@rit.edu", {
        amount: Math.abs(args.amount),
        type: args.amount > 0 ? "credit" : "charge",
        desc: args.description,
      });
      return isManager(async (user) => (
        await CurrencyAccountRepo.adjustAccountBalanceCents(args.accountID, args.amount, "make-website", `adjustment by ${user.ritUsername}: ${args.description}`)
      ))
    },
  },
}