# Honolulu Trip App

Mimi & Wellen's Oʻahu trip companion — a real implementation of the Claude Design
prototype in `../project/Honolulu Trip App v3.dc.html`.

- **Frontend**: static HTML/CSS/vanilla JS (`public/`), ported 1:1 from the prototype's
  visual design (fonts, icons, and Leaflet map are self-hosted under `public/vendor/`
  rather than loaded from CDNs).
- **Backend**: Node.js + Express (`server/`). Serves the static frontend and a JSON API
  for the trip's editable data. The database is [Turso](https://turso.tech) (a hosted,
  libSQL/SQLite-compatible database) rather than a local SQLite file — see below for why.

## Why Turso instead of a local database file

This app is meant to run on a free hosting tier (e.g. Render's free plan), and free tiers
generally don't include a persistent disk — the app's local filesystem can be wiped any
time the instance restarts, which happens automatically and often (idle spin-down,
redeploys, the host moving your service to different hardware). A database that lives on
the app server's own disk doesn't survive that. Turso is free, lives independently of
wherever the app happens to be running, and speaks the same SQL as SQLite, so the app
code barely changes — just how it connects.

Uploaded photos are stored as blobs in the same database (a `posts.image_data` column),
not as files on local disk, for the same reason — otherwise the database rows would
survive a restart but the photo files wouldn't.

Locally, with no Turso credentials configured, the app falls back to a local SQLite file
(`server/trip.local.db`, gitignored) using the same client library — so `npm start` still
works out of the box for development without needing a Turso account.

## What's editable vs. static

Day info, places, flights, costs, cultural notes, and contacts are fixed trip content
(`server/data/trip.js`). Day schedules (add/reorder/remove items, edit time/what/where),
per-schedule-item posts (photo + note, up to 3 each), and the packing/prep checklist are
stored in the database and editable from the UI — changes persist across reloads, app
updates, and restarts.

## Run it

```
cd app
npm install   # first time only
npm start
```

Then open http://localhost:3000.

To point it at a real Turso database (for production, or to test against the same
database the deployed app uses) set these environment variables before starting:

```
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-token
```

(On Render: add both under the service's **Environment** tab, not in a committed file.)

## Notes

- No login — it's a small shared app for two people, matching the original design brief.
- The Map tab needs network access to fetch CARTO basemap tiles at runtime (the pins,
  layout, and interactions all work offline; only the map imagery itself is remote).
