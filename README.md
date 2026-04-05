# Free Flow Landing Page Builder

This repository contains the frontend builder only.

## Included

- `frontend` - React-based free flow landing page builder UI
- `rust` - optional canvas-related workspace used by the frontend project
- `scripts` - local helper scripts used by the frontend project

## What This Builder Does

- Opens starter layouts directly in the editor
- Imports supported landing page JSON files into the builder
- Lets users edit content, move elements freely, adjust layout, and export JSON or HTML

## Run The Frontend

```sh
cd /path/to/app/frontend
npm install
HOST=127.0.0.1 PORT=3000 node node_modules/@craco/craco/dist/bin/craco.js start
```

Then open:

- Frontend: `http://127.0.0.1:3000`

## Notes

- Replace `/path/to/app` with the actual project path.
- The builder is frontend-only in this repo state.
- Imported landing page JSON can be opened from the prompt page.
