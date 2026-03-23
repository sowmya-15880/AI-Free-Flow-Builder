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
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')
client = AsyncIOMotorClient(mongo_url) if mongo_url and db_name else None
db = client[db_name] if client and db_name else None

app = FastAPI()
api_router = APIRouter(prefix="/api")

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
        "https://images.unsplash.com/photo-1667388968900-4dc428fedb8c?w=800&q=80",
        "https://images.unsplash.com/photo-1667388968964-4aa652df0a9b?w=800&q=80",
    ],
    "fitness": [
        "https://images.unsplash.com/photo-1666979290090-dde24b4614bb?w=800&q=80",
        "https://images.unsplash.com/photo-1666979289446-6e9ebb257091?w=800&q=80",
        "https://images.pexels.com/photos/12250460/pexels-photo-12250460.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/3768730/pexels-photo-3768730.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    "realestate": [
        "https://images.unsplash.com/photo-1758551472051-168a35343bef?w=800&q=80",
        "https://images.pexels.com/photos/7641856/pexels-photo-7641856.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.unsplash.com/photo-1762195804027-04a19d9d3ab6?w=800&q=80",
        "https://images.unsplash.com/photo-1737233479849-f924c595dd6f?w=800&q=80",
    ],
    "business": [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
    ],
    "creative": [
        "https://images.pexels.com/photos/1181346/pexels-photo-1181346.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/6224/hands-people-woman-working.jpg?auto=compress&cs=tinysrgb&w=800",
        "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80",
        "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80",
    ],
    "education": [
        "https://images.unsplash.com/photo-1759922378123-a1f4f1e39bae?w=800&q=80",
        "https://images.unsplash.com/photo-1758270704384-9df36d94a29d?w=800&q=80",
        "https://images.pexels.com/photos/3231359/pexels-photo-3231359.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://images.pexels.com/photos/8423012/pexels-photo-8423012.jpeg?auto=compress&cs=tinysrgb&w=800",
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


def build_modern_generation_brief(user_prompt: str, context: Dict[str, str]) -> str:
    return f"""Create a modern, high-quality, conversion-focused landing page.

Design Style:
- Clean, minimal, premium
- Inspired by Stripe, Linear, Vercel, Apple, Notion
- Large bold typography
- Generous whitespace
- Smooth scrolling sections
- Rounded corners (12-16px)
- Subtle shadows and soft glow effects
- Professional UI spacing (8px grid system)

Color System:
- Neutral base (white or deep charcoal)
- One primary accent gradient (blue -> purple or purple -> pink)
- Subtle hover animations
- Micro-interactions on buttons and cards

Structure:
1. Hero Section
2. Social Proof
3. Features Section
4. Problem -> Solution Section
5. How It Works
6. Pricing or Plans (if applicable)
7. FAQ Section
8. Final CTA Section

Tone:
Clear, confident, modern, benefit-driven.
Avoid fluff. Focus on clarity and value.

Selected Page Type:
{context["page_type"]}

Target Audience:
{context["audience"]}

Product/Service:
Name: {context["product_name"]}
Description: {context["product_description"]}

Additional requirements from user:
{user_prompt}
"""


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
    audience = context["audience"]
    product_name = context["product_name"]
    product_description = context["product_description"]
    theme_variants = [
        {
            "hero_bg": "#0b1220",
            "hero_text": "#f8fafc",
            "hero_sub": "#cbd5e1",
            "accent": "#7c3aed",
            "accent_soft": "#ede9fe",
            "surface": "#ffffff",
            "surface_alt": "#f8fafc",
        },
        {
            "hero_bg": "#111827",
            "hero_text": "#f9fafb",
            "hero_sub": "#d1d5db",
            "accent": "#2563eb",
            "accent_soft": "#dbeafe",
            "surface": "#ffffff",
            "surface_alt": "#f3f4f6",
        },
        {
            "hero_bg": "#1f1134",
            "hero_text": "#faf5ff",
            "hero_sub": "#e9d5ff",
            "accent": "#db2777",
            "accent_soft": "#fce7f3",
            "surface": "#ffffff",
            "surface_alt": "#faf5ff",
        },
        {
            "hero_bg": "#0a0f1c",
            "hero_text": "#f8fafc",
            "hero_sub": "#dbeafe",
            "accent": "#6366f1",
            "accent_soft": "#e0e7ff",
            "surface": "#ffffff",
            "surface_alt": "#eef2ff",
        },
    ]
    theme = theme_variants[variant_index]
    layout_variant = variant_index + 1
    cta_copy = ["Start Free Trial", "Get Demo", "Generate My Page", "Launch Faster"][variant_index]
    social_line = [
        "Trusted by 2,400+ growth teams worldwide.",
        "Chosen by teams at fast-moving B2B brands.",
        "Backed by operators scaling from 0 to 1.",
        "Adopted by modern marketing organizations.",
    ][variant_index]
    faq_lines = [
        "How fast can we launch?",
        "Can we personalize by audience?",
        "Does this integrate with CRM and forms?",
        "Can we run experiments and compare variants?",
    ]

    return {
        "title": f"{product_name} | Variant {layout_variant} Landing Page",
        "sections": [
            {
                "id": "hero-1",
                "type": "hero",
                "style": {
                    "backgroundColor": theme["hero_bg"],
                    "padding": "104px 20px 88px",
                    "textAlign": "center" if variant_index % 2 == 0 else "left"
                },
                "elements": [
                    {"id": "h-1", "type": "heading", "content": f"Turn more visitors into qualified pipeline with {product_name}", "style": {"fontSize": "62px", "fontWeight": 800, "color": theme["hero_text"], "lineHeight": "1.08", "maxWidth": "980px", "margin": "0 auto", "padding": "0 12px", "textAlign": "center" if variant_index % 2 == 0 else "left"}},
                    {"id": "p-1", "type": "paragraph", "content": f"{product_description} Built for {audience.lower()} who need premium performance without complexity.", "style": {"fontSize": "20px", "color": theme["hero_sub"], "lineHeight": "1.65", "maxWidth": "760px", "margin": "18px auto 0", "textAlign": "center" if variant_index % 2 == 0 else "left"}},
                    {"id": "btn-1", "type": "button", "content": cta_copy, "style": {"backgroundColor": theme["accent"], "color": "#ffffff", "padding": "14px 28px", "borderRadius": "14px", "fontSize": "16px", "fontWeight": "700", "margin": "28px auto 0", "display": "inline-block"}},
                    {"id": "btn-2", "type": "button", "content": "Book a Demo", "style": {"backgroundColor": "transparent", "color": theme["hero_sub"], "padding": "14px 28px", "borderRadius": "14px", "fontSize": "16px", "fontWeight": "600", "border": "1px solid #475569", "margin": "12px auto 0", "display": "inline-block"}},
                    {"id": "img-hero", "type": "image", "content": {"src": images[0] if images else "", "alt": "Hero preview mockup"}, "style": {"width": "100%", "maxWidth": "920px", "display": "block", "margin": "40px auto 0", "borderRadius": "16px"}}
                ]
            },
            {
                "id": "social-proof-1",
                "type": "testimonials",
                "style": {"backgroundColor": theme["surface"], "padding": "56px 20px", "textAlign": "center"},
                "elements": [
                    {"id": "h-2", "type": "heading", "content": "Trusted by modern teams shipping fast", "style": {"fontSize": "36px", "fontWeight": 700, "color": "#101828"}},
                    {"id": "p-2", "type": "paragraph", "content": social_line, "style": {"fontSize": "18px", "color": "#475467", "maxWidth": "760px", "margin": "10px auto 0"}},
                    {"id": "logo-strip", "type": "paragraph", "content": "Aster • Vento • Orbital • Horizon • Northstar", "style": {"fontSize": "15px", "color": "#667085", "letterSpacing": "0.08em", "margin": "24px auto 0"}}
                ]
            },
            {
                "id": "features-1",
                "type": "features",
                "style": {"backgroundColor": theme["surface_alt"], "padding": "82px 20px", "textAlign": "left"},
                "elements": [
                    {"id": "h-3", "type": "heading", "content": "Everything you need to convert at scale", "style": {"fontSize": "44px", "fontWeight": 800, "color": "#0f172a", "textAlign": "center", "maxWidth": "840px", "margin": "0 auto 12px"}},
                    {"id": "p-3", "type": "paragraph", "content": "From first click to qualified opportunity, every step is designed to remove friction.", "style": {"fontSize": "18px", "color": "#475467", "textAlign": "center", "maxWidth": "760px", "margin": "0 auto 34px"}},
                    {"id": "f-1", "type": "paragraph", "content": "Smart personalization: adapt headlines and offers by audience segment.", "style": {"fontSize": "17px", "color": "#344054", "padding": "16px", "backgroundColor": "#ffffff", "borderRadius": "14px", "margin": "0 auto 12px", "maxWidth": "820px"}},
                    {"id": "f-2", "type": "paragraph", "content": "Conversion analytics: see where users drop and optimize in minutes.", "style": {"fontSize": "17px", "color": "#344054", "padding": "16px", "backgroundColor": "#ffffff", "borderRadius": "14px", "margin": "0 auto 12px", "maxWidth": "820px"}},
                    {"id": "f-3", "type": "paragraph", "content": "Fast experimentation: launch variants and measure lift confidently.", "style": {"fontSize": "17px", "color": "#344054", "padding": "16px", "backgroundColor": "#ffffff", "borderRadius": "14px", "margin": "0 auto", "maxWidth": "820px"}}
                ]
            },
            {
                "id": "problem-solution-1",
                "type": "about",
                "style": {"backgroundColor": "#ffffff", "padding": "82px 20px", "textAlign": "left"},
                "elements": [
                    {"id": "h-4", "type": "heading", "content": "Most teams lose demand due to slow execution", "style": {"fontSize": "40px", "fontWeight": 800, "color": "#101828", "maxWidth": "900px"}},
                    {"id": "p-4", "type": "paragraph", "content": "Scattered tools, weak messaging, and delayed launches kill conversion momentum.", "style": {"fontSize": "18px", "color": "#475467", "maxWidth": "900px", "lineHeight": "1.7", "margin": "10px 0 20px"}},
                    {"id": "p-5", "type": "paragraph", "content": f"{product_name} centralizes strategy, content, and optimization into one conversion engine.", "style": {"fontSize": "20px", "color": "#1d2939", "maxWidth": "900px", "fontWeight": "600"}}
                ]
            },
            {
                "id": "how-it-works-1",
                "type": "stats",
                "style": {"backgroundColor": theme["hero_bg"], "padding": "78px 20px", "textAlign": "center"},
                "elements": [
                    {"id": "h-5", "type": "heading", "content": "How it works", "style": {"fontSize": "40px", "fontWeight": 800, "color": theme["hero_text"]}},
                    {"id": "s-1", "type": "paragraph", "content": "1) Define your target audience and offer", "style": {"fontSize": "17px", "color": theme["hero_sub"], "padding": "12px 14px", "border": "1px solid #334155", "borderRadius": "12px", "maxWidth": "760px", "margin": "18px auto 10px"}},
                    {"id": "s-2", "type": "paragraph", "content": "2) Generate and customize high-converting sections", "style": {"fontSize": "17px", "color": theme["hero_sub"], "padding": "12px 14px", "border": "1px solid #334155", "borderRadius": "12px", "maxWidth": "760px", "margin": "0 auto 10px"}},
                    {"id": "s-3", "type": "paragraph", "content": "3) Launch, test variants, and optimize for revenue", "style": {"fontSize": "17px", "color": theme["hero_sub"], "padding": "12px 14px", "border": "1px solid #334155", "borderRadius": "12px", "maxWidth": "760px", "margin": "0 auto"}}
                ]
            },
            {
                "id": "pricing-1",
                "type": "pricing",
                "style": {"backgroundColor": theme["surface"], "padding": "86px 20px", "textAlign": "center"},
                "elements": [
                    {"id": "h-6", "type": "heading", "content": "Simple plans for ambitious teams", "style": {"fontSize": "40px", "fontWeight": 800, "color": "#0f172a"}},
                    {"id": "price-1", "type": "paragraph", "content": "Starter - $49/mo: core builder + lead capture", "style": {"fontSize": "17px", "color": "#344054", "padding": "16px", "backgroundColor": "#f8fafc", "borderRadius": "14px", "maxWidth": "760px", "margin": "18px auto 10px"}},
                    {"id": "price-2", "type": "paragraph", "content": "Growth - $129/mo (Recommended): advanced optimization + analytics", "style": {"fontSize": "17px", "color": "#111827", "padding": "16px", "backgroundColor": theme["accent_soft"], "borderRadius": "14px", "maxWidth": "760px", "margin": "0 auto 10px"}},
                    {"id": "price-3", "type": "paragraph", "content": "Scale - Custom: dedicated onboarding and enterprise controls", "style": {"fontSize": "17px", "color": "#344054", "padding": "16px", "backgroundColor": "#f8fafc", "borderRadius": "14px", "maxWidth": "760px", "margin": "0 auto"}}
                ]
            },
            {
                "id": "faq-1",
                "type": "team",
                "style": {"backgroundColor": "#f8fafc", "padding": "78px 20px", "textAlign": "left"},
                "elements": [
                    {"id": "h-7", "type": "heading", "content": "Frequently asked questions", "style": {"fontSize": "38px", "fontWeight": 800, "color": "#0f172a", "textAlign": "center"}},
                    {"id": "q1", "type": "paragraph", "content": faq_lines[(variant_index + 0) % 4] + " Most teams ship their first page within a day.", "style": {"fontSize": "17px", "color": "#344054", "padding": "14px", "backgroundColor": "#ffffff", "borderRadius": "12px", "maxWidth": "860px", "margin": "16px auto 10px"}},
                    {"id": "q2", "type": "paragraph", "content": faq_lines[(variant_index + 1) % 4] + " Yes. Create and compare variants with clear insights.", "style": {"fontSize": "17px", "color": "#344054", "padding": "14px", "backgroundColor": "#ffffff", "borderRadius": "12px", "maxWidth": "860px", "margin": "0 auto 10px"}},
                    {"id": "q3", "type": "paragraph", "content": faq_lines[(variant_index + 2) % 4] + " It integrates with your CRM, forms, and analytics tools.", "style": {"fontSize": "17px", "color": "#344054", "padding": "14px", "backgroundColor": "#ffffff", "borderRadius": "12px", "maxWidth": "860px", "margin": "0 auto"}}
                ]
            },
            {
                "id": "final-cta-1",
                "type": "cta",
                "style": {"backgroundColor": theme["accent_soft"], "padding": "90px 20px", "textAlign": "center"},
                "elements": [
                    {"id": "h-8", "type": "heading", "content": f"Ready to accelerate growth with {product_name}?", "style": {"fontSize": "44px", "fontWeight": 800, "color": "#111827", "maxWidth": "900px", "margin": "0 auto"}},
                    {"id": "p-8", "type": "paragraph", "content": "Launch your conversion-first landing page today and start capturing better pipeline.", "style": {"fontSize": "19px", "color": "#4b5563", "maxWidth": "760px", "margin": "14px auto 0"}},
                    {"id": "btn-8", "type": "button", "content": "Get Started Now", "style": {"backgroundColor": theme["accent"], "color": "#ffffff", "padding": "14px 30px", "borderRadius": "14px", "fontSize": "16px", "fontWeight": "700", "margin": "28px auto 0", "display": "inline-block"}}
                ]
            }
        ]
    }


def generate_with_local_test_agent(prompt: str, context: Dict[str, str], variant_index: int) -> tuple[Dict[str, Any], str]:
    # No external API usage: deterministic but varied "agent-like" generation for testing UX flows.
    page_data = local_fallback_page(prompt, context, variant_index)
    sections = page_data.get("sections", [])
    tone_pack = [
        ("Conversion OS for fast-moving teams", "Ship high-converting pages in minutes, not weeks."),
        ("Design and launch pages at startup speed", "Bring strategy, copy, and layout into one build loop."),
        ("From prompt to publish-ready page", "Generate, customize, and publish without layout friction."),
        ("Modern landing pages with AI precision", "Create responsive pages that look polished on every device."),
    ][variant_index % 4]
    if sections and sections[0].get("elements"):
        hero_elements = sections[0]["elements"]
        for el in hero_elements:
            if el.get("type") == "heading":
                el["content"] = f"{tone_pack[0]} with {context.get('product_name', 'your product')}"
                break
        for el in hero_elements:
            if el.get("type") == "paragraph":
                el["content"] = tone_pack[1]
                break
    return page_data, "local-test-agent"


def canonical_section_type(raw_type: str) -> str:
    t = (raw_type or "").lower()
    if t in {"hero"}:
        return "hero"
    if t in {"testimonials", "logos"}:
        return "social"
    if t in {"features"}:
        return "features"
    if t in {"about", "problem", "solution"}:
        return "problem-solution"
    if t in {"stats", "how-it-works", "workflow"}:
        return "how-it-works"
    if t in {"pricing", "plans"}:
        return "pricing"
    if t in {"team", "faq"}:
        return "faq"
    if t in {"cta", "footer"}:
        return "final-cta"
    return t


def parse_px(value: Any, default: float) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        m = re.search(r"(-?\d+(?:\.\d+)?)", value)
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                return default
    return default


def parse_line_height(value: Any, font_size: float, default_multiplier: float) -> float:
    if isinstance(value, (int, float)):
        v = float(value)
        if v <= 10:
            return max(font_size * v, font_size * 1.0)
        return v
    if isinstance(value, str):
        s = value.strip().lower()
        if s.endswith("px"):
            return max(parse_px(s, font_size * default_multiplier), font_size * 1.0)
        try:
            v = float(s)
            if v <= 10:
                return max(font_size * v, font_size * 1.0)
            return v
        except ValueError:
            pass
    return font_size * default_multiplier


def estimate_element_size(element: Dict[str, Any], fallback_width: float = 760) -> Dict[str, float]:
    style = element.get("style", {}) or {}
    el_type = (element.get("type") or "").lower()
    content = element.get("content", "")

    width = fallback_width
    if isinstance(style.get("maxWidth"), (int, float, str)):
        width = max(120.0, min(fallback_width, parse_px(style.get("maxWidth"), fallback_width)))
    if isinstance(style.get("width"), (int, float)):
        width = max(120.0, min(fallback_width, float(style["width"])))

    if el_type == "button":
        padding_y = parse_px(style.get("padding", "12px"), 12.0)
        font_size = parse_px(style.get("fontSize"), 16.0)
        text_len = len(str(content)) if content is not None else 10
        est_width = min(360.0, max(140.0, text_len * (font_size * 0.55) + 56))
        est_height = max(44.0, (padding_y * 2) + (font_size * 1.25))
        return {"width": est_width, "height": est_height}

    if el_type == "image":
        image_width = parse_px(style.get("maxWidth"), parse_px(style.get("width"), 520.0))
        image_width = max(180.0, min(560.0, image_width))
        image_height = parse_px(style.get("height"), image_width * 0.62)
        image_height = max(140.0, min(520.0, image_height))
        return {"width": image_width, "height": image_height}

    font_size = parse_px(style.get("fontSize"), 16.0)
    line_height = parse_line_height(style.get("lineHeight"), font_size, 1.15 if el_type == "heading" else 1.6)
    text = str(content) if content is not None else ""
    chars_per_line = max(16.0, width / max(7.0, font_size * (0.52 if el_type == "heading" else 0.5)))
    line_count = max(1.0, min(8.0, (len(text) / chars_per_line) + 1.0))
    base_pad = 22.0 if el_type == "heading" else 18.0
    height = (line_count * line_height) + base_pad
    return {"width": width, "height": max(40.0, min(420.0, height))}


def enforce_unique_ids(page_data: Dict[str, Any]) -> None:
    used: set[str] = set()
    for s_idx, section in enumerate(page_data.get("sections", [])):
        section_id = str(section.get("id") or f"section-{s_idx+1}").strip().lower()
        section_id = re.sub(r"[^a-z0-9-]+", "-", section_id).strip("-") or f"section-{s_idx+1}"
        base = section_id
        i = 2
        while section_id in used:
            section_id = f"{base}-{i}"
            i += 1
        used.add(section_id)
        section["id"] = section_id

        for e_idx, el in enumerate(section.get("elements", [])):
            el_id = str(el.get("id") or f"{section_id}-el-{e_idx+1}").strip().lower()
            el_id = re.sub(r"[^a-z0-9-]+", "-", el_id).strip("-") or f"{section_id}-el-{e_idx+1}"
            base_el = el_id
            j = 2
            while el_id in used:
                el_id = f"{base_el}-{j}"
                j += 1
            used.add(el_id)
            el["id"] = el_id


def apply_rich_composition(page_data: Dict[str, Any], context: Dict[str, str], variant_index: int) -> Dict[str, Any]:
    palettes = [
        {"hero_bg": "#0b1324", "hero_surface": "#111b32", "text_dark": "#0f172a", "text_muted": "#475467", "text_light": "#e5ecff", "accent": "#5b6cff", "accent_2": "#7d4dff", "surface": "#ffffff", "surface_alt": "#eef4ff"},
        {"hero_bg": "#081a33", "hero_surface": "#0d2142", "text_dark": "#0f172a", "text_muted": "#475467", "text_light": "#e3f0ff", "accent": "#00a3ff", "accent_2": "#2563eb", "surface": "#ffffff", "surface_alt": "#edf8ff"},
        {"hero_bg": "#1d1238", "hero_surface": "#291856", "text_dark": "#111827", "text_muted": "#4b5563", "text_light": "#f2e8ff", "accent": "#7c3aed", "accent_2": "#ec4899", "surface": "#ffffff", "surface_alt": "#f8f4ff"},
        {"hero_bg": "#0c142a", "hero_surface": "#152042", "text_dark": "#0f172a", "text_muted": "#475467", "text_light": "#dbeafe", "accent": "#2563eb", "accent_2": "#06b6d4", "surface": "#ffffff", "surface_alt": "#eff6ff"},
    ]
    palette = palettes[variant_index % len(palettes)]
    images = pick_image_set(context["page_type"], variant_index)
    image_cursor = 0

    for section_idx, section in enumerate(page_data.get("sections", [])):
        stype = canonical_section_type(section.get("type", ""))
        section_style = section.setdefault("style", {})
        elements = section.get("elements", [])
        if not elements:
            continue

        if stype in {"hero", "how-it-works"}:
            section_style["backgroundColor"] = palette["hero_bg"]
            section_style["padding"] = "0"
        elif stype in {"features", "pricing", "faq"}:
            section_style["backgroundColor"] = palette["surface_alt"]
            section_style["padding"] = "0"
        elif stype == "final-cta":
            section_style["backgroundColor"] = palette["hero_surface"]
            section_style["padding"] = "0"
        else:
            section_style["backgroundColor"] = palette["surface"]
            section_style["padding"] = "0"

        # Ensure image elements always have a unique URL when possible.
        for el in elements:
            if el.get("type") != "image":
                continue
            if not isinstance(el.get("content"), dict):
                el["content"] = {"src": "", "alt": "Section image"}
            src = (el["content"].get("src") or "").strip()
            if not src and images:
                el["content"]["src"] = images[image_cursor % len(images)]
                image_cursor += 1

        left_x = 64
        right_x = 640
        top_y = 72
        lane_gap = 20

        if stype == "hero":
            heading = [e for e in elements if e.get("type") == "heading"]
            paragraphs = [e for e in elements if e.get("type") == "paragraph"]
            buttons = [e for e in elements if e.get("type") == "button"]
            images_els = [e for e in elements if e.get("type") == "image"]
            rest = [e for e in elements if e not in heading + paragraphs + buttons + images_els]

            left_y = top_y
            for el in heading[:1] + paragraphs[:1]:
                size = estimate_element_size(el, 520)
                el["position"] = {"x": left_x, "y": int(left_y)}
                left_y += size["height"] + lane_gap
                style = el.setdefault("style", {})
                style["maxWidth"] = "560px"
                style["color"] = palette["text_light"]
                style["textAlign"] = "left"
                style["margin"] = "0"

            button_x = left_x
            for el in buttons[:2]:
                size = estimate_element_size(el, 280)
                el["position"] = {"x": int(button_x), "y": int(left_y)}
                button_x += size["width"] + 14
                style = el.setdefault("style", {})
                if style.get("backgroundColor", "").lower() not in {"transparent", "none"}:
                    style["backgroundColor"] = palette["accent"]
                style["color"] = "#ffffff" if style.get("backgroundColor", "").lower() not in {"transparent", "none"} else palette["text_light"]

            if buttons:
                left_y += 64

            for el in paragraphs[1:]:
                size = estimate_element_size(el, 560)
                el["position"] = {"x": left_x, "y": int(left_y)}
                left_y += size["height"] + 14
                style = el.setdefault("style", {})
                style["color"] = palette["text_light"]
                style["maxWidth"] = "560px"
                style["textAlign"] = "left"
                style["margin"] = "0"

            if images_els:
                hero_img = images_els[0]
                size = estimate_element_size(hero_img, 500)
                hero_img["position"] = {"x": right_x, "y": 96}
                img_style = hero_img.setdefault("style", {})
                img_style["maxWidth"] = "500px"
                img_style.setdefault("borderRadius", "18px")
                img_style.setdefault("boxShadow", "0 18px 40px rgba(0,0,0,0.25)")

                flow_y = max(left_y, 96 + size["height"] + 24)
                for el in images_els[1:] + rest:
                    s = estimate_element_size(el, 1020)
                    el["position"] = {"x": left_x, "y": int(flow_y)}
                    flow_y += s["height"] + 14
            else:
                for el in rest:
                    s = estimate_element_size(el, 1020)
                    el["position"] = {"x": left_x, "y": int(left_y)}
                    left_y += s["height"] + 14
            continue

        y = top_y
        intro_count = 2 if len(elements) >= 3 else 1
        intro = elements[:intro_count]
        body = elements[intro_count:]

        for idx, el in enumerate(intro):
            size = estimate_element_size(el, 980 if idx == 0 else 860)
            x = int(max(24, (1120 - size["width"]) / 2))
            el["position"] = {"x": x, "y": int(y)}
            y += size["height"] + (18 if idx == 0 else 22)
            style = el.setdefault("style", {})
            if stype in {"how-it-works", "final-cta"}:
                style["color"] = palette["text_light"]
            elif stype in {"features", "pricing", "faq"}:
                style["color"] = palette["text_dark"] if el.get("type") == "heading" else palette["text_muted"]
            style.setdefault("textAlign", "center")

        if stype in {"features", "pricing"} and len(body) >= 3:
            card_w = 320 if stype == "pricing" else 520
            cols = 3 if stype == "pricing" else 2
            col_x = [72, 400, 728] if cols == 3 else [72, 616]
            row_y = y
            for idx, el in enumerate(body):
                col = idx % cols
                if idx > 0 and col == 0:
                    row_y += 170
                size = estimate_element_size(el, card_w)
                el["position"] = {"x": col_x[col], "y": int(row_y)}
                style = el.setdefault("style", {})
                style.setdefault("maxWidth", f"{card_w}px")
                style.setdefault("backgroundColor", "#ffffff")
                style.setdefault("borderRadius", "14px")
                if stype == "pricing" and idx == 1:
                    style["backgroundColor"] = "#eaf0ff"
                style.setdefault("padding", "16px")
                style["color"] = palette["text_dark"]
                size["height"] = max(size["height"], 140)
            continue

        if stype == "faq":
            for el in body:
                size = estimate_element_size(el, 980)
                el["position"] = {"x": 72, "y": int(y)}
                y += max(size["height"], 92) + 14
                style = el.setdefault("style", {})
                style.setdefault("maxWidth", "980px")
                style.setdefault("backgroundColor", "#ffffff")
                style.setdefault("borderRadius", "12px")
                style.setdefault("padding", "14px")
                style["color"] = palette["text_dark"]
            continue

        for el in body:
            size = estimate_element_size(el, 900)
            x = int(max(24, (1120 - size["width"]) / 2))
            el["position"] = {"x": x, "y": int(y)}
            y += size["height"] + 16
            style = el.setdefault("style", {})
            if stype in {"how-it-works", "final-cta"}:
                style["color"] = palette["text_light"]
            else:
                style["color"] = palette["text_muted"]
            style.setdefault("textAlign", "center")

    enforce_unique_ids(page_data)
    return page_data


def apply_layout_variation_to_page(page_data: Dict[str, Any], context: Dict[str, str], variant_index: int) -> Dict[str, Any]:
    sections = page_data.get("sections", [])
    if not sections:
        return page_data

    layout_orders = [
        ["hero", "social", "features", "problem-solution", "how-it-works", "pricing", "faq", "final-cta"],
        ["hero", "features", "social", "how-it-works", "problem-solution", "pricing", "faq", "final-cta"],
        ["hero", "social", "problem-solution", "features", "pricing", "how-it-works", "faq", "final-cta"],
        ["hero", "features", "pricing", "social", "problem-solution", "how-it-works", "faq", "final-cta"],
    ]
    theme_accents = ["#7c3aed", "#2563eb", "#db2777", "#6366f1"]
    radius_scale = ["12px", "14px", "16px", "12px"]

    order = layout_orders[variant_index % len(layout_orders)]
    rank = {key: i for i, key in enumerate(order)}

    decorated = []
    for idx, section in enumerate(sections):
        key = canonical_section_type(section.get("type", ""))
        decorated.append((rank.get(key, 100 + idx), idx, section))
    decorated.sort(key=lambda x: (x[0], x[1]))
    sorted_sections = [item[2] for item in decorated]

    accent = theme_accents[variant_index % len(theme_accents)]
    for section in sorted_sections:
        for el in section.get("elements", []):
            if el.get("type") == "button":
                style = el.setdefault("style", {})
                if style.get("backgroundColor", "").lower() not in {"transparent", "none"}:
                    style["backgroundColor"] = accent
                style["borderRadius"] = radius_scale[variant_index % len(radius_scale)]
                style.setdefault("padding", "14px 30px")
                style.setdefault("fontWeight", "700")
        style = section.setdefault("style", {})
        if canonical_section_type(section.get("type", "")) in {"features", "pricing", "faq"}:
            style.setdefault("padding", "84px 20px")

    page_data["sections"] = sorted_sections
    page_data["title"] = f'{context["product_name"]} | Layout {variant_index + 1}'
    return apply_rich_composition(page_data, context, variant_index)


def normalize_json_text(response_text: str) -> str:
    cleaned = (response_text or "").strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1]).strip()
    if cleaned.lower().startswith("json"):
        cleaned = cleaned[4:].strip()
    return cleaned


