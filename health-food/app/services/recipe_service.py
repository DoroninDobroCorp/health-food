"""Сервис для работы с рецептами и планированием питания"""
from collections import defaultdict
from typing import Any, Dict, List, Optional, Set
from ..repositories.recipe_repository import RecipeRepository


class RecipeService:
    """Сервис для работы с рецептами"""
    
    # Базовые продукты, которые обычно есть на кухне
    COMMON_PANTRY = {
        "оливковое масло", "растительное масло", "соль", "перец",
        "вода", "чеснок", "лук репчатый", "лук", "специи", "корица"
    }
    
    def __init__(self, repository: RecipeRepository):
        self.repository = repository
    
    def select_recipes_for_plan(
        self,
        deficits: List[Dict[str, Any]],
        preferences: Optional[Dict[str, Any]] = None,
        available_ingredients: Optional[List[str]] = None,
        days: int = 7,
    ) -> List[Dict[str, Any]]:
        """
        Подбирает рецепты для плана питания на основе дефицитов и предпочтений
        
        Args:
            deficits: Выявленные дефициты биомаркеров
            preferences: Предпочтения пользователя (диета, аллергии и т.д.)
            available_ingredients: Доступные ингредиенты
            days: Количество дней для плана
            
        Returns:
            Список отобранных рецептов
        """
        preferences = preferences or {}
        available_set = set((available_ingredients or []))
        
        # Получаем все публичные рецепты
        all_recipes = self.repository.get_all_public()
        
        # Фильтруем по доступным ингредиентам, если указаны
        if available_ingredients:
            filtered_recipes = self._filter_by_available_ingredients(
                all_recipes, available_set
            )
        else:
            filtered_recipes = all_recipes
        
        # Скорируем рецепты
        scored = [
            (recipe, self._score_recipe(recipe, deficits, available_set))
            for recipe in filtered_recipes
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        
        # Выбираем топ рецепты с разнообразием
        selected = self._select_diverse_recipes(scored, days)
        
        # Обогащаем информацией о соответствии дефицитам
        for recipe in selected:
            recipe["match_reason"] = self._explain_match(recipe, deficits)
        
        return selected
    
    def _filter_by_available_ingredients(
        self, recipes: List[Dict[str, Any]], available: Set[str]
    ) -> List[Dict[str, Any]]:
        """Фильтрует рецепты по доступным ингредиентам"""
        available_lower = {ing.lower() for ing in available}
        filtered = []
        
        for recipe in recipes:
            required = {
                ing["name"].lower() 
                for ing in recipe.get("ingredients", [])
            }
            missing = required - available_lower - self.COMMON_PANTRY
            
            # Разрешаем до 2 недостающих ингредиентов
            if len(missing) <= 2:
                filtered.append(recipe)
        
        return filtered
    
    def _score_recipe(
        self, 
        recipe: Dict[str, Any], 
        deficits: List[Dict[str, Any]], 
        available: Set[str]
    ) -> float:
        """
        Вычисляет скор рецепта на основе соответствия дефицитам
        """
        score = 0.0
        tags = set(recipe.get("tags", []))
        
        # Основной скор: совпадение с дефицитами
        for deficit in deficits:
            marker = deficit["marker"]
            severity = deficit.get("severity", 0.5)
            
            # Прямое совпадение тега
            if marker in tags:
                score += 3.0 * (1 + severity)
            
            # Совпадение по нутриентам
            nutrients = recipe.get("nutrients", {})
            for target in deficit.get("targets", {}).keys():
                if target in nutrients:
                    score += 1.0 * (1 + severity * 0.5)
        
        # Бонус за доступные ингредиенты
        if available:
            available_lower = {ing.lower() for ing in available}
            required = {ing["name"].lower() for ing in recipe.get("ingredients", [])}
            overlap = len(required & available_lower)
            score += overlap * 0.3
        
        # Бонус за простоту (меньше времени приготовления)
        time = recipe.get("time_min", 30)
        if time <= 15:
            score += 0.5
        elif time <= 30:
            score += 0.2
        
        # Бонус за низкую сложность
        difficulty = recipe.get("difficulty", 2)
        score += (3 - difficulty) * 0.2
        
        return score
    
    def _select_diverse_recipes(
        self, 
        scored_recipes: List[tuple], 
        count: int
    ) -> List[Dict[str, Any]]:
        """
        Выбирает разнообразные рецепты (избегает повторений)
        """
        selected = []
        used_ids = set()
        used_tags = defaultdict(int)
        
        for recipe, score in scored_recipes:
            if recipe["id"] in used_ids:
                continue
            
            # Проверяем разнообразие по тегам
            recipe_tags = set(recipe.get("tags", []))
            
            # Не берем больше 2 рецептов с одинаковым основным тегом
            skip = False
            for tag in recipe_tags:
                if used_tags[tag] >= 2:
                    skip = True
                    break
            
            if skip:
                continue
            
            selected.append(recipe)
            used_ids.add(recipe["id"])
            
            for tag in recipe_tags:
                used_tags[tag] += 1
            
            if len(selected) >= count:
                break
        
        return selected
    
    def _explain_match(
        self, 
        recipe: Dict[str, Any], 
        deficits: List[Dict[str, Any]]
    ) -> str:
        """
        Объясняет, почему рецепт подходит
        """
        tags = set(recipe.get("tags", []))
        matches = []
        
        for deficit in deficits:
            if deficit["marker"] in tags:
                matches.append(deficit["marker"])
        
        if not matches:
            return "Сбалансированное питание"
        
        # Переводим теги в читаемый вид
        tag_names = {
            "iron": "железо",
            "b12": "B12",
            "vitamin_d": "витамин D",
            "omega3": "омега-3",
            "glycemic_control": "контроль глюкозы",
            "ldl": "холестерин",
            "inflammation": "противовоспалительное",
        }
        
        readable = [tag_names.get(m, m) for m in matches[:3]]
        return "Полезно для: " + ", ".join(readable)
    
    def build_shopping_list(
        self,
        recipes: List[Dict[str, Any]],
        available_ingredients: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Создает список покупок на основе выбранных рецептов
        
        Args:
            recipes: Список рецептов
            available_ingredients: Уже имеющиеся ингредиенты
            
        Returns:
            Список покупок с количеством рецептов для каждого ингредиента
        """
        available_set = set((available_ingredients or []))
        ingredient_counts = defaultdict(int)
        ingredient_amounts = {}
        
        for recipe in recipes:
            for ing_detail in recipe.get("ingredients", []):
                ing_name = ing_detail["name"]
                
                # Пропускаем доступные и базовые ингредиенты
                if ing_name in available_set or ing_name.lower() in self.COMMON_PANTRY:
                    continue
                
                ingredient_counts[ing_name] += 1
                
                # Сохраняем количество из первого рецепта
                if ing_name not in ingredient_amounts:
                    ingredient_amounts[ing_name] = ing_detail.get("amount", "")
        
        # Формируем список покупок
        shopping_list = [
            {
                "ingredient": name,
                "count": count,
                "amount": ingredient_amounts.get(name, ""),
                "priority": "high" if count >= 3 else "medium" if count >= 2 else "low",
            }
            for name, count in sorted(
                ingredient_counts.items(), 
                key=lambda x: (-x[1], x[0])
            )
        ]
        
        return shopping_list
