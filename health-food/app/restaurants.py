import math
from typing import Any, Dict, List
from .db import get_restaurants_with_dishes

RESTAURANTS_DB: List[Dict[str, Any]] = [
    {
        "id": "r1",
        "name": "Green Bowl",
        "lat": 55.751244,
        "lon": 37.618423,
        "dishes": [
            {
                "name": "Боул с лососем",
                "nutrients": {"omega3": 2, "vitamin_d": 6, "protein": 35},
            },
            {"name": "Боул с нутом", "nutrients": {"fiber": 12, "protein": 18}},
        ],
    },
    {
        "id": "r2",
        "name": "Oat & Bean",
        "lat": 55.760,
        "lon": 37.620,
        "dishes": [
            {"name": "Овсяная чаша", "nutrients": {"fiber": 8, "protein": 16}},
            {"name": "Салат из чечевицы", "nutrients": {"iron": 5, "fiber": 10}},
        ],
    },
]


def _haversine(lat1, lon1, lat2, lon2):
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dl / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def score_restaurant_dishes(deficits, location):
    user_lat, user_lon = location["lat"], location["lon"]
    results = []
    markers = set(d["marker"] for d in deficits)

    db = get_restaurants_with_dishes()
    for r in db:
        dist = _haversine(user_lat, user_lon, r["lat"], r["lon"])  # km
        for d in r["dishes"]:
            score = 5
            for m in markers:
                if m in d.get("nutrients", {}):
                    score += 1.5
            # nutrients that align with targets
            for dkey in d.get("nutrients", {}).keys():
                if dkey in {"fiber", "protein", "omega3", "vitamin_d", "iron"}:
                    score += 0.2
            # distance penalty
            score -= min(dist, 10) * 0.05
            results.append(
                {
                    "restaurant": r["name"],
                    "dish": d["name"],
                    "distance_km": round(dist, 2),
                    "score": round(score, 2),
                }
            )
    results.sort(key=lambda x: x["score"], reverse=True)
    return results
