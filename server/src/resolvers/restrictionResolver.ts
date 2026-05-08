import { ApolloContext, CurrentUser } from "../context.js";
import { RestrictionRow } from "../knex/tables.js";
import * as UsersRepo from "../repositories/Users/UserRepository.js";
import * as RestrictionRepository from "../repositories/Restrictions/RestrictionsRepository.js";
import * as MakerspaceRepo from "../repositories/Makerspaces/MakerspaceRespository.js";

export const RestrictionResolver = {
    Restriction: {
        creator: async (
            parent: RestrictionRow,
            _args: any,
            { isStaff }: ApolloContext
        ) => isStaff(async (_user: CurrentUser) => {
            return parent.creatorID ? UsersRepo.getUserByID(parent.creatorID) : null
        }),

        makerspace: async (
            parent: RestrictionRow,
            _args: any,
            { isStaff }: ApolloContext
        ) => isStaff(async (_user: CurrentUser) => {
            return parent.makerspaceID ? MakerspaceRepo.getMakerspaceByID(parent.makerspaceID) : null
        }),
    },

    Mutation: {
        createRestriction: async (
            _parent: any,
            args: { targetID: number, makerspaceID: number, reason: string },
            { isStaffFor }: ApolloContext
        ) => isStaffFor(args.makerspaceID, async (user: CurrentUser) => {
            return await RestrictionRepository.createRestriction(user.id, args.targetID, args.makerspaceID, args.reason);
        }),

        deleteRestriction: async (
            _parent: any,
            args: { id: number },
            { isStaffFor }: ApolloContext
        ) => {
            const restriction = await RestrictionRepository.getRestriction(args.id);
            return isStaffFor(restriction.makerspaceID, async (_user: CurrentUser) => {
                return await RestrictionRepository.deleteRestriction(args.id);
            })
        }
    },
}