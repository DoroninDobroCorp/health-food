from collections import defaultdict
from typing import Any, Dict, List, Set

from .db import get_public_recipes

RECIPE_DB: List[Dict[str, Any]] = [
    {
        "id": "oats_berries_yogurt",
        "name": "Овсянка с йогуртом и ягодами",
        "description": "Классический здоровый завтрак, богатый клетчаткой и белком. Идеально для начала дня.",
        "time_min": 8,
        "ingredients": [
            {"name": "Овсяные хлопья", "amount": "50 г"},
            {"name": "Греческий йогурт", "amount": "150 г"},
            {"name": "Свежие ягоды", "amount": "70 г"},
            {"name": "Семена чиа", "amount": "1 ст.л."},
            {"name": "Корица", "amount": "щепотка"},
        ],
        "instructions": [
            "Смешайте овсяные хлопья с греческим йогуртом и семенами чиа.",
            "Оставьте на 5 минут, чтобы семена чиа немного разбухли.",
            "Выложите в миску, сверху украсьте свежими ягодами и посыпьте корицей.",
        ],
        "nutrients": {"fiber": 8, "protein": 20, "b12": 0.8},
        "tags": ["breakfast", "glycemic_control"],
        "difficulty": 1,
    },
    {
        "id": "lentil_spinach_stew",
        "name": "Тушёная чечевица со шпинатом",
        "description": "Сытное и богатое железом веганское блюдо. Отлично подходит для обеда или ужина.",
        "time_min": 25,
        "ingredients": [
            {"name": "Красная чечевица", "amount": "150 г"},
            {"name": "Свежий шпинат", "amount": "200 г"},
            {"name": "Консервированные томаты", "amount": "400 г"},
            {"name": "Лук репчатый", "amount": "1 шт"},
            {"name": "Чеснок", "amount": "2 зубчика"},
            {"name": "Оливковое масло", "amount": "2 ст.л."},
        ],
        "instructions": [
            "Мелко нарежьте лук и чеснок. Обжарьте на оливковом масле в глубокой сковороде до прозрачности.",
            "Промойте чечевицу. Добавьте в сковороду вместе с консервированными томатами и 400 мл воды.",
            "Доведите до кипения, затем уменьшите огонь и тушите 15-20 минут, пока чечевица не станет мягкой.",
            "Добавьте шпинат и готовьте еще 2-3 минуты, пока он не станет мягким. Посолите и поперчите по вкусу.",
        ],
        "nutrients": {"iron": 6, "fiber": 12, "protein": 22},
        "tags": ["iron", "vegan"],
        "difficulty": 1,
    },
    {
        "id": "salmon_bowl",
        "name": "Боул с лососем и киноа",
        "description": "Сбалансированный боул, богатый Омега-3 и витамином D. Идеально для легкого ужина.",
        "time_min": 20,
        "ingredients": [
            {"name": "Филе лосося", "amount": "150 г"},
            {"name": "Киноа", "amount": "80 г"},
            {"name": "Свежий шпинат", "amount": "100 г"},
            {"name": "Авокадо", "amount": "1/2 шт"},
            {"name": "Оливковое масло", "amount": "1 ст.л."},
            {"name": "Лимонный сок", "amount": "1 ст.л."},
        ],
        "instructions": [
            "Отварите киноа согласно инструкции на упаковке.",
            "Филе лосося посолите, поперчите и запекайте в духовке при 200°C 12-15 минут или приготовьте на пару.",
            "Нарежьте авокадо. Смешайте оливковое масло с лимонным соком для заправки.",
            "Соберите боул: на дно выложите шпинат, затем киноа, сверху кусочки лосося и авокадо. Полейте заправкой.",
        ],
        "nutrients": {"omega3": 2, "protein": 35, "vitamin_d": 8},
        "tags": ["vitamin_d", "omega3", "ldl"],
        "difficulty": 1,
    },
    {
        "id": "beef_liver_onions",
        "name": "Печень с луком",
        "description": "Источник железа и витамина B12. Быстрое в приготовлении и очень полезное блюдо.",
        "time_min": 15,
        "ingredients": [
            {"name": "Говяжья печень", "amount": "200 г"},
            {"name": "Лук репчатый", "amount": "1 шт"},
            {"name": "Оливковое масло", "amount": "2 ст.л."},
        ],
        "instructions": [
            "Нарежьте печень тонкими ломтиками, а лук - полукольцами.",
            "Разогрейте оливковое масло на сковороде. Обжарьте лук до золотистого цвета.",
            "Добавьте печень и жарьте по 2-3 минуты с каждой стороны. Печень должна остаться немного розовой внутри.",
            "Посолите и поперчите в самом конце приготовления.",
        ],
        "nutrients": {"iron": 8, "b12": 10, "protein": 28},
        "tags": ["iron", "b12"],
        "difficulty": 1,
    },
    {
        "id": "chickpea_salad",
        "name": "Салат из нута с овощами",
        "description": "Легкий и освежающий салат, который готовится за 10 минут. Отличный источник клетчатки.",
        "time_min": 10,
        "ingredients": [
            {"name": "Консервированный нут", "amount": "200 г"},
            {"name": "Помидоры черри", "amount": "100 г"},
            {"name": "Огурец", "amount": "1 шт"},
            {"name": "Оливковое масло", "amount": "2 ст.л."},
            {"name": "Лимонный сок", "amount": "1 ст.л."},
            {"name": "Петрушка", "amount": "пучок"},
        ],
        "instructions": [
            "Слейте жидкость с нута и промойте его.",
            "Нарежьте помидоры черри пополам, огурец - кубиками, мелко порубите петрушку.",
            "Смешайте все ингредиенты в салатнике.",
            "Заправьте оливковым маслом и лимонным соком. Посолите и поперчите по вкусу.",
        ],
        "nutrients": {"fiber": 10, "protein": 14},
        "tags": ["glycemic_control", "ldl"],
        "difficulty": 1,
    },
    {
        "id": "tuna_egg_salad",
        "name": "Салат с тунцом и яйцом",
        "description": "Простой салат с высоким содержанием белка. Отличный вариант для быстрого обеда.",
        "time_min": 12,
        "ingredients": [
            {"name": "Консервированный тунец", "amount": "1 банка (150 г)"},
            {"name": "Яйца", "amount": "2 шт"},
            {"name": "Листья салата", "amount": "100 г"},
            {"name": "Оливковое масло", "amount": "1 ст.л."},
            {"name": "Лимонный сок", "amount": "1 ст.л."},
        ],
        "instructions": [
            "Сварите яйца вкрутую (10 минут после закипания). Остудите и нарежьте дольками.",
            "Слейте жидкость с тунца.",
            "Выложите на тарелку листья салата, сверху тунец и нарезанные яйца.",
            "Сбрызните оливковым маслом и лимонным соком.",
        ],
        "nutrients": {"protein": 30, "omega3": 0.5, "b12": 2},
        "tags": ["b12", "protein"],
        "difficulty": 1,
    },
]


