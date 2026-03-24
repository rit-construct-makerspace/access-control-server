/** AuditLogRepository.ts
 * DB operations endpoint for AuditLog table
 */

import { knex } from "../../db/index.js";
import { AuditLogRow } from "../../db/tables.js";
import { AuditLogEntity } from "../../models/logs/AuditLogs.js";


//Options to filter by log type
export interface Filters {
  errors: string; //"no-errors" | "both" | "only-errors" (Do not enforce this)
  welcome: boolean;
  auth: boolean;
  status: boolean;
  state: boolean;
  help: boolean;
  message: boolean;
  server: boolean;
  training: boolean;
  admin: boolean;
  uncategorized: boolean;
}

/**
 * Create an AuditLog and append it to the table
 * @deprecated createAuditLog should be used to associate with a makerspace
 * @param message String verb description of the Log entry (i.e. reserved, deleted)
 * @param entities items involved in log {id, label}
 */
export async function createUnassocaitedAuditLog(
  message: string,
  category: string | undefined,
  ...entities: AuditLogEntity[]
) {
  let formattedMessage = message;

  // "{user} reserved {equipment}" -> "<user:3:Matt> reserved <equipment:12:Table Saw>"
  entities.forEach(({ id, label }) => {
    const entityType = formattedMessage.match(/{(\w+)}/)?.[1];
    formattedMessage = formattedMessage.replace(
      /{\w+}/,
      `<${entityType}:${id}:${label}>`
    );
  });

  await knex("AuditLogs").insert({ message: formattedMessage, category });
}

export async function createAuditLog(message: string, category?: string, makerspaceID?: number, ...entities: AuditLogEntity[]) {
  let formattedMessage = message;
  // "{user} reserved {equipment}" -> "<user:3:Matt> reserved <equipment:12:Table Saw>"
  entities.forEach(({ id, label }) => {
    const entityType = formattedMessage.match(/{(\w+)}/)?.[1];
    formattedMessage = formattedMessage.replace(
      /{\w+}/,
      `<${entityType}:${id}:${label}>`
    );
  });

  await knex("AuditLogs").insert({ message: formattedMessage, category: category, makerspaceID: makerspaceID });
}

/**
 * Create an AuditLog and append it to the table
 * @param message String verb description of the Log entry (i.e. reserved, deleted)
 * @param array of entities items involved in log {id, label}
 */
export async function createLogWithArray(
  message: string,
  category: string | undefined,
  entities: { id: any; label: string }[]
) {
  let formattedMessage = message;

  // "{user} reserved {equipment}" -> "<user:3:Matt> reserved <equipment:12:Table Saw>"
  entities.forEach(({ id, label }) => {
    const entityType = formattedMessage.match(/{(\w+)}/)?.[1];
    formattedMessage = formattedMessage.replace(
      /{\w+}/,
      `<${entityType}:${id}:${label}>`
    );
  });

  await knex("AuditLogs").insert({ message: formattedMessage, category });
}

/**
 * Fetch logs by filtered criteria
 * @param startDate earliest date to filter by
 * @param stopDate latest date to filter by
 * @param searchText text to filter by
 * @returns matching AuditLogs
 */
export async function getLogs(
  startDate: string,
  stopDate: string,
  searchText: string,
  filters?: Filters
): Promise<AuditLogRow[]> {
  //Add every active filter to SQL-valid array syntax
  const filterString = ((filters?.welcome ? "'welcome', " : "")
    + (filters?.auth ? "'auth', " : "")
    + (filters?.help ? "'help', " : "")
    + (filters?.state ? "'state', " : "")
    + (filters?.status ? "'status', " : "")
    + (filters?.help ? "'help', " : "")
    + (filters?.message ? "'message', " : "")
    + (filters?.training ? "'training', " : "")
    + (filters?.admin ? "'admin', " : "")
    + (filters?.server ? "'server', " : "")
  );

  //Create WHERE rule content to only grab entries matcching one of the applied filters
  const filterSQL = `"category" = ANY (ARRAY[${filterString.substring(0, filterString.length - 2)}])` + (filters?.uncategorized ? ` OR "category" IS NULL` : "");

  const knexResult = (filterString && filterString != "")
    //If filters exist, use filterSQL
    ? await knex("AuditLogs")
      .select()
      .whereRaw(`("dateTime" at time zone 'UTC') BETWEEN TIMESTAMP '${new Date(startDate).toISOString().replace("T", " ").replace("Z", "")}' AND TIMESTAMP '${new Date(stopDate).toISOString().replace("T", " ").replace("Z", "")}'`)
      .whereRaw(filterSQL)
      .where("message", "ilike", `%${searchText}%`)
      .whereRaw((filters?.errors != "both" ? `message ${filters?.errors == "no-errors" ? "NOT " : ""} ilike '%<error:%'` : "TRUE"))
      .orderBy("dateTime", "DESC")
      .limit(100)
    //else, don't use filterSQL
    : await knex("AuditLogs")
      .select()
      .whereRaw(`("dateTime" at time zone 'UTC') BETWEEN TIMESTAMP '${new Date(startDate).toISOString().replace("T", " ").replace("Z", "")}' AND TIMESTAMP '${new Date(stopDate).toISOString().replace("T", " ").replace("Z", "")}'`)
      .where("message", "ilike", `%${searchText}%`)
      .whereRaw((filters?.errors != "both" ? `message ${filters?.errors == "no-errors" ? "NOT " : ""} ilike '%<error:%'` : "TRUE"))
      .orderBy("dateTime", "DESC")
      .limit(100)

  //Map rows
  return knexResult;
}
