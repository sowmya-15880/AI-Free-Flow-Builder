# FlowState AI Landing Page Builder - PRD

## Original Problem Statement
User has an AI-based free flow landing page builder. Requirements:
1. Builder accepts JSON (Zoho hierarchical format) and loads as editable page
2. All elements must be free-flow moveable (absolute positioned, drag anywhere)
3. Full property editing via properties panel
4. AI should generate RICH, magazine-quality landing pages (Dribbble/UpLabs quality)
5. Template gallery on prompt page with pre-made template options
6. Enhanced AI prompt with specific UI/UX design principles

## Architecture
- **Frontend**: React.js (CRA) with TailwindCSS, @dnd-kit for drag-and-drop
- **Backend**: FastAPI (Python) with MongoDB, emergentintegrations for AI generation
- **AI**: GPT-4o via Emergent LLM key with premium UI/UX design system prompt
- **Canvas**: Free-flow absolute positioning with 8px snap grid

## What's Been Implemented

### Phase 1 (2026-03-30) - JSON Import & Free-Flow
- JSON Import Pipeline (Zoho hierarchical → flat free-flow conversion)
- Free-flow drag-and-drop element positioning
- Full property editing panel

### Phase 2 (2026-03-30) - Rich AI Generation
- GPT-4o generates 8-12 sections with 40-60+ elements
- Rich fallback page with 10 sections
- Expanded stock image library (10 categories)

### Phase 3 (2026-03-30) - Template Gallery & Premium Prompt
1. **Template Gallery Tab**: 9 pre-made templates on the prompt page:
   - SaaS Dark (neon indigo/violet accents)
   - Gradient SaaS (purple-blue gradients)
   - Minimal White (clean startup look)
   - Playful Creative (warm pastels)
   - Food & Restaurant (dark with amber accents)
   - Fitness & Health (high-energy neon green)
   - Event & Conference (deep purple, speaker profiles)
   - E-Commerce (navy with orange accents)
   - Education & Courses (emerald/teal theme)
2. **Enhanced AI System Prompt**: Premium UI/UX design principles from user's specification:
   - Dribbble/UpLabs inspired quality
   - Mandatory section structure (navbar → hero → features → showcase → social proof → how-it-works → CTA → footer)
   - Style variations (dark neon, gradient, minimal white, playful)
   - 50-80+ elements per page, card grids, avatar testimonials, stats, badges
   - Tailwind CSS-inspired styling principles
3. **Tab Interface**: Templates (default) + Custom Generate tabs
4. **One-Click Generation**: Click any template card to instantly generate a full page

## Test Results
- Backend: 95% (generation works, longer processing times ~2min)
- Frontend: 100% pass (all UI flows working)
- Integration: 95% pass

## Prioritized Backlog
### P0 (Next)
- Export to HTML/CSS
- Save/load projects from MongoDB

### P1
- Template preview thumbnails (static screenshots)
- Custom fonts panel
- Element z-index management

### P2
- Animation/transition editor
- Responsive breakpoint editor
- Version history UI
- Multi-page support
