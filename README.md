# Pulse Lite

A lightweight status-update tool for tracking initiatives — who owns each one
(the DRI), where it stands (On track / At risk / Off track / etc.), and a rolling
log of status updates over time. Inspired by Spotify's internal "Pulse."

Initiatives can be **created manually** in the app or **ingested from any REST API**
via configurable connectors (the generic replacement for a Jira-only integration).

## Stack

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS** — custom neutral design system
- **Prisma + Postgres** — works locally and on serverless hosts
- No auth (single shared workspace)

## Getting started

Requires Node 18+ (developed on Node 22) and a Postgres database. For local
development you can use a free [Neon](https://neon.tech) database, a local
Postgres, or Docker.

```bash
npm install

# Point DATABASE_URL at your Postgres instance
cp .env.example .env   # then edit DATABASE_URL

# Create the schema and load demo data
npm run setup

# Start the dev server
npm run dev
```

Then open http://localhost:3000.

`npm run setup` runs `prisma db push` (creates the tables) and seeds demo data.
To re-seed at any time: `npm run db:seed`.

## Deploying to production (Vercel)

1. Provision a Postgres database (Vercel Storage → Neon is one click, or any
   Postgres provider).
2. In the Vercel project, set the `DATABASE_URL` environment variable.
3. Deploy. The build runs `prisma generate && next build`; `postinstall` also
   generates the Prisma client.
4. Create the schema and seed once against the production database:

   ```bash
   DATABASE_URL="<prod-url>" npx prisma db push
   DATABASE_URL="<prod-url>" SEED_APP_URL="https://<your-app>.vercel.app" npm run db:seed
   ```

   `SEED_APP_URL` lets the bundled demo connector reach its mock source on the
   deployed origin.

## What's included

- **Dashboard** (`/`) — status summary counts, status/team filters, and a list of
  initiatives showing DRI, team, target date, latest update, and current status.
- **Initiative detail** (`/initiatives/[id]`) — full metadata, a status-update
  timeline, and a form to post a new update (which advances the current status).
- **Create / edit** (`/initiatives/new`, `/initiatives/[id]/edit`).
- **Connectors** (`/connectors`) — configure a REST connector, run a sync, and see
  import results. Ships with a working demo connector + mock source.

## Data model

| Model          | Purpose                                                            |
| -------------- | ------------------------------------------------------------------ |
| `Initiative`   | The thing being tracked: name, summary, DRI, team, status, target. |
| `StatusUpdate` | An entry in an initiative's rolling status history.                |
| `Connector`    | A saved external REST source + field mapping for ingestion.        |

Statuses: `ON_TRACK`, `AT_RISK`, `OFF_TRACK`, `NOT_STARTED`, `PAUSED`, `DONE`.

## Ingesting from any API

A connector stores a base URL, optional endpoint path, an optional `Authorization`
header, and a **field mapping** (JSON). On sync, Pulse fetches the source, locates
the records, maps each one onto the initiative shape, and upserts by
`(connector, externalId)` so re-syncs update in place rather than duplicate.

Example field mapping (matches the bundled mock source, which is shaped like a Jira
search response):

```json
{
  "recordsPath": "issues",
  "fields": {
    "externalId": "id",
    "name": "fields.summary",
    "summary": "fields.description",
    "driName": "fields.assignee.displayName",
    "driEmail": "fields.assignee.emailAddress",
    "team": "fields.project.name",
    "status": "fields.status.name",
    "targetDate": "fields.duedate"
  },
  "statusMap": {
    "In Progress": "ON_TRACK",
    "Blocked": "OFF_TRACK",
    "At Risk": "AT_RISK",
    "Done": "DONE"
  }
}
```

- `recordsPath` — dot-path to the array of records in the response (omit if the body
  is itself an array).
- `fields` — maps each Pulse field to a dot-path within a record.
- `statusMap` — translates the source's status strings into Pulse statuses.

### Try it

The seed creates a **"Demo source (mock API)"** connector pointing at the bundled
`/api/mock-source` endpoint. Go to **Connectors → Sync now** to import sample
initiatives end-to-end.

### Direct import endpoint

You can also push initiatives directly without saving a connector:

```bash
# Pulse-shaped records
curl -X POST http://localhost:3000/api/import \
  -H 'Content-Type: application/json' \
  -d '[{"name":"New initiative","driName":"Sam","status":"ON_TRACK","team":"Ops"}]'

# Or an arbitrary shape + a field mapping
curl -X POST http://localhost:3000/api/import \
  -H 'Content-Type: application/json' \
  -d '{"records": {"issues": [ ... ]}, "fieldMapping": { ... }}'
```

## API reference

| Method               | Route                             | Description                       |
| -------------------- | --------------------------------- | --------------------------------- |
| `GET` / `POST`       | `/api/initiatives`                | List / create initiatives         |
| `GET`/`PATCH`/`DELETE` | `/api/initiatives/:id`          | Read / update / delete            |
| `GET` / `POST`       | `/api/initiatives/:id/updates`    | List / post status updates        |
| `GET` / `POST`       | `/api/connectors`                 | List / create connectors          |
| `DELETE`             | `/api/connectors/:id`             | Delete a connector                |
| `POST`               | `/api/connectors/:id/sync`        | Fetch + ingest from the source    |
| `POST`               | `/api/import`                     | Direct import (with/without map)  |
| `GET`                | `/api/mock-source`                | Bundled demo external API         |
