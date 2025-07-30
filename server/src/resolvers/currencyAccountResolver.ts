import { ApolloContext } from "../context.js";
import * as CurrencyAccountRepo from "../repositories/Currency/CurrencyAccountsRepository.js"

export const CurrencyAccountResolvers = {
    CurrencyAccount: {

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
    },

    Mutation: {
        adjustAccountBalanceCents: async (
            _parent: any,
            args: {
                accountID: number,
                amount: number,
                description: string
            },
            { isManager }: ApolloContext
        ) => {
            return isManager(async () => (await CurrencyAccountRepo.adjustAccountBalanceCents(args.accountID, args.amount, "Make", args.description)));
        },

        adjustAccountBalanceIfAvailableCents: async (
            _parent: any,
            args: {
                accountID: number,
                amount: number,
                description: string
            },
            { isManager }: ApolloContext
        ) => {
            return isManager(async () => (CurrencyAccountRepo.adjustAccountBalanceIfAvailableCents(args.accountID, args.amount, "Make", args.description)));
        },
    }
}