from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import hashlib
import asyncio
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

STOCK_IMAGES_BY_CATEGORY = {
    "technology": [
        "https://images.pexels.com/photos/7414218/pexels-photo-7414218.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/7679642/pexels-photo-7679642.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80",
    ],
    "food": [
        "https://images.unsplash.com/photo-1762922425226-8cfe6987e7b0?w=800&q=80",
        "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80",
    ],
    "fitness": [
        "https://images.unsplash.com/photo-1666979290090-dde24b4614bb?w=800&q=80",
        "https://images.pexels.com/photos/3768730/pexels-photo-3768730.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    "realestate": [
        "https://images.unsplash.com/photo-1758551472051-168a35343bef?w=800&q=80",
        "https://images.pexels.com/photos/7641856/pexels-photo-7641856.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    "business": [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    ],
    "creative": [
        "https://images.pexels.com/photos/1181346/pexels-photo-1181346.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80",
    ],
    "education": [
        "https://images.unsplash.com/photo-1759922378123-a1f4f1e39bae?w=800&q=80",
        "https://images.pexels.com/photos/3231359/pexels-photo-3231359.jpeg?auto=compress&cs=tinysrgb&w=800",
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


def pick_image_set(page_type: str, variant_index: int) -> List[str]:
    category_by_type = {
        "lead_generation": "business",
        "product_info": "technology",
        "webinar_registration": "education",
        "saas": "technology",
    }
    category = category_by_type.get(page_type, "business")
    imgs = STOCK_IMAGES_BY_CATEGORY.get(category, STOCK_IMAGES_BY_CATEGORY["business"])
    if not imgs:
        return []
    offset = variant_index % len(imgs)
    return imgs[offset:] + imgs[:offset]


def local_fallback_page(prompt: str, context: Dict[str, str], variant_index: int) -> Dict[str, Any]:
    images = pick_image_set(context["page_type"], variant_index)
    product_name = context["product_name"]
    product_description = context["product_description"]
    audience = context["audience"]
    theme_variants = [
        {"hero_bg": "#0b1220", "hero_text": "#f8fafc", "hero_sub": "#cbd5e1", "accent": "#7c3aed", "surface": "#ffffff", "surface_alt": "#f8fafc"},
        {"hero_bg": "#111827", "hero_text": "#f9fafb", "hero_sub": "#d1d5db", "accent": "#2563eb", "surface": "#ffffff", "surface_alt": "#f3f4f6"},
        {"hero_bg": "#1f1134", "hero_text": "#faf5ff", "hero_sub": "#e9d5ff", "accent": "#db2777", "surface": "#ffffff", "surface_alt": "#faf5ff"},
        {"hero_bg": "#0a0f1c", "hero_text": "#f8fafc", "hero_sub": "#dbeafe", "accent": "#6366f1", "surface": "#ffffff", "surface_alt": "#eef2ff"},
    ]
    theme = theme_variants[variant_index]
    cta_copy = ["Start Free Trial", "Get Demo", "Generate My Page", "Launch Faster"][variant_index]

    return {
        "title": f"{product_name} Landing Page",
        "sections": [
            {
                "id": f"hero-{uuid.uuid4().hex[:6]}",
                "type": "hero",
                "style": {"backgroundColor": theme["hero_bg"], "padding": "0"},
                "elements": [
                    {"id": f"h-{uuid.uuid4().hex[:6]}", "type": "heading", "content": f"Turn more visitors into pipeline with {product_name}", "position": {"x": 64, "y": 72}, "style": {"fontSize": "52px", "fontWeight": 800, "color": theme["hero_text"], "lineHeight": "1.08", "maxWidth": "560px", "textAlign": "left"}},
                    {"id": f"p-{uuid.uuid4().hex[:6]}", "type": "paragraph", "content": f"{product_description} Built for {audience.lower()}.", "position": {"x": 64, "y": 220}, "style": {"fontSize": "18px", "color": theme["hero_sub"], "lineHeight": "1.65", "maxWidth": "520px", "textAlign": "left"}},
                    {"id": f"btn-{uuid.uuid4().hex[:6]}", "type": "button", "content": cta_copy, "position": {"x": 64, "y": 310}, "style": {"backgroundColor": theme["accent"], "color": "#ffffff", "padding": "14px 28px", "borderRadius": "14px", "fontSize": "16px", "fontWeight": "700"}},
                    {"id": f"btn2-{uuid.uuid4().hex[:6]}", "type": "button", "content": "Book a Demo", "position": {"x": 260, "y": 310}, "style": {"backgroundColor": "transparent", "color": theme["hero_sub"], "padding": "14px 28px", "borderRadius": "14px", "fontSize": "16px", "fontWeight": "600", "border": "1px solid #475569"}},
                    {"id": f"img-{uuid.uuid4().hex[:6]}", "type": "image", "content": {"src": images[0] if images else "", "alt": "Hero preview"}, "position": {"x": 600, "y": 72}, "style": {"maxWidth": "480px", "borderRadius": "18px", "boxShadow": "0 18px 40px rgba(0,0,0,0.25)"}},
                ]
            },
            {
                "id": f"social-{uuid.uuid4().hex[:6]}",
                "type": "testimonials",
                "style": {"backgroundColor": theme["surface"], "padding": "0"},
                "elements": [
                    {"id": f"h2-{uuid.uuid4().hex[:6]}", "type": "heading", "content": "Trusted by modern teams shipping fast", "position": {"x": 200, "y": 48}, "style": {"fontSize": "36px", "fontWeight": 700, "color": "#101828", "textAlign": "center", "maxWidth": "700px"}},
                    {"id": f"p2-{uuid.uuid4().hex[:6]}", "type": "paragraph", "content": "Chosen by teams at fast-moving B2B brands.", "position": {"x": 240, "y": 120}, "style": {"fontSize": "18px", "color": "#475467", "maxWidth": "600px", "textAlign": "center"}},
                ]
            },
            {
                "id": f"feat-{uuid.uuid4().hex[:6]}",
                "type": "features",
                "style": {"backgroundColor": theme["surface_alt"], "padding": "0"},
                "elements": [
                    {"id": f"h3-{uuid.uuid4().hex[:6]}", "type": "heading", "content": "Everything you need to convert at scale", "position": {"x": 160, "y": 56}, "style": {"fontSize": "40px", "fontWeight": 800, "color": "#0f172a", "textAlign": "center", "maxWidth": "800px"}},
                    {"id": f"f1-{uuid.uuid4().hex[:6]}", "type": "paragraph", "content": "Smart personalization: adapt headlines and offers by audience segment.", "position": {"x": 72, "y": 160}, "style": {"fontSize": "17px", "color": "#344054", "padding": "16px", "backgroundColor": "#ffffff", "borderRadius": "14px", "maxWidth": "480px"}},
                    {"id": f"f2-{uuid.uuid4().hex[:6]}", "type": "paragraph", "content": "Conversion analytics: see where users drop and optimize in minutes.", "position": {"x": 580, "y": 160}, "style": {"fontSize": "17px", "color": "#344054", "padding": "16px", "backgroundColor": "#ffffff", "borderRadius": "14px", "maxWidth": "480px"}},
                    {"id": f"f3-{uuid.uuid4().hex[:6]}", "type": "paragraph", "content": "Fast experimentation: launch variants and measure lift confidently.", "position": {"x": 72, "y": 280}, "style": {"fontSize": "17px", "color": "#344054", "padding": "16px", "backgroundColor": "#ffffff", "borderRadius": "14px", "maxWidth": "480px"}},
                ]
            },
            {
                "id": f"cta-{uuid.uuid4().hex[:6]}",
                "type": "cta",
                "style": {"backgroundColor": theme["hero_bg"], "padding": "0"},
                "elements": [
                    {"id": f"h8-{uuid.uuid4().hex[:6]}", "type": "heading", "content": f"Ready to accelerate growth with {product_name}?", "position": {"x": 160, "y": 56}, "style": {"fontSize": "40px", "fontWeight": 800, "color": theme["hero_text"], "maxWidth": "800px", "textAlign": "center"}},
                    {"id": f"p8-{uuid.uuid4().hex[:6]}", "type": "paragraph", "content": "Launch your conversion-first landing page today.", "position": {"x": 240, "y": 140}, "style": {"fontSize": "19px", "color": theme["hero_sub"], "maxWidth": "600px", "textAlign": "center"}},
                    {"id": f"btn8-{uuid.uuid4().hex[:6]}", "type": "button", "content": "Get Started Now", "position": {"x": 440, "y": 210}, "style": {"backgroundColor": theme["accent"], "color": "#ffffff", "padding": "14px 30px", "borderRadius": "14px", "fontSize": "16px", "fontWeight": "700"}},
                ]
            }
        ]
    }


def normalize_json_text(response_text: str) -> str:
    cleaned = (response_text or "").strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1]).strip()
    if cleaned.lower().startswith("json"):
        cleaned = cleaned[4:].strip()
    return cleaned


async def generate_with_ai(prompt: str, context: Dict[str, str], variant_index: int) -> tuple:
    """Generate a landing page using emergentintegrations LLM."""
    emergent_key = os.environ.get("EMERGENT_LLM_KEY")
    if not emergent_key:
        raise RuntimeError("No EMERGENT_LLM_KEY configured")

    from emergentintegrations.llm.chat import LlmChat, UserMessage

    all_images_json = json.dumps(STOCK_IMAGES_BY_CATEGORY, indent=2)

    system_prompt = f"""You are an expert conversion-focused web designer AI.
Generate a modern, premium landing page structure as JSON based on the user's brief.

Return ONLY a valid JSON object (no markdown, no code blocks, no explanation) with this EXACT structure:
{{
  "title": "Page Title",
  "sections": [
    {{
      "id": "unique-id",
      "type": "hero|features|about|testimonials|cta|footer|team|pricing|stats",
      "style": {{"backgroundColor": "#hex", "padding": "0"}},
      "elements": [
        {{
          "id": "unique-element-id",
          "type": "heading|paragraph|image|button",
          "content": "text string" or {{"src": "image-url", "alt": "description"}},
          "position": {{"x": number, "y": number}},
          "style": {{...CSS properties as key-value pairs...}}
        }}
      ]
    }}
  ]
}}

CRITICAL RULES:
1. Generate 5-8 sections: hero, social proof, features, how-it-works, pricing (optional), faq, final cta
2. Each section: 2-6 elements
3. Every element MUST have a "position" field with x,y coordinates for free-flow placement
4. Position x ranges from 24 to 1060, y ranges from 32 to 600 within each section
5. For hero sections: place heading at ~(64,72), subtext at ~(64,200), buttons at ~(64,300), image at ~(600,72)
6. For centered sections: center elements with x around 200-400
7. Use DIFFERENT x,y values so elements don't overlap
8. For images, pick from this library:
{all_images_json}
9. Image content format: {{"src": "url", "alt": "description"}}
10. Button/heading/paragraph content is a string
11. Use realistic professional content matching the prompt
12. Use cohesive modern color system
13. All IDs must be unique lowercase alphanumeric with dashes
14. Section padding should be "0" (elements are absolutely positioned)
15. Return ONLY the JSON object"""

    user_prompt = f"""Create a landing page:

Page Type: {context["page_type"]}
Target Audience: {context["audience"]}
Product: {context["product_name"]}
Description: {context["product_description"]}
Layout variation: {variant_index + 1} of 4

Additional: {prompt[:500]}"""

    chat = LlmChat(
        api_key=emergent_key,
        session_id=f"page-gen-{uuid.uuid4().hex[:8]}",
        system_message=system_prompt,
    ).with_model("openai", "gpt-4o")

    user_message = UserMessage(text=user_prompt)
    response = await chat.send_message(user_message)
    response_text = str(response or "")
    cleaned = normalize_json_text(response_text)
    page_data = json.loads(cleaned)
    return page_data, "emergent:gpt-4o"


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

    # Ensure all elements have positions
    for section in page_data.get("sections", []):
        for idx, el in enumerate(section.get("elements", [])):
            if "position" not in el or not isinstance(el.get("position"), dict):
                el["position"] = {"x": 64, "y": 48 + idx * 120}
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
