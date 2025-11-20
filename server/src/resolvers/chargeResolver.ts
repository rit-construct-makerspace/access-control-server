// NOTE. THIS DIFFERS FROM CURRENCY ACCOUNT RESOLVER IN THAT THIS AFFECTS BOTH CC AND TB. YOU MIGHT BE LOOKING FOR currenctAccountResolver.ts

import { ApolloContext, CurrentUser } from "../context.js";
import { getBalance, getRitEmailByUID } from "../integrations/atrium-integration/atrium.js";
import { CurrencySource } from "../integrations/currency/types.js";
import { getAccountBalanceCents, getAccountIDByUsername } from "../repositories/Currency/CurrencyAccountsRepository.js";
import { getUserByID, getUserByRitUsername, getUserByUsernameOrUID, getUsersFullName } from "../repositories/Users/UserRepository.js";

export const ChargeResolver = {
    Query: {
        userDataFromUniversityIDCardTap: async (
            _parent: any,
            args: {
                uid: string,
            },
            { isStaff }: ApolloContext
        ) => {
            return isStaff(async (current_user: CurrentUser) => {
                try {
                    console.warn(`${current_user ? getUsersFullName(current_user) : "Unknown staff"} started transaction for user via card tap`)
                    
                    const email = await getRitEmailByUID(CurrencySource.Store, args.uid);
                    if (email == undefined) {
                        return undefined;
                    }
                    const username = email.replace('@rit.edu', '');
                    const user = await getUserByRitUsername(username);
                    if (!user) {
                        return undefined;
                    }
                    const accountId = await getAccountIDByUsername(user.ritUsername)
                    if (!accountId) {
                        return undefined;
                    }
                    const credits = await getAccountBalanceCents(accountId)

                    const tigerbucks = await getBalance(user.ritUsername);
                    if (typeof tigerbucks != 'number') {
                        return undefined;
                    }
                    return { user: user, tigerBucksCents: tigerbucks, creditsCents: credits };
                } catch {
                    return undefined;
                }
            });
        },
    },
    Mutation: {
        chargeUser: async (_parent: any, args: { uid: string, description: string, amountCents: number }, { isStaff }: ApolloContext) => {
            return isStaff(async () => {
                return undefined;
            });
        }
    }
}