async def generate_with_openai(
    system_prompt: str,
    generation_brief: str,
    variant_index: int,
) -> tuple[Dict[str, Any], str]:
    user_prompt = (
        f"Create a landing page using this brief:\n\n{generation_brief}\n\n"
        f"Layout variation target: {variant_index + 1} of 4. "
        "Ensure this variation has a distinct section arrangement and visual rhythm."
    )
    openai_model = os.environ.get("OPENAI_MODEL", "gpt-4.1")
    openai_key = os.environ.get("OPENAI_API_KEY")

    if openai_key:
        from litellm import acompletion

        response = await asyncio.wait_for(
            acompletion(
                model=openai_model,
                api_key=openai_key,
                temperature=0.35,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            ),
            timeout=24,
        )

        content = response.choices[0].message.content
        if isinstance(content, list):
            response_text = "".join(
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in content
            )
        else:
            response_text = str(content or "")
        return json.loads(normalize_json_text(response_text)), f"openai:{openai_model}"

    raise RuntimeError(
        "No OpenAI credentials configured. Set OPENAI_API_KEY."
    )


async def generate_with_gemini(
    system_prompt: str,
    generation_brief: str,
    variant_index: int,
) -> tuple[Dict[str, Any], str]:
    user_prompt = (
        f"Create a landing page using this brief:\n\n{generation_brief}\n\n"
        f"Layout variation target: {variant_index + 1} of 4. "
        "Ensure this variation has a distinct section arrangement and visual rhythm."
    )
    gemini_model = os.environ.get("GEMINI_MODEL", "gemini/gemini-2.0-flash")
    gemini_key = os.environ.get("GEMINI_API_KEY")

    if gemini_key:
        from litellm import acompletion

        candidate_models: List[str] = []
        for m in [
            gemini_model,
            "gemini/gemini-2.0-flash",
            "gemini/gemini-1.5-flash-latest",
            "gemini/gemini-1.5-pro-latest",
        ]:
            if m and m not in candidate_models:
                candidate_models.append(m)

        last_error: Optional[Exception] = None
        for model_name in candidate_models:
            try:
                response = await asyncio.wait_for(
                    acompletion(
                        model=model_name,
                        api_key=gemini_key,
                        temperature=0.35,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                    ),
                    timeout=24,
                )

                content = response.choices[0].message.content
                if isinstance(content, list):
                    response_text = "".join(
                        part.get("text", "") if isinstance(part, dict) else str(part)
                        for part in content
                    )
                else:
                    response_text = str(content or "")
                return json.loads(normalize_json_text(response_text)), f"gemini:{model_name}"
            except Exception as model_error:
                last_error = model_error
                logger.warning(f"Gemini model {model_name} failed: {model_error}")

        if last_error:
            raise last_error

    raise RuntimeError(
        "No Gemini credentials configured. Set GEMINI_API_KEY."
    )


