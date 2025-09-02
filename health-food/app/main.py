import json
from typing import Any, Dict, Optional

from fastapi import Depends, FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from sqlite3 import Connection

from .auth import schemas
from .auth.dependencies import get_current_user
from .auth.router import router as auth_router
from .recipes.router import router as recipes_router
from .config import has_openai_api_key, load_env
from .db import (
    get_conn,
    get_public_recipes,
    get_upcoming_reminders,
    init_db,
    save_labs_and_schedule,
    save_profile,
    save_user_recipe,
)
from .llm_provider.openai_provider import OpenAIProvider
from .recipe_utils import build_shopping_list, select_recipes_for_deficits
from .restaurants import score_restaurant_dishes
from .rules import analyze_biomarkers, vitamin_recommendations

app = FastAPI(title="Health Food MVP")

app.include_router(auth_router)
app.include_router(recipes_router)

llm_provider = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

templates = Jinja2Templates(directory="frontend/dist/")


class GenerateRequest(BaseModel):
    mode: str  # photo | restaurants | diy
    labs: Dict[str, float] = {}
    preferences: Dict[str, Any] = {}
    location: Optional[Dict[str, float]] = None  # {lat, lon}


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None
    context: Dict[str, Any]


@app.on_event("startup")
async def _startup():
    global llm_provider
    load_env()
    init_db()
    if has_openai_api_key():
        llm_provider = OpenAIProvider()


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/api/generate")
async def generate(
    request: Request,
    conn: Connection = Depends(get_conn),
    current_user: schemas.User = Depends(get_current_user),
    mode: str = Form(...),
    labs_json: str = Form("{}"),
    preferences_json: str = Form("{}"),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    photo: Optional[UploadFile] = File(None),
    difficulty: Optional[str] = Form(None),  # Added for AI recipes
):
    try:
        labs = json.loads(labs_json or "{}")
    except Exception:
        labs = {}
    try:
        preferences = json.loads(preferences_json or "{}")
    except Exception:
        preferences = {}

    deficits = analyze_biomarkers(labs)
    vitamins = vitamin_recommendations(labs, deficits)

    location = None
    if lat is not None and lon is not None:
        location = {"lat": lat, "lon": lon}

    result: Dict[str, Any] = {"mode": mode, "deficits": deficits, "vitamins": vitamins}

    if mode == "diy":
        chosen = select_recipes_for_deficits(deficits, preferences)
        shopping = build_shopping_list(chosen)

        recipes_from_db = get_public_recipes()
        for recipe in chosen:
            orig = next((r for r in recipes_from_db if r["id"] == recipe["id"]), None)
            if orig and "tags" in orig and orig["tags"]:
                recipe["tags"] = orig["tags"]

        result.update(
            {
                "plan": chosen,
                "shopping_list": shopping,
            }
        )
    elif mode == "restaurants":
        if not location:
            return JSONResponse(
                {"error": "location required (lat, lon)"}, status_code=400
            )
        scored = score_restaurant_dishes(deficits, location)
        result.update({"restaurants": scored[:20]})
    elif mode == "photo":
        if not llm_provider or photo is None:
            return JSONResponse(
                {"error": "Photo upload requires an OpenAI API key and a photo file."},
                status_code=400,
            )

        image_data = await photo.read()

        prompt = (
            "Analyze the attached image of a fridge or pantry. "
            "Identify all visible food items and ingredients. "
            "Return the result as a JSON object with a single key 'items' "
            "containing a list of the identified food names in lowercase Russian. "
            'For example: {"items": ["яйца", "овсянка", "рыба"]}. '
            "If no food is visible, return an empty list."
        )
        detected = await llm_provider.analyze_image(image_data, prompt)

        if not detected:
            detected = [
                "oats",
                "eggs",
                "canned tuna",
                "frozen berries",
                "olive oil",
                "chickpeas",
                "rice",
                "tomatoes",
                "spinach",
            ]

        preferences = {**preferences, "available": detected}
        chosen = select_recipes_for_deficits(deficits, preferences)
        shopping = build_shopping_list(chosen, available=detected)

        # TODO: This logic also needs review.
        recipes_from_db = get_public_recipes()
        for recipe in chosen:
            orig = next((r for r in recipes_from_db if r["id"] == recipe["id"]), None)
            if orig and "tags" in orig and orig["tags"]:
                recipe["tags"] = orig["tags"]

        result.update(
            {
                "detected": detected,
                "plan": chosen,
                "shopping_list": shopping,
            }
        )
    elif mode == "ai_recipe":
        if not llm_provider:
            return JSONResponse(
                {"error": "AI recipe generation requires an OpenAI API key."},
                status_code=400,
            )

        user_context = {
            "labs": labs,
            "preferences": preferences,
            "difficulty": difficulty,
        }

        recipes = await llm_provider.generate_recipes(user_context)
        
        saved_recipes = [
            save_user_recipe(conn, user_id=current_user.id, recipe=r) for r in recipes
        ]
        
        result.update({"recipes": saved_recipes})
    else:
        return JSONResponse({"error": "unknown mode"}, status_code=400)

    return JSONResponse(result)


# Simple health check
@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/api/profile")
async def api_save_profile(
    name: str = Form(""),
    email: str = Form(""),
    goals: str = Form(""),
    current_user: schemas.User = Depends(get_current_user),
):
    return save_profile(name=name, email=email, goals=goals, user_id=current_user.id)


# Labs save + reminder
@app.post("/api/labs/save")
async def api_save_labs(
    labs_json: str = Form("{}"),
    weeks: int = Form(10),
):
    try:
        labs = json.loads(labs_json or "{}")
    except Exception:
        return JSONResponse({"error": "invalid labs_json"}, status_code=400)
    return save_labs_and_schedule(labs, weeks_from_now=int(weeks))


# Reminders
@app.get("/api/reminders/upcoming")
async def api_upcoming(days: int = 120):
    return {"items": get_upcoming_reminders(days=days)}


@app.post("/api/vitamins/recommendations")
async def api_vitamins_recommendations(request: ChatRequest):
    if not llm_provider:
        return JSONResponse({"error": "LLM provider not initialized"}, status_code=503)

    try:
        result = await llm_provider.get_vitamin_recommendations(
            user_message=request.message,
            thread_id=request.thread_id,
            user_context=request.context,
        )

        return result
    except Exception as e:
        print(f"Error in vitamins recommendations: {str(e)}")
        return JSONResponse(
            {"error": "An error occurred while generating vitamin recommendations"},
            status_code=500,
        )
