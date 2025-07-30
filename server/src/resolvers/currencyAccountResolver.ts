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
}