async def try_store_generated_page(doc: Dict[str, Any]) -> None:
    if db is None:
        return
    try:
        await db.generated_pages.insert_one(doc)
    except Exception as e:
        logger.warning(f"Skipping Mongo persistence (continuing response): {e}")


@api_router.post("/generate-page")
async def generate_page(request: GeneratePageRequest):
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    context = resolve_generation_context(request)
    generation_brief = build_modern_generation_brief(request.prompt, context)
    variant_hint = request.variant_hint or str(uuid.uuid4())
    variant_index = compute_variant_index(request.prompt, context, variant_hint)

    all_images_json = json.dumps(STOCK_IMAGES_BY_CATEGORY, indent=2)

    system_prompt = f"""You are an expert conversion-focused web designer AI.
Generate a modern, premium landing page structure as JSON based on the user's brief.

Return ONLY a valid JSON object with this structure:
{{
  "title": "Page Title",
  "sections": [
    {{
      "id": "unique-id",
      "type": "hero|features|about|testimonials|cta|footer|team|pricing|stats",
      "style": {{"backgroundColor": "#hex", "padding": "60px 20px", "textAlign": "center or left"}},
      "elements": [
        {{
          "id": "unique-id",
          "type": "heading|paragraph|image|button",
          "content": "text or object",
          "style": {{}}
        }}
      ]
    }}
  ]
}}

RULES:
1. Generate 7 to 9 sections with this order:
   hero, social proof, features, problem-solution, how-it-works, optional pricing, faq, final cta
2. Each section: 2-8 elements
3. For images, pick the MOST RELEVANT category from this image library and use images from it:
{all_images_json}
Choose the category closest to the user's prompt topic. Use DIFFERENT images for DIFFERENT sections. Do NOT repeat the same image URL.
4. Image content format: {{"src": "url", "alt": "description"}}
5. Button/heading/paragraph content is a string
6. Use realistic professional content matching the prompt
7. Use cohesive modern color system:
   neutral base + one premium accent gradient direction (blue-purple or purple-pink)
8. Ensure text is readable against backgrounds (light text on dark bg, dark text on light bg)
9. All IDs must be unique lowercase alphanumeric with dashes
10. Content must be benefit-driven and conversion-focused
11. Return ONLY the JSON object - no markdown, no code blocks, no explanation"""

    try:
        page_data: Dict[str, Any]
        generator_used = "fallback"
        force_local_test_agent = os.environ.get("USE_LOCAL_TEST_AGENT", "false").strip().lower() == "true"
        has_gemini_key = bool(os.environ.get("GEMINI_API_KEY"))
        has_openai_key = bool(os.environ.get("OPENAI_API_KEY"))

        if force_local_test_agent:
            page_data, generator_used = generate_with_local_test_agent(generation_brief, context, variant_index)
        elif has_gemini_key:
            try:
                page_data, generator_used = await generate_with_gemini(system_prompt, generation_brief, variant_index)
            except Exception as gemini_error:
                logger.warning(f"Gemini generation failed: {gemini_error}")
                if has_openai_key:
                    try:
                        page_data, generator_used = await generate_with_openai(system_prompt, generation_brief, variant_index)
                    except Exception as openai_error:
                        logger.warning(f"OpenAI generation failed after Gemini fallback: {openai_error}")
                        page_data = local_fallback_page(generation_brief, context, variant_index)
                        generator_used = "fallback-ai-error"
                else:
                    page_data = local_fallback_page(generation_brief, context, variant_index)
                    generator_used = "fallback-gemini-error"
        elif has_openai_key:
            try:
                page_data, generator_used = await generate_with_openai(system_prompt, generation_brief, variant_index)
            except Exception as ai_error:
                logger.warning(f"OpenAI generation failed, using fallback: {ai_error}")
                page_data = local_fallback_page(generation_brief, context, variant_index)
                generator_used = "fallback-openai-error"
        else:
            page_data = local_fallback_page(generation_brief, context, variant_index)
            generator_used = "fallback-missing-ai-key"

        page_data = apply_layout_variation_to_page(page_data, context, variant_index)

        doc = {
            "id": str(uuid.uuid4()),
            "prompt": request.prompt,
            "meta": {**context, "variant_index": variant_index, "variant_hint": variant_hint, "generator": generator_used},
            "page": page_data,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await try_store_generated_page(doc)

        return {"page": page_data, "meta": doc["meta"]}

    except ModuleNotFoundError:
        page_data = local_fallback_page(generation_brief, context, variant_index)
        page_data = apply_layout_variation_to_page(page_data, context, variant_index)
        doc = {
            "id": str(uuid.uuid4()),
            "prompt": request.prompt,
            "meta": {**context, "variant_index": variant_index, "variant_hint": variant_hint, "generator": "fallback-no-module"},
            "page": page_data,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await try_store_generated_page(doc)
        return {"page": page_data, "meta": doc["meta"]}
    except (TimeoutError, asyncio.TimeoutError):
        page_data = local_fallback_page(generation_brief, context, variant_index)
        page_data = apply_layout_variation_to_page(page_data, context, variant_index)
        doc = {
            "id": str(uuid.uuid4()),
            "prompt": request.prompt,
            "meta": {**context, "variant_index": variant_index, "variant_hint": variant_hint, "generator": "fallback-timeout"},
            "page": page_data,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await try_store_generated_page(doc)
        return {"page": page_data, "meta": doc["meta"]}
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response: {e}\nResponse: {response_text[:500]}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response. Please try again.")
    except Exception as e:
        logger.error(f"Error generating page: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/import-page")
async def import_page(page_json: Dict[str, Any]):
    """
    Import a page from Zoho-style JSON format.
    Transforms hierarchical structure (sections→rows→columns→elements) to FFB format.
    Preserves all device-specific styling and element properties.
    """
    try:
        # Validate that it's a valid page structure
        if "type" not in page_json:
            raise HTTPException(status_code=400, detail="Missing 'type' field in page JSON")
        
        page_type = page_json.get("type")
        
        if page_type == "page":
            # Zoho-style hierarchical format
            return transform_zoho_to_ffb(page_json)
        elif page_type == "section" or "sections" in page_json:
            # Already FFB format or partially FFB
            return {"page": page_json, "format": "ffb", "transformation": "none"}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown page type: {page_type}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing page: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def transform_zoho_to_ffb(zoho_page: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform Zoho-style hierarchical JSON to FFB format.
    Keeps the hierarchical elements in the page.elements map for advanced features.
    """
    result = {
        "page": {
            "title": zoho_page.get("title", "Imported Page"),
            "page_type": zoho_page.get("page_type", "custom"),
            "type": "page",
            "sections": [],  # Traditional flat structure for basic compatibility
            "elements": zoho_page.get("elements", {}),  # Keep full hierarchy
        },
        "format": "zoho_extended",
        "transformation": "hierarchical_preserved",
        "stats": {
            "total_elements": len(zoho_page.get("elements", {})),
            "root_sections": len(zoho_page.get("sections", [])),
        }
    }
    
    # If there are sections in traditional format, add them too
    if "sections" in zoho_page:
        result["page"]["sections"] = zoho_page["sections"]
    
    return result


@api_router.post("/import-page-flat")
async def import_page_flat(page_json: Dict[str, Any]):
    """
    Import a Zoho-style page and flatten hierarchical structure to simple sections.
    Use this if you want simple flat structure without hierarchy support.
    """
    try:
        elements_map = page_json.get("elements", {})
        section_refs = page_json.get("sections", [])
        
        flat_sections = []
        
        # For each section reference
        for section_id in section_refs:
            if section_id not in elements_map:
                continue
            
            section_elem = elements_map[section_id]
            flat_section = {
                "id": section_id,
                "type": section_elem.get("type", "section"),
                "style": extract_style(section_elem),
                "elements": flatten_elements_recursively(section_elem.get("rows", []), elements_map)
            }
            flat_sections.append(flat_section)
        
        return {
            "page": {
                "title": page_json.get("title", "Imported Page"),
                "sections": flat_sections,
            },
            "format": "ffb_flat",
            "transformation": "flattened",
            "stats": {
                "total_elements": len(elements_map),
                "sections": len(flat_sections),
                "warning": "Hierarchical information lost in flattening. Use import-page for full support."
            }
        }
    except Exception as e:
        logger.error(f"Error flattening page: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def extract_style(element: Dict[str, Any]) -> Dict[str, Any]:
    """Extract combined style from element, accounting for Zoho format wrapping"""
    elem_props = element.get("element", {})
    
    if isinstance(elem_props, dict):
        # Return Zoho-style element properties as-is (contains all styling)
        return elem_props
    
    return element.get("style", {})


def flatten_elements_recursively(row_ids: List[str], elements_map: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Recursively flatten row→column→element hierarchy into a flat list"""
    result = []
    
    for row_id in row_ids:
        if row_id not in elements_map:
            continue
        
        row = elements_map[row_id]
        column_ids = row.get("columns", [])
        
        for col_id in column_ids:
            if col_id not in elements_map:
                continue
            
            col = elements_map[col_id]
            element_ids = col.get("elements", [])
            
            for el_id in element_ids:
                if el_id not in elements_map:
                    continue
                
                result.append(elements_map[el_id])
    
    return result


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

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()
