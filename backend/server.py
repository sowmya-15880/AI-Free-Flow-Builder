from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import hashlib
from pathlib import Path
from pydantic import BaseModel
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')
client = AsyncIOMotorClient(mongo_url) if mongo_url and db_name else None
db = client[db_name] if client and db_name else None

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Rich stock image library organized by category
STOCK_IMAGES = {
    "people_team": [
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
        "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80",
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
    ],
    "people_portraits": [
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    ],
    "technology": [
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    ],
    "business": [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
        "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    ],
    "abstract_patterns": [
        "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80",
        "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
    ],
    "workspace": [
        "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&q=80",
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
        "https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=800&q=80",
    ],
    "creative_design": [
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
        "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&q=80",
        "https://images.unsplash.com/photo-1542621334-a254cf47733d?w=800&q=80",
    ],
    "education": [
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
    ],
    "events": [
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
        "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80",
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80",
    ],
    "product_mockup": [
        "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
        "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&q=80",
    ],
}


class GeneratePageRequest(BaseModel):
    prompt: str
    page_type: Optional[str] = None
    audience: Optional[str] = None
    product_name: Optional[str] = None
    product_description: Optional[str] = None
    variant_hint: Optional[str] = None


PAGE_TYPE_DEFAULTS: Dict[str, Dict[str, str]] = {
    "lead_generation": {
        "audience": "Growth marketers and small business owners",
        "product_name": "LeadFlow Pro",
        "product_description": "An AI-powered platform to capture, qualify, and convert high-intent leads.",
    },
    "product_info": {
        "audience": "Product evaluators and decision-makers",
        "product_name": "Nimbus Suite",
        "product_description": "A modern product suite that helps teams launch faster with better collaboration.",
    },
    "webinar_registration": {
        "audience": "Professionals looking for practical learning and expert sessions",
        "product_name": "Scale Masterclass Live",
        "product_description": "A webinar series that teaches repeatable growth systems with live Q&A and templates.",
    },
    "saas": {
        "audience": "Startup founders and SaaS teams",
        "product_name": "Orbit Cloud",
        "product_description": "A SaaS platform that unifies analytics, automation, and campaign execution in one workspace.",
    },
}


def resolve_generation_context(request: GeneratePageRequest) -> Dict[str, str]:
    page_type = (request.page_type or "lead_generation").strip().lower()
    defaults = PAGE_TYPE_DEFAULTS.get(page_type, PAGE_TYPE_DEFAULTS["lead_generation"])
    return {
        "page_type": page_type,
        "audience": (request.audience or defaults["audience"]).strip(),
        "product_name": (request.product_name or defaults["product_name"]).strip(),
        "product_description": (request.product_description or defaults["product_description"]).strip(),
    }


def compute_variant_index(prompt: str, context: Dict[str, str], variant_hint: str) -> int:
    raw = f'{prompt}|{context["page_type"]}|{context["audience"]}|{context["product_name"]}|{variant_hint or ""}'
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % 4


def normalize_json_text(response_text: str) -> str:
    cleaned = (response_text or "").strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        if lines[-1].strip() == "```":
            cleaned = "\n".join(lines[1:-1]).strip()
        else:
            cleaned = "\n".join(lines[1:]).strip()
    if cleaned.lower().startswith("json"):
        cleaned = cleaned[4:].strip()
    # Remove trailing ``` if present
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()
    return cleaned


RICH_SYSTEM_PROMPT = """You are an expert UI/UX designer + senior frontend developer specializing in modern, high-converting landing pages.

Your goal is to generate visually stunning, production-ready landing pages inspired by premium design platforms like Dribbble, UpLabs, and modern SaaS websites.

## OUTPUT FORMAT
You output a JSON structure for a visual page builder. Return ONLY valid JSON (no markdown, no explanation, no code blocks):
{
  "title": "Page Title",
  "sections": [
    {
      "id": "unique-section-id",
      "type": "navbar|hero|social_proof|features|showcase|about|how_it_works|testimonials|stats|pricing|team|gallery|faq|cta|footer|custom",
      "style": {"backgroundColor": "#hex", "padding": "0"},
      "elements": [
        {
          "id": "unique-element-id",
          "type": "heading|paragraph|image|button|form",
          "content": "string" or {"src":"url","alt":"desc"} for images or {"fields":[...],"submitText":"..."} for forms,
          "position": {"x": number, "y": number},
          "style": { CSS properties as key-value pairs }
        }
      ]
    }
  ]
}

CANVAS: 1120px wide. Every element uses absolute positioning (x, y). x: 0-1080, y: 0-800+ per section. Section padding: "0".

ELEMENT TYPES:
- "heading": text headings. Content = string.
- "paragraph": body text, descriptions, captions, labels, badges, tags, links. Content = string.
- "button": CTA / action buttons. Content = string (button label).
- "image": photos, avatars, illustrations, product shots. Content = {"src":"image-url","alt":"description"}.
- "form": contact/signup/feedback forms. Content = {"fields":[{"label":"Name","type":"text","placeholder":"Your name"},{"label":"Email","type":"email","placeholder":"you@example.com"}],"submitText":"Submit"}.

## DESIGN PRINCIPLES

- Use bold, modern layouts with strong visual hierarchy
- Prefer clean spacing, soft shadows (boxShadow), rounded corners (borderRadius 12-20px), and subtle gradients
- Follow an 8px spacing system
- Ensure excellent typography contrast (large headings 48-64px, refined body text 15-18px)
- Use visually engaging hero sections (image/illustration + text + dual CTAs)
- Maintain consistency in colors, spacing, and components across all sections

## UI STRUCTURE (MANDATORY)

Always generate sections in this order (8-12 sections total):

1. **Navbar** - Logo text (heading), 3-4 nav links (paragraph), CTA button (highlighted)
2. **Hero Section** - Big bold headline (48-64px, split-highlight key words with color), supporting subtitle (18px), primary CTA + secondary CTA buttons, right-side large visual image, optional badge paragraph (e.g., "Trusted by 10k+")
3. **Features / Services Section** - Section title + subtitle, then 3-6 feature cards in a grid layout. Each card: icon/emoji paragraph + heading + description. Card grid: x=40, x=400, x=760 for 3-col. Use background color and borderRadius on card descriptions.
4. **Popular / Showcase Section** - Card-based layout showing products/apps/templates. Include ratings, pricing, or tag paragraphs. Use images with rounded corners.
5. **Social Proof Section** - 3 testimonials with circular avatar images (borderRadius "999px", width "56-64px"), reviewer name heading, role paragraph, and quoted text paragraph. Or impressive stats (large 48-56px accent numbers + labels).
6. **How It Works / Steps** - Numbered steps (3 steps). Large step numbers (heading, 48-56px, accent color), step title heading, step description paragraph.
7. **Call-To-Action Section** - Strong conversion-focused headline, supporting text, prominent CTA button. Dark background for contrast.
8. **Footer** - Company logo heading, description, column headings (Product, Company, Legal), link text paragraphs, copyright line.

Additional sections (include 1-2 based on context): About/Story, Pricing Table, FAQ, Team/Speakers, Newsletter signup.

## STYLE REQUIREMENTS

- Use a cohesive, modern color palette. Choose one style based on the prompt:
  * Dark theme with neon accents (indigo/violet/green/amber glow on dark #0f172a/#111827)
  * Gradient SaaS (purple→blue or pink→orange, soft shadows, glass cards)
  * Clean minimal white (#ffffff base, sharp dark text, subtle gray cards)
  * Playful/colorful (warm pastels, rounded shapes, bouncy feel)
- Hero section height ~500-650px elements. Feature sections ~500-600px. Testimonials ~400-500px. CTA ~300-400px. Footer ~250-350px.
- Cards: use backgroundColor + padding (20-24px) + borderRadius (14-16px) on paragraph/container elements. Add boxShadow for depth.
- Buttons: bold fontWeight 700, padding "14px 32px", borderRadius "12px", hover-ready contrast colors.
- Labels/badges: small font 11-13px, uppercase letterSpacing "0.08em", colored background pill shape (borderRadius "100px", padding "5px 14px").
- Alternate dark and light section backgrounds for visual rhythm.

## CONTENT GENERATION

- Use realistic, compelling marketing copy (NOT lorem ipsum)
- Product names, stats, and testimonial quotes should feel authentic
- Keep text concise: headlines 4-8 words, descriptions 15-25 words, testimonials 20-40 words
- Add small UI details: rating stars as text, price tags, "NEW" or "POPULAR" badges, percentage stats

## CRITICAL RULES

1. Each section: 4-15 elements. Total page: 50-80+ elements.
2. Every element MUST have position {x, y}, unique id, and style object.
3. Elements MUST NOT overlap within a section. Space them vertically (min 40-60px between rows).
4. ALWAYS honor the user's specific requests in their prompt (forms, sections, style preferences, content requirements).
5. When user mentions form/feedback/contact/signup/newsletter, include a styled form element with appropriate fields.
6. Image content format: {"src": "url", "alt": "description"}. Use the provided stock images library.
7. All IDs: lowercase alphanumeric with dashes, globally unique.
8. Return ONLY the JSON. No markdown. No explanation. No code blocks."""


async def generate_with_ai(prompt: str, context: Dict[str, str], variant_index: int) -> tuple:
    emergent_key = os.environ.get("EMERGENT_LLM_KEY")
    if not emergent_key:
        raise RuntimeError("No EMERGENT_LLM_KEY configured")

    from emergentintegrations.llm.chat import LlmChat, UserMessage

    images_json = json.dumps(STOCK_IMAGES, indent=2)

    style_options = [
        "Dark theme with neon/violet accents - glowing elements on deep dark backgrounds",
        "Gradient SaaS - purple-to-blue or pink-to-orange gradients, soft shadows, glass-morphism",
        "Clean minimal white - crisp white backgrounds, sharp dark typography, subtle gray cards",
        "Playful colorful - warm pastels (yellow, pink, lavender), rounded shapes, bouncy feel",
    ]
    chosen_style = style_options[variant_index % len(style_options)]

    user_prompt = f"""Design a stunning, production-ready landing page:

PRODUCT: {context["product_name"]}
DESCRIPTION: {context["product_description"]}
TARGET AUDIENCE: {context["audience"]}
PAGE TYPE: {context["page_type"]}

VISUAL STYLE TO USE: {chosen_style}

STOCK IMAGES LIBRARY (use these exact URLs for all images):
{images_json}

Use portrait images from "people_portraits" for testimonials/team sections (with borderRadius "999px").
Use images from other categories for hero, features, and about sections.

USER'S FULL BRIEF AND SPECIFIC REQUIREMENTS:
{prompt}

Remember:
- 8-12 sections, 50-80+ total elements
- Rich card grids, avatar testimonials, stat numbers, badges
- Honor ANY specific user requests (forms, sections, style preferences)
- Return ONLY the JSON object, no markdown or explanation"""

    chat = LlmChat(
        api_key=emergent_key,
        session_id=f"page-gen-{uuid.uuid4().hex[:8]}",
        system_message=RICH_SYSTEM_PROMPT,
    ).with_model("openai", "gpt-4o")

    user_message = UserMessage(text=user_prompt)
    response = await chat.send_message(user_message)
    response_text = str(response or "")
    cleaned = normalize_json_text(response_text)
    page_data = json.loads(cleaned)
    return page_data, "emergent:gpt-4o"


def local_fallback_page(prompt: str, context: Dict[str, str], variant_index: int) -> Dict[str, Any]:
    """Rich fallback page when AI is unavailable."""
    pn = context["product_name"]
    pd = context["product_description"]
    aud = context["audience"]
    uid = lambda prefix: f"{prefix}-{uuid.uuid4().hex[:6]}"

    themes = [
        {"dark": "#0b1220", "light": "#f8fafc", "accent": "#6366f1", "accent2": "#a855f7", "text": "#f8fafc", "sub": "#94a3b8", "body": "#334155", "card": "#ffffff", "alt_bg": "#f1f5f9"},
        {"dark": "#111827", "light": "#ffffff", "accent": "#2563eb", "accent2": "#06b6d4", "text": "#f9fafb", "sub": "#d1d5db", "body": "#374151", "card": "#ffffff", "alt_bg": "#f3f4f6"},
        {"dark": "#1e1b4b", "light": "#faf5ff", "accent": "#8b5cf6", "accent2": "#ec4899", "text": "#faf5ff", "sub": "#c4b5fd", "body": "#4b5563", "card": "#ffffff", "alt_bg": "#faf5ff"},
        {"dark": "#0c0a09", "light": "#fafaf9", "accent": "#ea580c", "accent2": "#eab308", "text": "#fafaf9", "sub": "#a8a29e", "body": "#44403c", "card": "#ffffff", "alt_bg": "#f5f5f4"},
    ]
    t = themes[variant_index]

    portraits = STOCK_IMAGES["people_portraits"]
    hero_img = STOCK_IMAGES["people_team"][variant_index % len(STOCK_IMAGES["people_team"])]
    feature_img = STOCK_IMAGES["technology"][variant_index % len(STOCK_IMAGES["technology"])]

    # Check if user requested a form
    prompt_lower = prompt.lower()
    has_form_request = any(w in prompt_lower for w in ["form", "feedback", "contact", "signup", "newsletter", "subscribe"])

    sections = [
        # 1. NAVBAR
        {
            "id": uid("nav"), "type": "navbar",
            "style": {"backgroundColor": t["dark"], "padding": "0"},
            "elements": [
                {"id": uid("logo"), "type": "heading", "content": pn, "position": {"x": 40, "y": 20}, "style": {"fontSize": "22px", "fontWeight": 800, "color": t["text"], "letterSpacing": "-0.02em"}},
                {"id": uid("nav1"), "type": "paragraph", "content": "Features", "position": {"x": 520, "y": 24}, "style": {"fontSize": "14px", "color": t["sub"], "fontWeight": 500}},
                {"id": uid("nav2"), "type": "paragraph", "content": "Pricing", "position": {"x": 620, "y": 24}, "style": {"fontSize": "14px", "color": t["sub"], "fontWeight": 500}},
                {"id": uid("nav3"), "type": "paragraph", "content": "About", "position": {"x": 710, "y": 24}, "style": {"fontSize": "14px", "color": t["sub"], "fontWeight": 500}},
                {"id": uid("nav-cta"), "type": "button", "content": "Get Started", "position": {"x": 920, "y": 14}, "style": {"backgroundColor": t["accent"], "color": "#ffffff", "padding": "10px 24px", "borderRadius": "8px", "fontSize": "14px", "fontWeight": 600}},
            ]
        },
        # 2. HERO
        {
            "id": uid("hero"), "type": "hero",
            "style": {"backgroundColor": t["dark"], "padding": "0"},
            "elements": [
                {"id": uid("badge"), "type": "paragraph", "content": f"Trusted by 10,000+ {aud.lower()}", "position": {"x": 56, "y": 48}, "style": {"fontSize": "13px", "color": t["accent"], "fontWeight": 600, "backgroundColor": "rgba(99,102,241,0.12)", "padding": "6px 16px", "borderRadius": "20px", "maxWidth": "400px"}},
                {"id": uid("h1"), "type": "heading", "content": f"Transform the way you grow with {pn}", "position": {"x": 56, "y": 104}, "style": {"fontSize": "56px", "fontWeight": 800, "color": t["text"], "lineHeight": "1.06", "maxWidth": "540px", "letterSpacing": "-0.03em"}},
                {"id": uid("sub"), "type": "paragraph", "content": f"{pd} Built for {aud.lower()} who demand results.", "position": {"x": 56, "y": 296}, "style": {"fontSize": "19px", "color": t["sub"], "lineHeight": "1.65", "maxWidth": "480px"}},
                {"id": uid("cta1"), "type": "button", "content": "Start Free Trial", "position": {"x": 56, "y": 400}, "style": {"backgroundColor": t["accent"], "color": "#ffffff", "padding": "16px 36px", "borderRadius": "12px", "fontSize": "16px", "fontWeight": 700}},
                {"id": uid("cta2"), "type": "button", "content": "Watch Demo", "position": {"x": 260, "y": 400}, "style": {"backgroundColor": "transparent", "color": t["sub"], "padding": "16px 36px", "borderRadius": "12px", "fontSize": "16px", "fontWeight": 600, "border": f"1px solid {t['sub']}"}},
                {"id": uid("hero-img"), "type": "image", "content": {"src": hero_img, "alt": "Hero image"}, "position": {"x": 580, "y": 48}, "style": {"maxWidth": "480px", "borderRadius": "20px", "boxShadow": "0 24px 48px rgba(0,0,0,0.3)"}},
                {"id": uid("stat-inline"), "type": "paragraph", "content": "4.9 rating  |  500+ reviews  |  99.9% uptime", "position": {"x": 56, "y": 480}, "style": {"fontSize": "13px", "color": t["sub"], "fontWeight": 500, "letterSpacing": "0.04em"}},
            ]
        },
        # 3. SOCIAL PROOF / LOGOS
        {
            "id": uid("proof"), "type": "social_proof",
            "style": {"backgroundColor": t["light"], "padding": "0"},
            "elements": [
                {"id": uid("proof-lbl"), "type": "paragraph", "content": "TRUSTED BY LEADING COMPANIES", "position": {"x": 300, "y": 40}, "style": {"fontSize": "12px", "color": "#94a3b8", "fontWeight": 600, "letterSpacing": "0.12em", "textAlign": "center", "maxWidth": "600px"}},
                {"id": uid("logo1"), "type": "paragraph", "content": "Acme Corp", "position": {"x": 80, "y": 90}, "style": {"fontSize": "20px", "fontWeight": 700, "color": "#cbd5e1"}},
                {"id": uid("logo2"), "type": "paragraph", "content": "Globex Inc", "position": {"x": 280, "y": 90}, "style": {"fontSize": "20px", "fontWeight": 700, "color": "#cbd5e1"}},
                {"id": uid("logo3"), "type": "paragraph", "content": "Initech", "position": {"x": 480, "y": 90}, "style": {"fontSize": "20px", "fontWeight": 700, "color": "#cbd5e1"}},
                {"id": uid("logo4"), "type": "paragraph", "content": "Umbrella Co", "position": {"x": 660, "y": 90}, "style": {"fontSize": "20px", "fontWeight": 700, "color": "#cbd5e1"}},
                {"id": uid("logo5"), "type": "paragraph", "content": "Stark Industries", "position": {"x": 870, "y": 90}, "style": {"fontSize": "20px", "fontWeight": 700, "color": "#cbd5e1"}},
            ]
        },
        # 4. FEATURES (3-COLUMN CARD GRID)
        {
            "id": uid("features"), "type": "features",
            "style": {"backgroundColor": t["light"], "padding": "0"},
            "elements": [
                {"id": uid("feat-title"), "type": "heading", "content": "Everything you need to succeed", "position": {"x": 200, "y": 48}, "style": {"fontSize": "42px", "fontWeight": 800, "color": "#0f172a", "textAlign": "center", "maxWidth": "700px", "letterSpacing": "-0.02em"}},
                {"id": uid("feat-sub"), "type": "paragraph", "content": f"Powerful tools designed specifically for {aud.lower()}.", "position": {"x": 260, "y": 120}, "style": {"fontSize": "18px", "color": "#64748b", "textAlign": "center", "maxWidth": "560px"}},
                # Card 1
                {"id": uid("fc1h"), "type": "heading", "content": "Smart Automation", "position": {"x": 40, "y": 200}, "style": {"fontSize": "22px", "fontWeight": 700, "color": "#0f172a", "maxWidth": "300px"}},
                {"id": uid("fc1p"), "type": "paragraph", "content": "Automate repetitive tasks and workflows. Save 10+ hours per week with intelligent process automation.", "position": {"x": 40, "y": 240}, "style": {"fontSize": "15px", "color": "#64748b", "lineHeight": "1.6", "maxWidth": "300px", "backgroundColor": t["alt_bg"], "padding": "20px", "borderRadius": "14px"}},
                # Card 2
                {"id": uid("fc2h"), "type": "heading", "content": "Real-Time Analytics", "position": {"x": 400, "y": 200}, "style": {"fontSize": "22px", "fontWeight": 700, "color": "#0f172a", "maxWidth": "300px"}},
                {"id": uid("fc2p"), "type": "paragraph", "content": "Track every metric that matters. Live dashboards, custom reports, and actionable insights at your fingertips.", "position": {"x": 400, "y": 240}, "style": {"fontSize": "15px", "color": "#64748b", "lineHeight": "1.6", "maxWidth": "300px", "backgroundColor": t["alt_bg"], "padding": "20px", "borderRadius": "14px"}},
                # Card 3
                {"id": uid("fc3h"), "type": "heading", "content": "Team Collaboration", "position": {"x": 760, "y": 200}, "style": {"fontSize": "22px", "fontWeight": 700, "color": "#0f172a", "maxWidth": "300px"}},
                {"id": uid("fc3p"), "type": "paragraph", "content": "Work together seamlessly. Shared workspaces, real-time editing, and smart notifications keep everyone aligned.", "position": {"x": 760, "y": 240}, "style": {"fontSize": "15px", "color": "#64748b", "lineHeight": "1.6", "maxWidth": "300px", "backgroundColor": t["alt_bg"], "padding": "20px", "borderRadius": "14px"}},
                # Card 4
                {"id": uid("fc4h"), "type": "heading", "content": "Enterprise Security", "position": {"x": 40, "y": 400}, "style": {"fontSize": "22px", "fontWeight": 700, "color": "#0f172a", "maxWidth": "300px"}},
                {"id": uid("fc4p"), "type": "paragraph", "content": "Bank-grade encryption, SOC 2 compliance, and granular access controls protect your most sensitive data.", "position": {"x": 40, "y": 440}, "style": {"fontSize": "15px", "color": "#64748b", "lineHeight": "1.6", "maxWidth": "300px", "backgroundColor": t["alt_bg"], "padding": "20px", "borderRadius": "14px"}},
                # Card 5
                {"id": uid("fc5h"), "type": "heading", "content": "API Integrations", "position": {"x": 400, "y": 400}, "style": {"fontSize": "22px", "fontWeight": 700, "color": "#0f172a", "maxWidth": "300px"}},
                {"id": uid("fc5p"), "type": "paragraph", "content": "Connect with 200+ tools you already use. Zapier, Slack, HubSpot, Salesforce, and more with one-click setup.", "position": {"x": 400, "y": 440}, "style": {"fontSize": "15px", "color": "#64748b", "lineHeight": "1.6", "maxWidth": "300px", "backgroundColor": t["alt_bg"], "padding": "20px", "borderRadius": "14px"}},
                # Card 6
                {"id": uid("fc6h"), "type": "heading", "content": "24/7 Support", "position": {"x": 760, "y": 400}, "style": {"fontSize": "22px", "fontWeight": 700, "color": "#0f172a", "maxWidth": "300px"}},
                {"id": uid("fc6p"), "type": "paragraph", "content": "Expert help whenever you need it. Live chat, dedicated account managers, and comprehensive documentation.", "position": {"x": 760, "y": 440}, "style": {"fontSize": "15px", "color": "#64748b", "lineHeight": "1.6", "maxWidth": "300px", "backgroundColor": t["alt_bg"], "padding": "20px", "borderRadius": "14px"}},
            ]
        },
        # 5. HOW IT WORKS
        {
            "id": uid("how"), "type": "how_it_works",
            "style": {"backgroundColor": t["dark"], "padding": "0"},
            "elements": [
                {"id": uid("how-title"), "type": "heading", "content": "Get started in 3 simple steps", "position": {"x": 240, "y": 48}, "style": {"fontSize": "40px", "fontWeight": 800, "color": t["text"], "textAlign": "center", "maxWidth": "640px", "letterSpacing": "-0.02em"}},
                {"id": uid("step1n"), "type": "heading", "content": "01", "position": {"x": 80, "y": 150}, "style": {"fontSize": "56px", "fontWeight": 800, "color": t["accent"], "maxWidth": "120px"}},
                {"id": uid("step1h"), "type": "heading", "content": "Sign Up Free", "position": {"x": 80, "y": 220}, "style": {"fontSize": "24px", "fontWeight": 700, "color": t["text"], "maxWidth": "260px"}},
                {"id": uid("step1p"), "type": "paragraph", "content": "Create your account in under 60 seconds. No credit card required.", "position": {"x": 80, "y": 260}, "style": {"fontSize": "15px", "color": t["sub"], "lineHeight": "1.6", "maxWidth": "260px"}},
                {"id": uid("step2n"), "type": "heading", "content": "02", "position": {"x": 430, "y": 150}, "style": {"fontSize": "56px", "fontWeight": 800, "color": t["accent"], "maxWidth": "120px"}},
                {"id": uid("step2h"), "type": "heading", "content": "Connect & Configure", "position": {"x": 430, "y": 220}, "style": {"fontSize": "24px", "fontWeight": 700, "color": t["text"], "maxWidth": "260px"}},
                {"id": uid("step2p"), "type": "paragraph", "content": "Import your data and connect your existing tools in minutes.", "position": {"x": 430, "y": 260}, "style": {"fontSize": "15px", "color": t["sub"], "lineHeight": "1.6", "maxWidth": "260px"}},
                {"id": uid("step3n"), "type": "heading", "content": "03", "position": {"x": 780, "y": 150}, "style": {"fontSize": "56px", "fontWeight": 800, "color": t["accent"], "maxWidth": "120px"}},
                {"id": uid("step3h"), "type": "heading", "content": "Launch & Scale", "position": {"x": 780, "y": 220}, "style": {"fontSize": "24px", "fontWeight": 700, "color": t["text"], "maxWidth": "260px"}},
                {"id": uid("step3p"), "type": "paragraph", "content": "Go live and watch your metrics soar with AI-powered optimization.", "position": {"x": 780, "y": 260}, "style": {"fontSize": "15px", "color": t["sub"], "lineHeight": "1.6", "maxWidth": "260px"}},
            ]
        },
        # 6. STATS
        {
            "id": uid("stats"), "type": "stats",
            "style": {"backgroundColor": t["light"], "padding": "0"},
            "elements": [
                {"id": uid("stat1n"), "type": "heading", "content": "10,000+", "position": {"x": 60, "y": 48}, "style": {"fontSize": "52px", "fontWeight": 800, "color": t["accent"], "maxWidth": "220px"}},
                {"id": uid("stat1l"), "type": "paragraph", "content": "Active Users", "position": {"x": 60, "y": 112}, "style": {"fontSize": "16px", "color": "#64748b", "fontWeight": 500}},
                {"id": uid("stat2n"), "type": "heading", "content": "99.9%", "position": {"x": 340, "y": 48}, "style": {"fontSize": "52px", "fontWeight": 800, "color": t["accent"], "maxWidth": "220px"}},
                {"id": uid("stat2l"), "type": "paragraph", "content": "Uptime SLA", "position": {"x": 340, "y": 112}, "style": {"fontSize": "16px", "color": "#64748b", "fontWeight": 500}},
                {"id": uid("stat3n"), "type": "heading", "content": "4.9/5", "position": {"x": 600, "y": 48}, "style": {"fontSize": "52px", "fontWeight": 800, "color": t["accent"], "maxWidth": "220px"}},
                {"id": uid("stat3l"), "type": "paragraph", "content": "Customer Rating", "position": {"x": 600, "y": 112}, "style": {"fontSize": "16px", "color": "#64748b", "fontWeight": 500}},
                {"id": uid("stat4n"), "type": "heading", "content": "50M+", "position": {"x": 860, "y": 48}, "style": {"fontSize": "52px", "fontWeight": 800, "color": t["accent"], "maxWidth": "220px"}},
                {"id": uid("stat4l"), "type": "paragraph", "content": "Tasks Automated", "position": {"x": 860, "y": 112}, "style": {"fontSize": "16px", "color": "#64748b", "fontWeight": 500}},
            ]
        },
        # 7. TESTIMONIALS
        {
            "id": uid("test"), "type": "testimonials",
            "style": {"backgroundColor": t["alt_bg"], "padding": "0"},
            "elements": [
                {"id": uid("test-title"), "type": "heading", "content": "Loved by teams worldwide", "position": {"x": 260, "y": 48}, "style": {"fontSize": "40px", "fontWeight": 800, "color": "#0f172a", "textAlign": "center", "maxWidth": "600px", "letterSpacing": "-0.02em"}},
                # Testimonial 1
                {"id": uid("t1-img"), "type": "image", "content": {"src": portraits[0], "alt": "Sarah Chen"}, "position": {"x": 60, "y": 140}, "style": {"width": "56px", "maxWidth": "56px", "borderRadius": "999px"}},
                {"id": uid("t1-name"), "type": "heading", "content": "Sarah Chen", "position": {"x": 130, "y": 140}, "style": {"fontSize": "16px", "fontWeight": 700, "color": "#0f172a", "maxWidth": "280px"}},
                {"id": uid("t1-role"), "type": "paragraph", "content": "VP of Marketing, TechCorp", "position": {"x": 130, "y": 166}, "style": {"fontSize": "13px", "color": "#94a3b8", "maxWidth": "280px"}},
                {"id": uid("t1-quote"), "type": "paragraph", "content": f"\"{pn} completely transformed our workflow. We've seen a 3x increase in qualified leads and cut our response time by 60%.\"", "position": {"x": 60, "y": 210}, "style": {"fontSize": "16px", "color": "#334155", "lineHeight": "1.65", "maxWidth": "320px", "backgroundColor": "#ffffff", "padding": "20px", "borderRadius": "14px", "boxShadow": "0 2px 8px rgba(0,0,0,0.06)"}},
                # Testimonial 2
                {"id": uid("t2-img"), "type": "image", "content": {"src": portraits[1], "alt": "Marcus Johnson"}, "position": {"x": 420, "y": 140}, "style": {"width": "56px", "maxWidth": "56px", "borderRadius": "999px"}},
                {"id": uid("t2-name"), "type": "heading", "content": "Marcus Johnson", "position": {"x": 490, "y": 140}, "style": {"fontSize": "16px", "fontWeight": 700, "color": "#0f172a", "maxWidth": "280px"}},
                {"id": uid("t2-role"), "type": "paragraph", "content": "CEO, GrowthLab", "position": {"x": 490, "y": 166}, "style": {"fontSize": "13px", "color": "#94a3b8", "maxWidth": "280px"}},
                {"id": uid("t2-quote"), "type": "paragraph", "content": "\"The ROI was immediate. Within the first month, our conversion rate jumped by 47%. This is hands-down the best investment we've made.\"", "position": {"x": 420, "y": 210}, "style": {"fontSize": "16px", "color": "#334155", "lineHeight": "1.65", "maxWidth": "320px", "backgroundColor": "#ffffff", "padding": "20px", "borderRadius": "14px", "boxShadow": "0 2px 8px rgba(0,0,0,0.06)"}},
                # Testimonial 3
                {"id": uid("t3-img"), "type": "image", "content": {"src": portraits[2], "alt": "Elena Vasquez"}, "position": {"x": 780, "y": 140}, "style": {"width": "56px", "maxWidth": "56px", "borderRadius": "999px"}},
                {"id": uid("t3-name"), "type": "heading", "content": "Elena Vasquez", "position": {"x": 850, "y": 140}, "style": {"fontSize": "16px", "fontWeight": 700, "color": "#0f172a", "maxWidth": "280px"}},
                {"id": uid("t3-role"), "type": "paragraph", "content": "Product Lead, ScaleUp", "position": {"x": 850, "y": 166}, "style": {"fontSize": "13px", "color": "#94a3b8", "maxWidth": "280px"}},
                {"id": uid("t3-quote"), "type": "paragraph", "content": "\"I've tried every tool out there. Nothing comes close. The automation alone saved our team 20+ hours per week.\"", "position": {"x": 780, "y": 210}, "style": {"fontSize": "16px", "color": "#334155", "lineHeight": "1.65", "maxWidth": "280px", "backgroundColor": "#ffffff", "padding": "20px", "borderRadius": "14px", "boxShadow": "0 2px 8px rgba(0,0,0,0.06)"}},
            ]
        },
        # 8. ABOUT / FEATURE IMAGE
        {
            "id": uid("about"), "type": "about",
            "style": {"backgroundColor": t["light"], "padding": "0"},
            "elements": [
                {"id": uid("about-img"), "type": "image", "content": {"src": feature_img, "alt": "Platform overview"}, "position": {"x": 40, "y": 48}, "style": {"maxWidth": "500px", "borderRadius": "18px", "boxShadow": "0 12px 32px rgba(0,0,0,0.1)"}},
                {"id": uid("about-h"), "type": "heading", "content": f"Why {pn} is different", "position": {"x": 580, "y": 56}, "style": {"fontSize": "38px", "fontWeight": 800, "color": "#0f172a", "maxWidth": "460px", "letterSpacing": "-0.02em"}},
                {"id": uid("about-p1"), "type": "paragraph", "content": f"Unlike traditional solutions, {pn} uses AI to understand your unique needs and adapt in real-time. No more one-size-fits-all approaches.", "position": {"x": 580, "y": 136}, "style": {"fontSize": "17px", "color": "#475569", "lineHeight": "1.7", "maxWidth": "440px"}},
                {"id": uid("about-p2"), "type": "paragraph", "content": "Our proprietary algorithms process millions of data points to deliver personalized recommendations that drive measurable growth.", "position": {"x": 580, "y": 256}, "style": {"fontSize": "17px", "color": "#475569", "lineHeight": "1.7", "maxWidth": "440px"}},
                {"id": uid("about-btn"), "type": "button", "content": "Learn More", "position": {"x": 580, "y": 360}, "style": {"backgroundColor": t["accent"], "color": "#ffffff", "padding": "14px 32px", "borderRadius": "12px", "fontSize": "15px", "fontWeight": 700}},
            ]
        },
        # 9. FINAL CTA
        {
            "id": uid("final-cta"), "type": "cta",
            "style": {"backgroundColor": t["dark"], "padding": "0"},
            "elements": [
                {"id": uid("cta-h"), "type": "heading", "content": f"Ready to transform your business with {pn}?", "position": {"x": 160, "y": 64}, "style": {"fontSize": "44px", "fontWeight": 800, "color": t["text"], "maxWidth": "800px", "textAlign": "center", "letterSpacing": "-0.02em"}},
                {"id": uid("cta-p"), "type": "paragraph", "content": "Join 10,000+ teams already using our platform. Start your free trial today.", "position": {"x": 240, "y": 156}, "style": {"fontSize": "19px", "color": t["sub"], "maxWidth": "600px", "textAlign": "center"}},
                {"id": uid("cta-btn1"), "type": "button", "content": "Start Free Trial", "position": {"x": 380, "y": 230}, "style": {"backgroundColor": t["accent"], "color": "#ffffff", "padding": "16px 40px", "borderRadius": "12px", "fontSize": "17px", "fontWeight": 700}},
                {"id": uid("cta-note"), "type": "paragraph", "content": "No credit card required. Cancel anytime.", "position": {"x": 380, "y": 296}, "style": {"fontSize": "13px", "color": t["sub"], "maxWidth": "300px", "textAlign": "center"}},
            ]
        },
        # 10. FOOTER
        {
            "id": uid("footer"), "type": "footer",
            "style": {"backgroundColor": "#0f172a", "padding": "0"},
            "elements": [
                {"id": uid("ft-logo"), "type": "heading", "content": pn, "position": {"x": 40, "y": 40}, "style": {"fontSize": "20px", "fontWeight": 800, "color": "#f8fafc"}},
                {"id": uid("ft-desc"), "type": "paragraph", "content": pd, "position": {"x": 40, "y": 76}, "style": {"fontSize": "14px", "color": "#64748b", "maxWidth": "300px", "lineHeight": "1.5"}},
                {"id": uid("ft-h1"), "type": "heading", "content": "Product", "position": {"x": 440, "y": 40}, "style": {"fontSize": "14px", "fontWeight": 700, "color": "#e2e8f0"}},
                {"id": uid("ft-l1"), "type": "paragraph", "content": "Features\nPricing\nIntegrations\nChangelog", "position": {"x": 440, "y": 70}, "style": {"fontSize": "14px", "color": "#64748b", "lineHeight": "2"}},
                {"id": uid("ft-h2"), "type": "heading", "content": "Company", "position": {"x": 620, "y": 40}, "style": {"fontSize": "14px", "fontWeight": 700, "color": "#e2e8f0"}},
                {"id": uid("ft-l2"), "type": "paragraph", "content": "About\nCareers\nBlog\nContact", "position": {"x": 620, "y": 70}, "style": {"fontSize": "14px", "color": "#64748b", "lineHeight": "2"}},
                {"id": uid("ft-h3"), "type": "heading", "content": "Legal", "position": {"x": 800, "y": 40}, "style": {"fontSize": "14px", "fontWeight": 700, "color": "#e2e8f0"}},
                {"id": uid("ft-l3"), "type": "paragraph", "content": "Privacy\nTerms\nSecurity", "position": {"x": 800, "y": 70}, "style": {"fontSize": "14px", "color": "#64748b", "lineHeight": "2"}},
                {"id": uid("ft-copy"), "type": "paragraph", "content": f"2026 {pn}. All rights reserved.", "position": {"x": 40, "y": 200}, "style": {"fontSize": "13px", "color": "#475569"}},
            ]
        },
    ]

    # Add form section if user requested it
    if has_form_request:
        form_section = {
            "id": uid("form-sec"), "type": "custom",
            "style": {"backgroundColor": t["alt_bg"], "padding": "0"},
            "elements": [
                {"id": uid("form-h"), "type": "heading", "content": "We'd love your feedback", "position": {"x": 260, "y": 48}, "style": {"fontSize": "38px", "fontWeight": 800, "color": "#0f172a", "textAlign": "center", "maxWidth": "600px"}},
                {"id": uid("form-sub"), "type": "paragraph", "content": "Help us improve by sharing your thoughts. Every response matters.", "position": {"x": 280, "y": 112}, "style": {"fontSize": "17px", "color": "#64748b", "textAlign": "center", "maxWidth": "500px"}},
                {"id": uid("form-el"), "type": "form", "content": {
                    "fields": [
                        {"label": "Full Name", "type": "text", "placeholder": "Enter your name"},
                        {"label": "Email Address", "type": "email", "placeholder": "you@example.com"},
                        {"label": "Your Feedback", "type": "textarea", "placeholder": "Tell us what you think..."},
                    ],
                    "submitText": "Submit Feedback"
                }, "position": {"x": 280, "y": 180}, "style": {"padding": "32px", "backgroundColor": "#ffffff", "borderRadius": "16px", "maxWidth": "480px", "boxShadow": "0 8px 24px rgba(0,0,0,0.08)", "buttonBackgroundColor": t["accent"], "buttonTextColor": "#ffffff", "inputBackgroundColor": "#f8fafc", "inputTextColor": "#111827", "inputBorderColor": "#e2e8f0"}},
            ]
        }
        # Insert before footer (last section)
        sections.insert(-1, form_section)

    return {"title": f"{pn} Landing Page", "sections": sections}


async def try_store_generated_page(doc: Dict[str, Any]) -> None:
    if db is None:
        return
    try:
        await db.generated_pages.insert_one(doc)
    except Exception as e:
        logger.warning(f"Skipping Mongo persistence: {e}")


@api_router.post("/generate-page")
async def generate_page(request: GeneratePageRequest):
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    context = resolve_generation_context(request)
    variant_hint = request.variant_hint or str(uuid.uuid4())
    variant_index = compute_variant_index(request.prompt, context, variant_hint)

    try:
        page_data, generator_used = await generate_with_ai(request.prompt, context, variant_index)
    except Exception as ai_error:
        logger.warning(f"AI generation failed, using fallback: {ai_error}")
        page_data = local_fallback_page(request.prompt, context, variant_index)
        generator_used = "fallback"

    # Post-process: ensure all elements have positions and IDs
    for section in page_data.get("sections", []):
        for idx, el in enumerate(section.get("elements", [])):
            if "position" not in el or not isinstance(el.get("position"), dict):
                el["position"] = {"x": 64, "y": 48 + idx * 100}
            if "id" not in el:
                el["id"] = f"el-{uuid.uuid4().hex[:8]}"
        if "id" not in section:
            section["id"] = f"sec-{uuid.uuid4().hex[:8]}"

    doc = {
        "id": str(uuid.uuid4()),
        "prompt": request.prompt,
        "meta": {**context, "variant_index": variant_index, "variant_hint": variant_hint, "generator": generator_used},
        "page": page_data,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await try_store_generated_page(doc)

    return {"page": page_data, "meta": doc["meta"]}


@api_router.get("/")
async def root():
    return {"message": "FlowState Builder API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()
