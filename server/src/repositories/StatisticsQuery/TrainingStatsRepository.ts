/**
 * TrainingStatsRepository.ts
 * DB Operations for room-related statistical queries
 */

import { knex } from "../../db/index.js";

export interface VerboseTrainingSubmission {
  id: number;
  moduleID: number;
  makerID: number;
  summary: string;
  submissionDate: Date;
  passed: boolean;
  expirationDate: Date;
  moduleName: string;
  makerName: string;
}

export async function getTrainingSubmissionsWithAttachedEntities(startDate?: string, endDate?: string, moduleIDs?: string[]): Promise<{rows: VerboseTrainingSubmission[]}> {
  var numWhereCaluses = 0;
  var startDateSearchString = "";
  if (startDate) {
    numWhereCaluses++;
    //To prevent SQL Injection, Make sure JS sees it as a Date
    if (!isNaN(new Date(startDate).getDate())) startDateSearchString = `ms."submissionDate" >= '${startDate}'`;
  }

  var endDateSearchString = "";
  if (endDate) {
    numWhereCaluses++;
    //To prevent SQL Injection, Make sure JS sees it as a Date
    if (!isNaN(new Date(endDate).getDate())) endDateSearchString = `ms."submissionDate" < '${endDate}'`;
  }

  var moduleSearchString = "";
  if (moduleIDs && moduleIDs.length > 0) {
    numWhereCaluses++;
    moduleSearchString = `tm.id = ANY(ARRAY [${moduleIDs}])`;
  }


  return await knex.raw(`
    SELECT ms.*, tm."name" AS "moduleName", tm.quiz, concat(substr(u."firstName", 0, 2), '. ', u."lastName") AS "makerName"
    FROM "ModuleSubmissions" ms 
    INNER JOIN "TrainingModule" tm ON ms."moduleID" = tm.id
    INNER JOIN "Users" u ON ms."makerID" = u.id
    ${numWhereCaluses > 0 ? " WHERE " : ""}
    ${startDateSearchString}
    ${startDateSearchString != "" && endDateSearchString.length > 0 ? " AND " : ""}
    ${endDateSearchString}
    ${numWhereCaluses > 1 && moduleSearchString.length > 0 ? " AND " : ""}
    ${moduleSearchString}
    ORDER BY ms."submissionDate" DESC 
  `);
}