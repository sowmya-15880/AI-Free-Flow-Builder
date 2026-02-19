# FlowState AI Landing Page Builder - PRD

## Problem Statement
Build an AI-based free flow landing page builder similar to Wix.com's Harmony AI page builder. Users enter a prompt and GPT-5.2 generates a landing page with 4-5 sections including stock images. The generated page loads in a visual builder with drag-and-drop, properties editing, and publish/export functionality.

## Architecture
- **Frontend**: React + Tailwind CSS + dnd-kit (drag-and-drop)
- **Backend**: FastAPI + MongoDB + GPT-5.2 (via emergentintegrations)
- **State Management**: React Context + useReducer with undo/redo history

## User Personas
- Web designers needing quick landing page prototypes
- Marketers creating campaign pages
- Small business owners building their web presence

## Core Requirements
- AI prompt-to-page generation with 5 sections + stock images
- Visual builder with sidebar, canvas, toolbar, properties panel
- Element types: heading, paragraph, image, button, form, popup, icon, gallery, divider, spacer
- Section templates: hero, features, team, stats, CTA, footer
- Drag-and-drop reordering of elements within sections
- Properties panel for editing content, styles, and layout
- Undo/Redo with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
- Device preview (desktop, tablet, mobile)
- Export as JSON and HTML

## What's Been Implemented (Feb 2026)
- [x] AI prompt page with example chips
- [x] GPT-5.2 integration for landing page generation
- [x] Full visual builder (sidebar, canvas, toolbar, properties panel)
- [x] All element types with renderers
- [x] Section templates
- [x] Drag-and-drop element reordering
- [x] Properties editing for all element types
- [x] Undo/Redo with history stack
- [x] Device preview toggle
- [x] JSON and HTML export
- [x] MongoDB persistence for generated pages

## Prioritized Backlog
### P0 (Done)
- Core builder with all features

### P1 (Next)
- Vue.js migration (user requested for later)
- Drag from sidebar to canvas (currently click-to-add + drag reorder)
- Inline text editing (double-click to edit on canvas)

### P2 (Future)
- Page templates library
- Custom fonts and typography panel
- Image upload integration
- Multi-page support
- Responsive breakpoint editing
- Animation/transition editor
- Collaboration features
- Cloud save/load

## Next Tasks
1. Enhance drag-from-sidebar to specific positions within sections
2. Add inline text editing on canvas
3. Add image search/upload in properties panel
4. Vue.js frontend migration
