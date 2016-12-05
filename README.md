# Apply to HackCampus

This is the web app that powers all the applications to HackCampus.

## Dependencies

- Node 6.x.x (the node version should be quite recent as we're using a couple of ES6 features)
- PostgreSQL 9.5 (will probably work with older versions - we're only doing basic stuff)

## 1. Get the JS dependencies

```
npm install
```

## 2. Set up a local dev database

This is only tested on 9.5, but it should also work on older versions, we're not doing anything fancy.

Postgres stores all its data in a single directory, I would recommend putting it somewhere outside of the repo so that you don't accidentally commit it. In the following commands, this directory is called `db/`, but you can call it anything you want.

```
initdb -D db/
postgres -D db/ # leave this running in a terminal while you run the other commands
createuser hackcampus --createdb --login --host=localhost --port=5432
createdb hackcampus --owner=hackcampus
```

Then, in the project directory, run:

```
npm run migrate-latest
```

## 3. Run the backend

```
npm run develop-server
```

## 4. Run the frontend

```
npm run develop-client
```
