# Apply to HackCampus

This is the web app that powers all the applications to HackCampus.

## Dependencies

- Node 8.x.x
- PostgreSQL 9.6 (will probably work with older versions - we're only doing basic stuff)

## 1. Get the JS dependencies

```
npm install
```

## 2. Set up a local dev database

This is only tested on 9.6, but it should also work on older versions, we're not doing anything fancy.

Postgres stores all its data in a single directory, I would recommend putting it somewhere outside of the repo so that you don't accidentally commit it. In the following commands, this directory is called `db/`, but you can call it anything you want.

```
initdb -D db/
postgres -D db/ # leave this running in a terminal while you run the other commands
createuser hackcampus --createdb --login --host=localhost --port=5432
createdb hackcampus --owner=hackcampus
createdb test --owner=hackcampus # unit tests will clear this once finished
```

Then, in the project directory, run:

```
npm run migrate-latest
```

## 3. Run unit tests

Tests will fail if you did not set up the 2 databases or forget to run the migrations.
A lot tests will fail the first time you run the test suite.
That's normal - just run the test suite again.

```
npm test
```

## 4. Run the backend

```
npm run develop-server
```

## 5. Run the frontend

```
npm run develop-client
```

## 6. Import db dump (if you have one)

```
pg_restore --verbose --clean --no-acl --no-owner -h localhost -U hackcampus -d hackcampus NAME_OF_THE_DUMP_FILE.dump
```
