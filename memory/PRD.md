# FlowState AI Landing Page Builder - PRD

## Original Problem Statement
User has an AI-based free flow landing page builder. Requirements:
1. Builder accepts JSON (Zoho hierarchical format) and loads as editable page
2. All elements must be free-flow moveable (absolute positioned, drag anywhere)
3. Full property editing via properties panel
4. AI should generate RICH, magazine-quality landing pages (like Design Hub example: 10+ sections, card grids, testimonials with avatars, stats, forms, navigation bars)
5. AI should honor user's specific requests from prompt (e.g., "add feedback form in last section")

## Architecture
- **Frontend**: React.js (CRA) with TailwindCSS, @dnd-kit for drag-and-drop
- **Backend**: FastAPI (Python) with MongoDB, emergentintegrations for AI generation
- **AI**: GPT-4o via Emergent LLM key - generates 8-12 section rich landing pages with 40-60+ elements
- **Canvas**: Free-flow absolute positioning with 8px snap grid

## User Personas
- Web developers building landing pages
- Marketers needing quick page creation
- Designers importing existing Zoho page JSON layouts

## Core Requirements (Static)
- JSON upload and import (Zoho hierarchical → flat free-flow conversion)
- AI-powered RICH page generation (8-12 sections, 40-60+ elements)
- Free-flow drag-and-drop element positioning
- Full property editing panel (style, typography, shape, CSS, visibility)
- User prompt honoring (forms, specific sections, custom requirements)
- Multi-section canvas with section management
- Undo/Redo support
- Device preview (desktop, tablet, mobile)

## What's Been Implemented

### Phase 1 (2026-03-30)
1. **JSON Import Pipeline**: Converts Zoho hierarchical JSON into flat free-flow structure
2. **Basic AI Generation**: GPT-4o via emergentintegrations
3. **Free-flow Elements**: All elements draggable with handles
4. **Properties Panel**: Full editing for all element types

### Phase 2 (2026-03-30)
1. **Rich AI Generation Prompt**: Completely rewritten to produce magazine-quality layouts
   - Generates 8-12 sections: navbar, hero, social proof, features, about, how-it-works, testimonials, stats, pricing, CTA, footer
   - Each section has 4-12 elements with proper absolute positioning
   - Creates card grids (3-column at x=40, x=400, x=760)
   - Includes portrait images for testimonials (circular borderRadius: 999px)
   - Large bold stats (48-56px font)
   - Alternating dark/light section backgrounds
2. **Prompt Honoring**: AI follows user's Additional Requirements (forms, specific sections)
3. **Rich Fallback Page**: 10-section fallback with navbar, hero, social proof, features, how-it-works, stats, testimonials, about, CTA, footer - plus dynamic form section when user requests it
4. **Expanded Stock Images**: 10 categories (people_team, people_portraits, technology, business, abstract, workspace, creative, education, events, product_mockup)

## Test Results
- Backend: 100% pass (9 sections, 47 elements generated)
- Frontend: 100% pass (all flows working)
- Integration: 100% pass

## Prioritized Backlog
### P0 (Next)
- Export to HTML/CSS
- Save/load projects from MongoDB

### P1
- Custom fonts panel
- Multi-page support
- Element z-index management

### P2
- Animation/transition editor
- Responsive breakpoint editor
- Version history UI
- Template gallery
