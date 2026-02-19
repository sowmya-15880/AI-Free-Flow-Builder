# FlowState AI Landing Page Builder - PRD

## Problem Statement
Build an AI-based free flow landing page builder similar to Wix.com's Harmony AI page builder.

## Architecture
- **Frontend**: React + Tailwind CSS + dnd-kit
- **Backend**: FastAPI + MongoDB + GPT-5.2

## What's Been Implemented (Feb 2026)
### V1 (Initial)
- AI prompt page with GPT-5.2 generation
- Basic builder with fixed sidebar and properties panel

### V2 (Current - User Feedback)
- [x] Icon strip sidebar (Sections, Elements, Media, Popups, Forms, Apps) matching Wix reference
- [x] Sliding white sub-panel that opens/closes on icon click
- [x] Floating properties panel with close button (not fixed)
- [x] Coral/pink (#e74c6f) color palette matching reference video
- [x] Element reordering via drag handles within sections
- [x] Categorized stock images (7 categories) for relevant AI-generated images
- [x] Section templates (Hero, Features, Team, CTA, Footer)
- [x] Undo/Redo with keyboard shortcuts
- [x] JSON + HTML export
- [x] Device preview (desktop/tablet/mobile)

## Prioritized Backlog
### P1
- Vue.js migration (user wants later)
- True free-flow absolute positioning within sections
- Inline text editing on canvas

### P2
- Image search/upload in builder
- Animation/transition editor
- Custom fonts panel
- Multi-page support
