"""Repository для работы с рецептами в БД"""
import json
import sqlite3
import uuid
from typing import Any, Dict, List, Optional


class RecipeRepository:
    """Репозиторий для работы с рецептами"""
    
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn
        self.conn.row_factory = sqlite3.Row
    
    def get_all_public(self) -> List[Dict[str, Any]]:
        """Получить все публичные рецепты"""
        cur = self.conn.cursor()
        rows = cur.execute(
            "SELECT * FROM recipes WHERE user_id IS NULL ORDER BY name"
        ).fetchall()
        
        return [self._row_to_dict(row) for row in rows]
    
    def get_user_recipes(self, user_id: int) -> List[Dict[str, Any]]:
        """Получить рецепты пользователя"""
        cur = self.conn.cursor()
        rows = cur.execute(
            "SELECT * FROM recipes WHERE user_id = ? ORDER BY name",
            (user_id,)
        ).fetchall()
        
        return [self._row_to_dict(row) for row in rows]
    
    def get_by_id(self, recipe_id: str) -> Optional[Dict[str, Any]]:
        """Получить рецепт по ID"""
        cur = self.conn.cursor()
        row = cur.execute(
            "SELECT * FROM recipes WHERE id = ?",
            (recipe_id,)
        ).fetchone()
        
        return self._row_to_dict(row) if row else None
    
    def create(self, recipe: Dict[str, Any], user_id: Optional[int] = None) -> Dict[str, Any]:
        """Создать новый рецепт"""
        cur = self.conn.cursor()
        
        recipe_id = recipe.get("id") or f"recipe_{uuid.uuid4().hex[:8]}"
        
        cur.execute(
            """
            INSERT INTO recipes 
            (id, user_id, name, time_min, description, ingredients, instructions, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                recipe_id,
                user_id,
                recipe.get("name"),
                recipe.get("time_min"),
                recipe.get("description"),
                json.dumps(recipe.get("ingredients", []), ensure_ascii=False),
                json.dumps(recipe.get("instructions", []), ensure_ascii=False),
                json.dumps(recipe.get("tags", []), ensure_ascii=False),
            ),
        )
        self.conn.commit()
        
        return self.get_by_id(recipe_id)
    
    def update(self, recipe_id: str, recipe: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Обновить рецепт"""
        cur = self.conn.cursor()
        
        cur.execute(
            """
            UPDATE recipes 
            SET name = ?, time_min = ?, description = ?, 
                ingredients = ?, instructions = ?, tags = ?
            WHERE id = ?
            """,
            (
                recipe.get("name"),
                recipe.get("time_min"),
                recipe.get("description"),
                json.dumps(recipe.get("ingredients", []), ensure_ascii=False),
                json.dumps(recipe.get("instructions", []), ensure_ascii=False),
                json.dumps(recipe.get("tags", []), ensure_ascii=False),
                recipe_id,
            ),
        )
        self.conn.commit()
        
        return self.get_by_id(recipe_id)
    
    def delete(self, recipe_id: str) -> bool:
        """Удалить рецепт"""
        cur = self.conn.cursor()
        cur.execute("DELETE FROM recipes WHERE id = ?", (recipe_id,))
        self.conn.commit()
        return cur.rowcount > 0
    
    def search_by_tags(self, tags: List[str]) -> List[Dict[str, Any]]:
        """Поиск рецептов по тегам"""
        cur = self.conn.cursor()
        rows = cur.execute(
            "SELECT * FROM recipes WHERE user_id IS NULL"
        ).fetchall()
        
        recipes = [self._row_to_dict(row) for row in rows]
        
        # Фильтруем по тегам
        result = []
        for recipe in recipes:
            recipe_tags = set(recipe.get("tags", []))
            if any(tag in recipe_tags for tag in tags):
                result.append(recipe)
        
        return result
    
    def _row_to_dict(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Конвертировать Row в Dict"""
        recipe = dict(row)
        recipe["ingredients"] = json.loads(recipe["ingredients"])
        recipe["instructions"] = json.loads(recipe["instructions"])
        recipe["tags"] = json.loads(recipe["tags"])
        return recipe
