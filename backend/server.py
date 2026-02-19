from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

STOCK_IMAGES = [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80",
    "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
]


class GeneratePageRequest(BaseModel):
    prompt: str


@api_router.post("/generate-page")
async def generate_page(request: GeneratePageRequest):
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    from emergentintegrations.llm.chat import LlmChat, UserMessage

    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    system_prompt = f"""You are an expert web designer AI. Generate a landing page structure as JSON based on the user's prompt.

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
1. Generate EXACTLY 5 sections (hero, features, about/team, testimonials/stats, CTA/footer)
2. Each section: 2-6 elements
3. Use these stock images: {json.dumps(STOCK_IMAGES[:6])}
4. Image content format: {{"src": "url", "alt": "description"}}
5. Button/heading/paragraph content is a string
6. Use realistic professional content matching the prompt
7. Use cohesive color scheme with good contrast
8. Ensure text is readable against backgrounds (light text on dark bg, dark text on light bg)
9. All IDs must be unique lowercase alphanumeric with dashes
10. Return ONLY the JSON object - no markdown, no code blocks, no explanation"""

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")

        user_message = UserMessage(text=f"Create a landing page for: {request.prompt}")
        response = await chat.send_message(user_message)

        response_text = response.strip()
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            response_text = '\n'.join(lines[1:-1])
        if response_text.startswith('json'):
            response_text = response_text[4:]

        page_data = json.loads(response_text)

        doc = {
            "id": str(uuid.uuid4()),
            "prompt": request.prompt,
            "page": page_data,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.generated_pages.insert_one(doc)

        return {"page": page_data}

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response: {e}\nResponse: {response_text[:500]}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response. Please try again.")
    except Exception as e:
        logger.error(f"Error generating page: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
    client.close()
