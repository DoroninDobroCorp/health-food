"""Repository для работы с ресторанами и блюдами"""
import json
import sqlite3
from typing import Any, Dict, List


class RestaurantRepository:
    """Репозиторий для работы с ресторанами и блюдами"""
    
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn
        self.conn.row_factory = sqlite3.Row
    
    def get_all_with_dishes(self) -> List[Dict[str, Any]]:
        """Получить все рестораны с блюдами"""
        cur = self.conn.cursor()
        
        restaurants = {}
        
        # Получаем все рестораны
        rows = cur.execute("SELECT id, name, lat, lon FROM restaurants").fetchall()
        for row in rows:
            restaurants[row["id"]] = dict(row)
            restaurants[row["id"]]["dishes"] = []
        
        # Получаем все блюда
        dish_rows = cur.execute(
            "SELECT restaurant_id, name, nutrients FROM dishes"
        ).fetchall()
        for dish_row in dish_rows:
            res_id = dish_row["restaurant_id"]
            if res_id in restaurants:
                dish = dict(dish_row)
                dish["nutrients"] = json.loads(dish["nutrients"])
                restaurants[res_id]["dishes"].append(dish)
        
        return list(restaurants.values())
    
    def get_nearby(self, lat: float, lon: float, radius_km: float = 10.0) -> List[Dict[str, Any]]:
        """Получить рестораны в радиусе (упрощенный вариант)"""
        # Упрощенная логика - просто возвращаем все рестораны
        # В production версии можно добавить геопространственный индекс
        return self.get_all_with_dishes()
    
    def create_restaurant(self, restaurant: Dict[str, Any]) -> str:
        """Создать новый ресторан"""
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO restaurants (id, name, lat, lon) VALUES (?, ?, ?, ?)",
            (
                restaurant["id"],
                restaurant["name"],
                restaurant["lat"],
                restaurant["lon"],
            ),
        )
        self.conn.commit()
        return restaurant["id"]
    
    def create_dish(self, restaurant_id: str, dish: Dict[str, Any]) -> int:
        """Добавить блюдо в ресторан"""
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO dishes (restaurant_id, name, nutrients) VALUES (?, ?, ?)",
            (
                restaurant_id,
                dish["name"],
                json.dumps(dish.get("nutrients", {}), ensure_ascii=False),
            ),
        )
        self.conn.commit()
        return cur.lastrowid
