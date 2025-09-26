/**
 * knexFile.ts
 * 
 * Config for the connection and querying of the database.
 * 
 * NOTE: Due to a unresolved bug with npm, performing knex actions such as "knex migrate:make"
 *   may require the '--esm' modifier and the removal of TypeScript and Node language in this file.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url); //Remove this line if running using --esm
const __dirname = import.meta.dirname;

require("dotenv").config({ path: __dirname + "/./../../.env" });

// Update with your config settings.
const config: any = { //remove ': any' if using --esm
  development: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: false,

    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "migrations",
    },
    asyncStackTraces: true,
  },

  staging: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
        sslmode: 'require',
      },
    },
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "migrations",
    },
    asyncStackTraces: true,
  },

  production: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
        sslmode: 'require',
      },
    },
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "migrations",
    },
  },

  test: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "dist/db/migrations",
    },
    seeds: {
      directory: "seeds",
    },
  },
};

export default config;