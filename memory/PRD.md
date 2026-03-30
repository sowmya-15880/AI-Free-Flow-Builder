# FlowState AI Landing Page Builder - PRD

## Original Problem Statement
User has an AI-based free flow landing page builder. They uploaded a sample-page.json (Zoho hierarchical JSON format). Requirements:
1. Change the logic/wireframe so the builder accepts the JSON
2. The builder needs to load the page from the uploaded JSON
3. Elements must be editable via property box
4. Elements should be free-flow moveable (absolute positioning, drag anywhere)

## Architecture
- **Frontend**: React.js (CRA) with TailwindCSS, @dnd-kit for drag-and-drop
- **Backend**: FastAPI (Python) with MongoDB, emergentintegrations for AI generation
- **AI**: GPT-4o via Emergent LLM key for page generation
- **Canvas**: Free-flow absolute positioning with snap-to-grid (8px)

## User Personas
- Web developers building landing pages
- Marketers needing quick page creation
- Designers importing existing Zoho page JSON layouts

## Core Requirements (Static)
- JSON upload and import (Zoho hierarchical → flat free-flow conversion)
- AI-powered page generation from text prompts
- Free-flow drag-and-drop element positioning
- Full property editing panel (style, typography, shape, CSS, visibility)
- Multi-section canvas with section management
- Undo/Redo support
- Device preview (desktop, tablet, mobile)

## What's Been Implemented (2026-03-30)
1. **JSON Import Pipeline** (`importPageJson.js`): Converts Zoho hierarchical JSON (type:page, elements map, sections → rows → columns → children) into flat free-flow structure with absolute positions
2. **AI Generation** (`server.py`): Uses emergentintegrations with GPT-4o to generate landing page JSON from prompts, with local fallback
3. **BuilderContext**: Updated SET_PAGE action to normalize all imported pages to flat structure (removes elements map, ensures positions)
4. **Free-flow Elements**: All imported elements render as `FreeFlowElement` with drag handles for repositioning
5. **Properties Panel**: Full editing for heading, paragraph, image, button, form elements (font, color, spacing, borders, etc.)

## Test Results
- Backend: 100% pass
- Frontend: 100% pass
- Integration: 100% pass

## Prioritized Backlog
### P0 (Next)
- Export to HTML/CSS
- Save/load projects from MongoDB

### P1
- Custom fonts panel
- Multi-page support
- Element grouping/ungrouping

### P2
- Animation/transition editor
- Responsive breakpoint editor
- Version history UI
- Template gallery

## Next Tasks
- Improve element snapping with smart guides
- Add text inline editing improvements
- Section background image picker
- Element z-index management
