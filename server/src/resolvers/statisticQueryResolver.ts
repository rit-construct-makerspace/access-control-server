/**
 * statisticQueryResolver
 * GraphQL ENdpoint Implementations for various statistical operations
 */

import { ApolloContext } from "../context.js";
import { getNumUsersRegisteredToday, getNumRoomSwipesToday, getNumEquipmentSessionsToday } from "../repositories/StatisticsQuery/StatisticQueryRepository.js";
import { getEquipmentSessionsWithAttachedEntities } from "../repositories/StatisticsQuery/EquipmentStatsRepository.js";
import { getRoomSwipesWithAttachedEntities } from "../repositories/StatisticsQuery/RoomStatsRepository.js";
import { getTrainingSubmissionsWithAttachedEntities } from "../repositories/StatisticsQuery/TrainingStatsRepository.js";

//Get start of month and end of today as Dates
function getMonthToPresentBounds(): { startOfMonth: Date, today: Date } {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return { startOfMonth, today };
}

//Get the SUnday of the current week as a Date
function getSunday() {
  var d = new Date();
  var day = d.getDay(),
    diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

const StatisticQueryResolver = {
  Query: {
    /**
     * Fetch an array of Equipment Sessions with extra attributes for user, equipment, and room information
     * @argument startDate the earliest date to filter by
     * @argument endDate the latest date to filter by 
     * @argument equipmentIDs the IDS of equipment to filter by 
     * @returns array of equipment sessions with user, equipment, and room info
     */
    getEquipmentSessionsWithAttachedEntities: async (
      _parent: any,
      args: {startDate: string, endDate: string, equipmentIDs: string[]},
      { isManager }: ApolloContext) =>
      isManager(async () => {
        return (await getEquipmentSessionsWithAttachedEntities(args.startDate, args.endDate, args.equipmentIDs)).rows;
      }),

    /**
     * Fetch an array of Room Swipes with extra attributes for user and room information
     * @argument startDate the earliest date to filter by
     * @argument endDate the latest date to filter by 
     * @returns array of room swipes with user and room info
     */
    getRoomSwipesWithAttachedEntities: async (
      _parent: any,
      args: {startDate: string, endDate: string, roomIDs: string[]},
      { isManager }: ApolloContext) =>
      isManager(async () => {
        return (await getRoomSwipesWithAttachedEntities(args.startDate, args.endDate, args.roomIDs)).rows;
      }),

    /**
     * Fetch an array of Training Submissions with extra attributes for user and module information
     * @argument startDate the earliest date to filter by
     * @argument endDate the latest date to filter by 
     * @argument moduleIDs the IDS of training modules to filter by 
     * @returns array of equipment sessions with user, equipment, and room info
     */
    getTrainingSubmissionsWithAttachedEntities: async (
      _parent: any,
      args: {startDate: string, endDate: string, moduleIDs: string[]},
      { isManager }: ApolloContext) =>
      isManager(async () => {
        return (await getTrainingSubmissionsWithAttachedEntities(args.startDate, args.endDate, args.moduleIDs)).rows;
      }),

    /**
     * Fetch number of users who have registered today
     * @returns number of users
     */
    numNewUsersToday: async (
      _parent: any,
      _args: any,
      { isManager }: ApolloContext) =>
      isManager(async () => {
        return await getNumUsersRegisteredToday();
      }),

    /**
     * Fetch number of room swipes for all rooms today
     * @returns number of room swipes
     */
    numRoomSwipesToday: async (
      _parent: any,
      _args: any,
      { isManager }: ApolloContext) =>
      isManager(async () => {
        return await getNumRoomSwipesToday();
      }),

    /**
     * Fetch number of equipment sessions for all equipment today
     * @returns number of sessions
     */
    numEquipmentSessionsToday: async (
      _parent: any,
      _args: any,
      { isManager }: ApolloContext) =>
      isManager(async () => {
        return await getNumEquipmentSessionsToday();
      }),
  },
};

export default StatisticQueryResolver;