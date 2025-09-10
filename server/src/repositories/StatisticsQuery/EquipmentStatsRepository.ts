/**
 * EquipmentStatsRepository.ts
 * DB Operations for equipment-related statistical queries
 */

import moment from "moment";
import { knex } from "../../db/index.js";
moment().format(); 


export interface VerboseEquipmentSession {
  id: number;
  start: Date;
  equipmentID: number;
  userID: number;
  userName: string; //First Initial + '. ' + Last Name
  sessionLength: number;
  readerSlug: string;
  equipmentName: string;
  roomID: number;
  roomName: string;
  makerspaceID: number;
  makerspaceName: string;
}

export async function getEquipmentSessionsWithAttachedEntities(startDate?: string, endDate?: string, equipmentIDs?: string[]): Promise<{rows: VerboseEquipmentSession[]}> {
  var numWhereCaluses = 0;
  var startDateSearchString = "";
  if (startDate) {
    numWhereCaluses++;
    //To prevent SQL Injection, Make sure JS sees it as a Date
    if (!isNaN(new Date(startDate).getDate())) startDateSearchString = `es."start" >= '${startDate}'`;
  }

  var endDateSearchString = "";
  if (endDate) {
    numWhereCaluses++;
    //To prevent SQL Injection, Make sure JS sees it as a Date
    if (!isNaN(new Date(endDate).getDate())) endDateSearchString = `es."start" < '${endDate}'`;
  }

  var equipmentSearchString = "";
  if (equipmentIDs && equipmentIDs.length > 0) {
    numWhereCaluses++;
    equipmentSearchString = `e.id = ANY(ARRAY [${equipmentIDs}])`;
  }

  return await knex.raw(`
    SELECT es.*, concat(substr(u."firstName", 0, 2), '. ', u."lastName") AS "userName", e."name" AS "equipmentName", r.id AS "roomID", r."name" AS "roomName", z.id AS "makerspaceID", z."name" AS "makerspaceName"
    FROM "EquipmentSessions" es 
    INNER JOIN "Users" u ON es."userID" = u.id
    INNER JOIN "Equipment" e ON es."equipmentID" = e.id
    INNER JOIN "Rooms" r ON e."roomID" = r.id
    INNER JOIN "Makerspaces" z ON r."makerspaceID" = z.id
    WHERE es."sessionLength" != 0
    ${numWhereCaluses > 0 ? "AND " : ""}
    ${startDateSearchString}
    ${startDateSearchString != "" && endDateSearchString.length > 0 ? " AND " : ""}
    ${endDateSearchString}
    ${numWhereCaluses > 1 && equipmentSearchString.length > 0 ? " AND " : ""}
    ${equipmentSearchString}
    ORDER BY es."start" DESC
`);
}