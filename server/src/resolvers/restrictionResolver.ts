import { ApolloContext, CurrentUser } from "../context.js";
import { RestrictionRow } from "../db/tables.js";
import * as UsersRepo from "../repositories/Users/UserRepository.js";
import * as RestrictionRepository from "../repositories/Restrictions/RestrictionsRepository.js";
import * as MakerspaceRepo from "../repositories/Zones/ZonesRespository.js";

export const RestrictionResolver = {
    Restriction: {
        creator: async (
            parent: RestrictionRow,
            _args: any,
            { isStaff }: ApolloContext
        ) => isStaff(async (user: CurrentUser) => {
            return parent.creatorID ? UsersRepo.getUserByID(parent.creatorID) : null
        }),

        makerspace: async (
            parent: RestrictionRow,
            _args: any,
            { isStaff }: ApolloContext
        ) => isStaff (async (user: CurrentUser) => {
            return parent.makerspaceID ? MakerspaceRepo.getZoneByID(parent.makerspaceID) : null
        }),
    },

    Mutation: {
        createRestriction: async (
            _parent: any,
            args: { targetID: number, makerspaceID: number, reason: string},
            { isStaffFor }: ApolloContext
        ) => isStaffFor(args.makerspaceID, async (user: CurrentUser) => {
            return await RestrictionRepository.createRestriction(user.id, args.targetID, args.makerspaceID, args.reason);
        }),

        deleteRestriction: async (
            _parent: any,
            args: {id: number},
            { isStaffFor }: ApolloContext
        ) => {
            const restriction = await RestrictionRepository.getRestriction(args.id);
            return isStaffFor(restriction.makerspaceID, async (user: CurrentUser) => {
                return await RestrictionRepository.deleteRestriction(args.id);
            })
        }
    },
}