def _score_recipe_for_deficits(
    recipe: Dict[str, Any], deficits: List[Dict[str, Any]], available: Set[str]
) -> float:
    score = 0.0
    tags = set(recipe.get("tags", []))
    for d in deficits:
        if d["marker"] in tags:
            score += 2
        # heuristic: nutrients present add small points
        for t in d.get("targets", {}).keys():
            if t in recipe.get("nutrients", {}):
                score += 0.5
    # prefer available ingredients
    if available:
        ing = set(x["name"].lower() for x in recipe["ingredients"])
        avail_lower = set(x.lower() for x in available)
        overlap = len(ing & avail_lower)
        score += 0.2 * overlap
    # prefer simplicity
    score += max(0, 5 - recipe.get("difficulty", 1)) * 0.05
    return score


def select_recipes_for_deficits(deficits, preferences=None):
    preferences = preferences or {}
    available = set(p.lower() for p in preferences.get("available", []))

    db = get_public_recipes()
    filtered_db = db
    if available:
        common_pantry_items = {
            "оливковое масло",
            "соль",
            "перец",
            "вода",
            "чеснок",
            "лук репчатый",
        }
        filtered_db = []
        for recipe in db:
            required_ingredients = {
                ing["name"].lower() for ing in recipe["ingredients"]
            }
            missing_ingredients = required_ingredients - available - common_pantry_items
            if not missing_ingredients:
                filtered_db.append(recipe)

    scored = [
        (r, _score_recipe_for_deficits(r, deficits, available)) for r in filtered_db
    ]
    scored.sort(key=lambda x: x[1], reverse=True)
    plan = []
    used = set()
    for r, _ in scored:
        if r["id"] in used:
            continue
        plan.append(
            {
                "id": r["id"],
                "name": r["name"],
                "description": r.get("description", ""),
                "instructions": r.get("instructions", []),
                "ingredients": r["ingredients"],
                "time_min": r["time_min"],
                "why": _why_recipe_matches(r, deficits),
            }
        )
        used.add(r["id"])
        if len(plan) >= 7:
            break
    return plan


def _why_recipe_matches(recipe, deficits):
    tags = set(recipe.get("tags", []))
    reasons = []
    for d in deficits:
        if d["marker"] in tags:
            reasons.append(d["marker"])
    if not reasons and deficits:
        reasons.append("balanced")
    return ", ".join(reasons) or "balanced"


def build_shopping_list(plan: List[Dict[str, Any]], available: List[str] = None):
    available_set = set((available or []))
    counts = defaultdict(int)
    for item in plan:
        for ing_details in item["ingredients"]:
            ing_name = ing_details["name"]
            if ing_name not in available_set:
                counts[ing_name] += 1
    return [
        {"ingredient": k, "count": v, "amount": _get_ingredient_amount(k, plan)}
        for k, v in sorted(counts.items(), key=lambda x: (-x[1], x[0]))
    ]


def _get_ingredient_amount(ingredient_name: str, plan: List[Dict[str, Any]]) -> str:
    """Helper to find the amount for a given ingredient from the first recipe that contains it."""
    for recipe in plan:
        for ing_details in recipe.get("ingredients", []):
            if ing_details.get("name") == ingredient_name:
                return ing_details.get("amount", "")
    return ""
