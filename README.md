# Developing Locally


## Prerequisites
NodeJS latest - [install](https://nodejs.org/en/download/package-manager)

docker - [install](https://www.docker.com/)

dependencies - run `npm install` in the root of the repository 

## Environment
For an example of required server environment variables, see [server/.env.example](server/.env.example)

For an example of required client environment variables, see [client/.env.example](client/.env.example)

## Database
This project uses a postgres database. The easiest way to get this up and running is through docker. 

You must use the environment variable `DATABASE_URL` in the server to point the app to your postgres instance. `DATABASE_URL` should be a database URI. See the "Connection URIs" section of [the postgres docs](https://www.postgresql.org/docs/current/libpq-connect.html) for details.

### Creating the Database Container
This can also be done through docker desktop, instructions for that may come later. 

To create a container for your database, run the following command (creating your own password for it)

```sh
docker run -p 5432:5432 --name devdb -e POSTGRES_PASSWORD=YOUR_OWN_DB_PASSWORD -d postgres:15
```
If you restart your computer, you may have to run `docker start devdb` to restart the server container.

### Creating/Restoring Data

The easiest way to get up and running is to restore a backup of a real server that. Postgres supports dumping and restoring databases to files

To restore from a backup, execute
```sh
pg_restore --no-owner -d postgresql://postgres:YOUR_OWN_PASSWORD@localhost:5432/postgres FOLDER_OF_FILES_THAT_YOU_WERE_SENT -v 
```

## Server
The server/backend consists of an Express server with a GraphQL API.

To run the server in development mode with hot reloads run the following commands from the project root:
*IF THE SERVER IS SETUP TO RUN WITH HOT RELOADING, THIS WILL BE UNHELPFUL UNLESS THE CLIENT DEV SERVER IS RUNNING (see below)*

```sh
npm run start:dev
```

For more in depth (but not necessary for getting started) info, see server/README.md

## Client
The client/frontend consists of a React app. To start the app in with hot reloads from the project root, run the following command from the root of the repository:

*THE SERVER MUST BE RUNNING AS WELL OR THIS WILL BE MOSTLY USELESS*

```
cd client
npm run start:client
```

To test the app, start the server and then go to `http://localhost:3001/app`. 


## Debugging
The `start:debug` script in the root project can be used to start the server in debug mode. This will expose a debug listener on port `9229`. Follow [this tutorial](https://nodejs.org/en/docs/guides/debugging-getting-started) for debugging using this process. We have found that Chrome dev tools are the most effective for this purpose.
