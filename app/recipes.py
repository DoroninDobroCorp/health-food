from typing import List, Dict, Any, Set
from collections import defaultdict

RECIPE_DB: List[Dict[str, Any]] = [
    {
        "id": "oats_berries_yogurt",
        "name": "Овсянка с йогуртом и ягодами",
        "time_min": 8,
        "ingredients": ["oats", "yogurt", "berries", "chia", "honey (optional)", "cinnamon"],
        "nutrients": {"fiber": 8, "protein": 20, "b12": 0.8},
        "tags": ["breakfast", "glycemic_control"],
        "difficulty": 1,
    },
    {
        "id": "lentil_spinach_stew",
        "name": "Тушёная чечевица со шпинатом",
        "time_min": 25,
        "ingredients": ["lentils", "spinach", "tomatoes", "onion", "garlic", "olive oil"],
        "nutrients": {"iron": 6, "fiber": 12, "protein": 22},
        "tags": ["iron", "vegan"],
        "difficulty": 1,
    },
    {
        "id": "salmon_bowl",
        "name": "Боул с лососем и киноа",
        "time_min": 20,
        "ingredients": ["salmon", "quinoa", "spinach", "avocado", "olive oil", "lemon"],
        "nutrients": {"omega3": 2, "protein": 35, "vitamin_d": 8},
        "tags": ["vitamin_d", "omega3", "ldl"],
        "difficulty": 1,
    },
    {
        "id": "beef_liver_onions",
        "name": "Печень с луком",
        "time_min": 15,
        "ingredients": ["beef liver", "onion", "olive oil"],
        "nutrients": {"iron": 8, "b12": 10, "protein": 28},
        "tags": ["iron", "b12"],
        "difficulty": 1,
    },
    {
        "id": "chickpea_salad",
        "name": "Салат из нута с овощами",
        "time_min": 10,
        "ingredients": ["chickpeas", "tomatoes", "cucumber", "olive oil", "lemon", "parsley"],
        "nutrients": {"fiber": 10, "protein": 14},
        "tags": ["glycemic_control", "ldl"],
        "difficulty": 1,
    },
    {
        "id": "tuna_egg_salad",
        "name": "Салат с тунцом и яйцом",
        "time_min": 12,
        "ingredients": ["canned tuna", "eggs", "spinach", "olive oil", "lemon"],
        "nutrients": {"protein": 30, "omega3": 0.5, "b12": 2},
        "tags": ["b12", "protein"],
        "difficulty": 1,
    },
]


def _score_recipe_for_deficits(recipe: Dict[str, Any], deficits: List[Dict[str, Any]], available: Set[str]) -> float:
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
        ing = set(x.lower() for x in recipe["ingredients"])  # type: ignore
        avail_lower = set(x.lower() for x in available)
        overlap = len(ing & avail_lower)
        score += 0.2 * overlap
    # prefer simplicity
    score += max(0, 5 - recipe.get("difficulty", 1)) * 0.05
    return score


def select_recipes_for_deficits(deficits, db, preferences=None):
    preferences = preferences or {}
    available = set(preferences.get("available", []))
    # naive 7-day plan: pick top 7 distinct recipes
    scored = [
        (r, _score_recipe_for_deficits(r, deficits, available))
        for r in db
    ]
    scored.sort(key=lambda x: x[1], reverse=True)
    plan = []
    used = set()
    for r, _ in scored:
        if r["id"] in used:
            continue
        plan.append({
            "id": r["id"],
            "name": r["name"],
            "ingredients": r["ingredients"],
            "time_min": r["time_min"],
            "why": _why_recipe_matches(r, deficits),
        })
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
        for ing in item["ingredients"]:
            if ing not in available_set:
                counts[ing] += 1
    return [
        {"ingredient": k, "count": v}
        for k, v in sorted(counts.items(), key=lambda x: (-x[1], x[0]))
    ]
