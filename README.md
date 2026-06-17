# Pulse Lite

A lightweight status-update tool for tracking initiatives — who owns each one
(the DRI), where it stands (On track / At risk / Off track / etc.), and a rolling
log of status updates over time. Inspired by Spotify's internal "Pulse."

Initiatives can be **created manually** in the app or **ingested from any REST API**
via configurable connectors (the generic replacement for a Jira-only integration).

## Stack

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS** — custom neutral design system
- **Upstash Redis (Vercel KV)** — schema-less, low-weight, write-capable
- No auth (single shared workspace)

Data is stored as JSON documents in Redis (one per initiative/connector). There
are no migrations. If no KV credentials are configured, Pulse automatically uses
a process-local **in-memory** store so it still runs and builds — handy for local
development, though that data is not persisted across restarts.

## Getting started

Requires Node 18+ (developed on Node 22).

```bash
npm install

# Optional: add Upstash/Vercel KV credentials to persist locally.
# Leave them empty to use the in-memory fallback.
cp .env.example .env

npm run dev
```

Then open http://localhost:3000 and click **Load demo data** on the empty
dashboard (or `POST /api/seed`).

## Deploying to production (Vercel)

1. Import the repo into Vercel (framework preset: Next.js).
2. Add the **Upstash Redis** integration from the Vercel Marketplace
   (Project → Storage → Create Database → Upstash Redis). This injects
   `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
3. Deploy (build is a plain `next build`; no DB env required to build).
4. Seed demo data once (idempotent — only seeds if the store is empty):

   ```bash
   curl -X POST https://<your-app>.vercel.app/api/seed
   ```

   The seed derives the demo connector's base URL from the request origin, so
   its bundled mock source works on the deployed domain.

## What's included

- **Dashboard** (`/`) — status summary counts, status/team filters, and a list of
  initiatives showing DRI, team, target date, latest update, and current status.
- **Initiative detail** (`/initiatives/[id]`) — full metadata, a status-update
  timeline, and a form to post a new update (which advances the current status).
- **Create / edit** (`/initiatives/new`, `/initiatives/[id]/edit`).
- **Connectors** (`/connectors`) — configure a REST connector, run a sync, and see
  import results. Ships with a working demo connector + mock source.

## Data model

Stored as JSON documents in Redis (see [src/lib/types.ts](src/lib/types.ts) and
[src/lib/store.ts](src/lib/store.ts)):

| Document       | Purpose                                                            |
| -------------- | ------------------------------------------------------------------ |
| `Initiative`   | The thing being tracked: name, summary, DRI, team, status, target. Embeds its `StatusUpdate[]` history. |
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

Seeding creates a **"Demo source (mock API)"** connector pointing at the bundled
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
| `POST`               | `/api/seed`                       | Seed demo data (idempotent)       |
| `GET`                | `/api/mock-source`                | Bundled demo external API         |
