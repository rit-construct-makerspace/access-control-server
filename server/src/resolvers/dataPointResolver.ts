/**
 * dataPointsResolver.ts
 * GraphQL Endpoint Implementations for Data Points (misc integer data)
 */

import { ApolloContext } from "../context.js";
import { getDataPointByID, incrementDataPointValue, setDataPointValue } from "../repositories/DataPoints/DataPointsRepository.js";

const DataPointsResolver = {
  Query: {
    /**
     * Fetch a Data Point by ID
     * @argument id ID of dataPoint
     * @returns data point
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    dataPoint: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return await getDataPointByID(args.id);
      }),

    /**
     * Fetch Data Point "Daily Site Visits"
     * @returns data point
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    dailySiteVisits: async (
      _parent: any,
      _args: any,
      { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return await getDataPointByID(1);
      }),

    /**
     * Increment Data Point "Daily Site Visits" by +1
     * @returns 1
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    incrementSiteVisits: async (
      _parent: any,
      _args: any,
    ) => {
      return (await incrementDataPointValue(1, 1));
    }
  },

  Mutation: {
    /**
     * Set new value for Data Point
     * @argument id ID of data point to modify
     * @argument value new value
     * @returns updated data point
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    setDataPointValue: async (
      _parent: any,
      args: { id: number, value: number },
      { isManager }: ApolloContext) =>
      isManager(async () => {
        return (await setDataPointValue(args.id, args.value));
      }),
  }
};

export default DataPointsResolver;