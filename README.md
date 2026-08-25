# Honolulu Trip App

Mimi & Wellen's Oʻahu trip companion — a real implementation of the Claude Design
prototype in `../project/Honolulu Trip App v3.dc.html`.

- **Frontend**: static HTML/CSS/vanilla JS (`public/`), ported 1:1 from the prototype's
  visual design (fonts, icons, and Leaflet map are self-hosted under `public/vendor/`
  rather than loaded from CDNs).
- **Backend**: Node.js + Express + SQLite (`better-sqlite3`) (`server/`). Serves the
  static frontend, a JSON API for the trip's editable data, and uploaded photos.

## What's editable vs. static

Day info, places, flights, costs, cultural notes, and contacts are fixed trip content
(`server/data/trip.js`). Day schedules (add/reorder/remove items, edit time/what/where),
per-schedule-item posts (photo + note, up to 3 each), and the packing/prep checklist are
stored in SQLite and editable from the UI — changes persist across reloads and devices.

## Run it

```
cd app
npm install   # first time only
npm start
```

Then open http://localhost:3000. The SQLite database (`server/trip.db`) and uploaded
photos (`server/uploads/`) are created on first run, seeded from the prototype's
original content.

## Notes

- No login — it's a small shared app for two people, matching the original design brief.
- The Map tab needs network access to fetch CARTO basemap tiles at runtime (the pins,
  layout, and interactions all work offline; only the map imagery itself is remote).
