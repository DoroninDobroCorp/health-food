"""Сервис для работы с ресторанами и рекомендациями блюд"""
import math
from typing import Any, Dict, List, Tuple
from ..repositories.restaurant_repository import RestaurantRepository


class RestaurantService:
    """Сервис для работы с ресторанами"""
    
    def __init__(self, repository: RestaurantRepository):
        self.repository = repository
    
    def find_best_dishes(
        self,
        deficits: List[Dict[str, Any]],
        user_location: Dict[str, float],
        max_distance_km: float = 10.0,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Находит лучшие блюда в ресторанах на основе дефицитов и расстояния
        
        Args:
            deficits: Выявленные дефициты
            user_location: Координаты пользователя {lat, lon}
            max_distance_km: Максимальное расстояние поиска
            limit: Максимальное количество результатов
            
        Returns:
            Список рекомендованных блюд с ресторанами
        """
        user_lat = user_location["lat"]
        user_lon = user_location["lon"]
        
        restaurants = self.repository.get_all_with_dishes()
        markers = {d["marker"] for d in deficits}
        
        # Скорируем все блюда
        scored_dishes = []
        
        for restaurant in restaurants:
            distance = self._calculate_distance(
                user_lat, user_lon,
                restaurant["lat"], restaurant["lon"]
            )
            
            # Пропускаем слишком далекие рестораны
            if distance > max_distance_km:
                continue
            
            for dish in restaurant.get("dishes", []):
                score = self._score_dish(
                    dish, 
                    deficits, 
                    markers, 
                    distance
                )
                
                scored_dishes.append({
                    "restaurant": restaurant["name"],
                    "restaurant_lat": restaurant["lat"],
                    "restaurant_lon": restaurant["lon"],
                    "dish": dish["name"],
                    "nutrients": dish.get("nutrients", {}),
                    "distance_km": round(distance, 2),
                    "score": round(score, 2),
                    "match_reason": self._explain_dish_match(dish, deficits),
                })
        
        # Сортируем по скору
        scored_dishes.sort(key=lambda x: x["score"], reverse=True)
        
        return scored_dishes[:limit]
    
    def _calculate_distance(
        self, 
        lat1: float, lon1: float, 
        lat2: float, lon2: float
    ) -> float:
        """
        Вычисляет расстояние между двумя точками по формуле Haversine
        
        Returns:
            Расстояние в километрах
        """
        R = 6371  # Радиус Земли в км
        
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        
        a = (
            math.sin(dphi / 2) ** 2 +
            math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def _score_dish(
        self,
        dish: Dict[str, Any],
        deficits: List[Dict[str, Any]],
        deficit_markers: set,
        distance_km: float,
    ) -> float:
        """
        Вычисляет скор блюда на основе соответствия дефицитам и расстояния
        """
        score = 5.0  # Базовый скор
        
        nutrients = dish.get("nutrients", {})
        
        # Бонусы за соответствие дефицитам
        for deficit in deficits:
            marker = deficit["marker"]
            severity = deficit.get("severity", 0.5)
            
            # Прямое совпадение нутриента
            if marker in nutrients:
                score += 2.0 * (1 + severity)
            
            # Проверяем цели (targets)
            for target in deficit.get("targets", {}).keys():
                if target in nutrients:
                    score += 1.0 * (1 + severity * 0.5)
        
        # Общие полезные нутриенты
        valuable_nutrients = {
            "fiber", "protein", "omega3", "vitamin_d", 
            "iron", "b12", "vitamin_c"
        }
        for nutrient in nutrients.keys():
            if nutrient in valuable_nutrients:
                score += 0.3
        
        # Штраф за расстояние (чем дальше, тем меньше скор)
        distance_penalty = min(distance_km, 10) * 0.1
        score -= distance_penalty
        
        return max(score, 0)
    
    def _explain_dish_match(
        self,
        dish: Dict[str, Any],
        deficits: List[Dict[str, Any]],
    ) -> str:
        """Объясняет, почему блюдо подходит"""
        nutrients = dish.get("nutrients", {})
        matches = []
        
        nutrient_names = {
            "iron": "железо",
            "b12": "B12",
            "vitamin_d": "витамин D",
            "omega3": "омега-3",
            "fiber": "клетчатка",
            "protein": "белок",
        }
        
        for deficit in deficits:
            marker = deficit["marker"]
            if marker in nutrients:
                readable = nutrient_names.get(marker, marker)
                matches.append(readable)
        
        if not matches:
            # Проверяем общие полезные нутриенты
            for nutrient, name in nutrient_names.items():
                if nutrient in nutrients:
                    matches.append(name)
        
        if not matches:
            return "Сбалансированное блюдо"
        
        return "Богато: " + ", ".join(matches[:3])
