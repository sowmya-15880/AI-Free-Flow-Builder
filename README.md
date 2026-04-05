# Free Flow Landing Page Builder

This repository contains the frontend implementation of a free flow landing page builder.
It is designed to load page JSON into an editable visual canvas where users can rearrange content, adjust styles, preview layouts, and export the result.

## What Is Included

- `frontend/`
  React application for the visual builder interface.
- `rust/`
  Optional canvas-related workspace used by the frontend integration layer.
- `scripts/`
  Local helper scripts used by the frontend workspace.

## What The Frontend Supports

- starter layouts that open directly in the builder
- JSON import for supported landing page documents
- free-flow editing on the canvas
- section, row, column, box, and element editing
- inline text editing for supported elements
- responsive preview modes
- JSON and HTML export

## Main Entry Points

- Prompt page: opens starter layouts or imports an existing JSON file
- Builder page: visual editing canvas with sidebar, properties panel, and export actions

## Local Development

From the repo root:

```sh
cd frontend
npm install
HOST=127.0.0.1 PORT=3000 node node_modules/@craco/craco/dist/bin/craco.js start
```

Then open:

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

## Production Build

```sh
cd frontend
npm run build
```

## Notes

- This repo is frontend-only in its current state.
- The builder can work from starter layouts or uploaded page JSON.
- Imported documents are loaded into the same editable canvas used by manually created pages.
