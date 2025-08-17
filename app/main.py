from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import math

from .rules import analyze_biomarkers, vitamin_recommendations
from .recipes import RECIPE_DB, select_recipes_for_deficits, build_shopping_list
from .restaurants import RESTAURANTS_DB, score_restaurant_dishes
from .db import (
    init_db,
    get_profile,
    save_profile,
    save_labs_and_schedule,
    get_upcoming_reminders,
    complete_reminder,
)
from .config import load_env, has_openai_api_key

app = FastAPI(title="Health Food MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")


class GenerateRequest(BaseModel):
    mode: str  # photo | restaurants | diy
    labs: Dict[str, float] = {}
    preferences: Dict[str, Any] = {}
    location: Optional[Dict[str, float]] = None  # {lat, lon}


@app.on_event("startup")
async def _startup():
    load_env()
    init_db()


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# Env status endpoint (after app is created)
@app.get("/api/env/status")
async def api_env_status():
    return {"openai": has_openai_api_key()}


@app.post("/api/generate")
async def generate(
    request: Request,
    mode: str = Form(...),
    labs_json: str = Form("{}"),
    preferences_json: str = Form("{}"),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    photo: Optional[UploadFile] = File(None),
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
        chosen = select_recipes_for_deficits(deficits, RECIPE_DB, preferences)
        shopping = build_shopping_list(chosen)
        result.update({
            "plan": chosen,
            "shopping_list": shopping,
        })
    elif mode == "restaurants":
        if not location:
            return JSONResponse({"error": "location required (lat, lon)"}, status_code=400)
        scored = score_restaurant_dishes(deficits, RESTAURANTS_DB, location)
        result.update({"restaurants": scored[:20]})
    elif mode == "photo":
        # MVP: Use filename keywords as detected items; otherwise generic pantry
        detected = []
        if photo is not None:
            name = photo.filename.lower()
            if any(k in name for k in ["fridge", "cold", "holodil", "holod", "refri"]):
                detected = ["eggs", "spinach", "yogurt", "oats", "chicken", "tomatoes", "olive oil"]
            if "fish" in name or "salmon" in name:
                detected.append("salmon")
            if "beef" in name or "liver" in name:
                detected.append("beef liver")
        if not detected:
            detected = ["oats", "eggs", "canned tuna", "frozen berries", "olive oil", "chickpeas", "rice", "tomatoes", "spinach"]
        preferences = {**preferences, "available": detected}
        chosen = select_recipes_for_deficits(deficits, RECIPE_DB, preferences)
        shopping = build_shopping_list(chosen, available=detected)
        result.update({
            "detected": detected,
            "plan": chosen,
            "shopping_list": shopping,
        })
    else:
        return JSONResponse({"error": "unknown mode"}, status_code=400)

    return JSONResponse(result)


# Simple health check
@app.get("/health")
async def health():
    return {"status": "ok"}


# Profile APIs
@app.get("/api/profile")
async def api_get_profile():
    return get_profile()


@app.post("/api/profile")
async def api_save_profile(
    name: str = Form("") ,
    email: str = Form("") ,
    goals: str = Form("") ,
):
    return save_profile(name=name, email=email, goals=goals)


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


@app.post("/api/reminders/complete")
async def api_complete(reminder_id: int = Form(...)):
    return complete_reminder(reminder_id)
