import knex from "knex";
import { createRequire } from "module";
import config from "./knexFile.js";
const _require = createRequire(import.meta.url);

const connection =
  config[process.env.NODE_ENV || "development"];


const knexInstance = knex(connection);

export { knexInstance as knex };
