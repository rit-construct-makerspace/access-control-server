import { ApolloContext } from "../context.js";
import { CurrencyAccountsRow } from "../db/tables.js";
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
      },
      { isManager }: ApolloContext
    ) => {
      return isManager(async (user) => (
        await CurrencyAccountRepo.adjustAccountBalanceCents(args.accountID, args.amount, "make-website", `${user.ritUsername} adjusted balance for account ${args.accountID}`)
      ))
    },
  },
}