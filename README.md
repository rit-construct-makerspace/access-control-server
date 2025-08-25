# Developing Locally

## Prerequisites
NodeJS latest - [install](https://nodejs.org/en/download/package-manager)

postgres - [install](https://www.postgresql.org/download/)

typescript - use "npm install typescript"

knex - use "npm install knex"

ejs - use "npm install ejs"

### Optional
Docker Desktop - [install](https://docs.docker.com/get-docker/)

## Environment
For an example of required server environment variables, see [server/.env.example](server/.env.example)

For an example of required client environment variables, see [client/.env.example](client/.env.example)

## Database (WIP)
This project uses a postgres database. You must use the environment variable `DATABASE_URL` in the server to point the app to your postgres instance. `DATABASE_URL` should be a database URI. See the "Connection URIs" section of [the postgres docs](https://www.postgresql.org/docs/current/libpq-connect.html) for details.

The project also contains a docker-compose definition for a postgres instance exposed on port `5433`. To use this definition you must set the following environment variables in the project root:
```
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
```
The docker definition will automatically configure the database to use these values.

To build and start the postgres container from the project root, run the following commands:

```
docker-compose build db
docker-compose up -d db
```

Once you have a dedicated postgres instance, and you have configured your environment, run the following commands from the project root in order to migrate the database:
```
npm run build:server
npm run knex:migrate:latest
```

## Client
The client/frontend consists of a React app. To start the app in with hot reloads from the project root, run the following commands:

```
cd client
npm run start:dev
```

To test the app, start the server and then go to `http://localhost:3001/app`. The development environment has a mock-up authentication with test users, whose credentials can be found in [server/src/data/devUsers.json](server/src/data/devUsers.json).

## Server
The server/backend consists of an Express server with a GraphQL API.

To run the server in development mode with hot reloads run the following commands from the project root:

```
npm run start:dev
```

## Debugging
The `start:debug` script in the root project can be used to start the server in debug mode. This will expose a debug listener on port `9229`. Follow [this tutorial](https://nodejs.org/en/docs/guides/debugging-getting-started) for debugging using this process. We have found that Chrome dev tools are the most effective for this purpose.
