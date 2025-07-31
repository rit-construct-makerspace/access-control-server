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
    },
}