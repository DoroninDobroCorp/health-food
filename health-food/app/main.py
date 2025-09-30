"""
Health Food - Главный модуль приложения
Персонализированный сервис питания на основе анализов крови
"""
import json
import logging
from typing import Any, Dict, Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
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
from .db import get_conn, get_upcoming_reminders, init_db, save_labs_and_schedule, save_profile
from .llm_provider.openai_provider import OpenAIProvider

# Новые сервисы
from .repositories.recipe_repository import RecipeRepository
from .repositories.restaurant_repository import RestaurantRepository
from .repositories.biomarker_repository import BiomarkerRepository
from .services.recipe_service import RecipeService
from .services.restaurant_service import RestaurantService
from .services.biomarker_service import BiomarkerService
from .services.ai_service import AIService

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Health Food",
    description="Персонализированный сервис питания на основе анализов крови",
    version="2.0.0"
)

app.include_router(auth_router)
app.include_router(recipes_router)

# Глобальные сервисы
ai_service: Optional[AIService] = None

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
    """Инициализация приложения при запуске"""
    global ai_service
    
    logger.info("Запуск Health Food приложения...")
    
    # Загрузка переменных окружения
    load_env()
    
    # Инициализация базы данных
    logger.info("Инициализация базы данных...")
    init_db()
    
    # Инициализация AI сервиса
    if has_openai_api_key():
        logger.info("OpenAI API ключ найден, инициализация AI сервиса...")
        llm_provider = OpenAIProvider()
        ai_service = AIService(llm_provider)
    else:
        logger.warning("OpenAI API ключ не найден. AI функции будут недоступны.")
        ai_service = AIService(None)
    
    logger.info("Health Food приложение успешно запущено!")


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
    difficulty: Optional[str] = Form(None),
):
    """
    Главный эндпоинт генерации рекомендаций
    Поддерживает режимы: diy, restaurants, photo, ai_recipe
    """
    try:
        # Парсинг входных данных
        try:
            labs = json.loads(labs_json or "{}")
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Неверный формат labs_json")
        
        try:
            preferences = json.loads(preferences_json or "{}")
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Неверный формат preferences_json")
        
        # Инициализация сервисов
        biomarker_repo = BiomarkerRepository(conn)
        biomarker_service = BiomarkerService(biomarker_repo)
        
        recipe_repo = RecipeRepository(conn)
        recipe_service = RecipeService(recipe_repo)
        
        # Анализ биомаркеров
        logger.info(f"Анализ биомаркеров для пользователя {current_user.id}")
        deficits = biomarker_service.analyze_labs(labs)
        vitamins = biomarker_service.generate_vitamin_recommendations(labs, deficits)
        
        result: Dict[str, Any] = {
            "mode": mode, 
            "deficits": deficits, 
            "vitamins": vitamins
        }
        
        # Обработка по режимам
        if mode == "diy":
            logger.info("Режим DIY: подбор рецептов")
            chosen = recipe_service.select_recipes_for_plan(deficits, preferences)
            shopping = recipe_service.build_shopping_list(chosen)
            
            result.update({
                "plan": chosen,
                "shopping_list": shopping,
            })
            
        elif mode == "restaurants":
            if lat is None or lon is None:
                raise HTTPException(
                    status_code=400, 
                    detail="Для режима restaurants требуются координаты (lat, lon)"
                )
            
            logger.info(f"Режим Restaurants: поиск вблизи ({lat}, {lon})")
            restaurant_repo = RestaurantRepository(conn)
            restaurant_service = RestaurantService(restaurant_repo)
            
            location = {"lat": lat, "lon": lon}
            scored = restaurant_service.find_best_dishes(deficits, location, limit=20)
            result.update({"restaurants": scored})
            
        elif mode == "photo":
            if not ai_service.is_available():
                raise HTTPException(
                    status_code=503,
                    detail="AI сервис недоступен. Требуется OpenAI API ключ."
                )
            
            if photo is None:
                raise HTTPException(
                    status_code=400,
                    detail="Требуется загрузка фотографии"
                )
            
            logger.info("Режим Photo: анализ холодильника")
            image_data = await photo.read()
            detected = await ai_service.analyze_fridge_photo(image_data)
            
            logger.info(f"Обнаружено продуктов: {len(detected)}")
            preferences_with_available = {**preferences, "available": detected}
            
            chosen = recipe_service.select_recipes_for_plan(
                deficits, 
                preferences_with_available,
                available_ingredients=detected
            )
            shopping = recipe_service.build_shopping_list(chosen, detected)
            
            result.update({
                "detected": detected,
                "plan": chosen,
                "shopping_list": shopping,
            })
            
        elif mode == "ai_recipe":
            if not ai_service.is_available():
                raise HTTPException(
                    status_code=503,
                    detail="AI сервис недоступен. Требуется OpenAI API ключ."
                )
            
            logger.info("Режим AI Recipe: генерация персонализированных рецептов")
            user_context = {
                "labs": labs,
                "preferences": preferences,
                "difficulty": difficulty or "легкий",
            }
            
            recipes = await ai_service.generate_personalized_recipes(user_context)
            
            # Сохраняем рецепты в БД
            saved_recipes = [
                recipe_repo.create(recipe, user_id=current_user.id) 
                for recipe in recipes
            ]
            
            result.update({"recipes": saved_recipes})
            
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Неизвестный режим: {mode}"
            )
        
        logger.info(f"Успешно обработан запрос в режиме {mode}")
        return JSONResponse(result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка при обработке запроса: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )


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
    """
    Эндпоинт для получения AI консультации по витаминам и добавкам
    """
    if not ai_service or not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI сервис недоступен. Требуется OpenAI API ключ."
        )

    try:
        logger.info(f"Запрос консультации по витаминам: {request.message[:50]}...")
        
        result = await ai_service.get_nutrition_consultation(
            user_message=request.message,
            user_context=request.context,
            thread_id=request.thread_id,
        )

        return result
    except Exception as e:
        logger.error(f"Ошибка при получении рекомендаций по витаминам: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при генерации рекомендаций: {str(e)}"
        )
