/**
 * auditLogsResolver.ts
 * GraphQL Endpoint Implementations for Audit Logs
 */

import * as AuditLogRepo from "../repositories/AuditLogs/AuditLogRepository.js";
import { ApolloContext } from "../context.js";

const AuditLogResolvers = {
  Query: {
    /**
     * Fetch Audit Logs by search parameters
     * @argument startDate Earliest date to filter by (ex: 2024-01-23)
     * @argument stopDate Earliest date to filter by (ex: 2024-01-23)
     * @argument searchText inclusive search string for log content
     * @argument filters optional advanced filtering options
     * @returns matching Audit Logs
     */
    auditLogs: async (
      parent: any,
      args: { startDate: string; stopDate: string; searchText: string, filters?: AuditLogRepo.Filters },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async () => {
        const startDate = args.startDate ?? "2020-01-01";
        const stopDate = args.stopDate ?? "2200-01-01";
        const searchText = args.searchText ?? "";

        return await AuditLogRepo.getLogs(startDate, stopDate, searchText, args.filters);
      }),
  },
};

export default AuditLogResolvers;
