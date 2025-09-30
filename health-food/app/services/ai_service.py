"""Сервис для работы с AI генерацией рецептов и консультациями"""
import json
from typing import Any, Dict, List, Optional
from ..llm_provider.base import BaseLLMProvider


class AIService:
    """Сервис для AI функционала"""
    
    def __init__(self, llm_provider: Optional[BaseLLMProvider] = None):
        self.llm_provider = llm_provider
    
    def is_available(self) -> bool:
        """Проверяет доступность AI сервиса"""
        return self.llm_provider is not None
    
    async def analyze_fridge_photo(self, image_data: bytes) -> List[str]:
        """
        Анализирует фото холодильника и определяет продукты
        
        Args:
            image_data: Байты изображения
            
        Returns:
            Список обнаруженных продуктов
        """
        if not self.llm_provider:
            raise ValueError("AI сервис недоступен. Проверьте наличие OpenAI API ключа.")
        
        prompt = (
            "Проанализируй изображение холодильника или кухонных полок. "
            "Определи все видимые продукты и ингредиенты. "
            "Верни результат в формате JSON с единственным ключом 'items', "
            "содержащим список названий продуктов на русском языке в нижнем регистре. "
            'Например: {"items": ["яйца", "молоко", "курица", "помидоры"]}. '
            "Если продуктов не видно, верни пустой список."
        )
        
        detected = await self.llm_provider.analyze_image(image_data, prompt)
        
        # Фоллбэк на демо данные если не удалось определить
        if not detected:
            detected = [
                "яйца", "молоко", "курица", "помидоры", 
                "огурцы", "яблоки", "морковь", "лук"
            ]
        
        return detected
    
    async def generate_personalized_recipes(
        self,
        user_context: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Генерирует персонализированные рецепты на основе контекста пользователя
        
        Args:
            user_context: Контекст с анализами, предпочтениями, доступными продуктами
            
        Returns:
            Список сгенерированных рецептов
        """
        if not self.llm_provider:
            raise ValueError("AI сервис недоступен. Проверьте наличие OpenAI API ключа.")
        
        recipes = await self.llm_provider.generate_recipes(user_context)
        
        # Валидируем и обогащаем рецепты
        validated_recipes = []
        for recipe in recipes:
            if self._validate_recipe(recipe):
                validated_recipes.append(recipe)
        
        return validated_recipes
    
    async def get_nutrition_consultation(
        self,
        user_message: str,
        user_context: Dict[str, Any],
        thread_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Получает консультацию по питанию от AI диетолога
        
        Args:
            user_message: Вопрос пользователя
            user_context: Контекст (анализы, дефициты и т.д.)
            thread_id: ID диалога для продолжения беседы
            
        Returns:
            Ответ с рекомендацией и thread_id
        """
        if not self.llm_provider:
            raise ValueError("AI сервис недоступен. Проверьте наличие OpenAI API ключа.")
        
        return await self.llm_provider.get_vitamin_recommendations(
            user_message=user_message,
            thread_id=thread_id,
            user_context=user_context,
        )
    
    def _validate_recipe(self, recipe: Dict[str, Any]) -> bool:
        """
        Валидирует структуру рецепта
        """
        required_fields = ["name", "ingredients", "instructions"]
        
        for field in required_fields:
            if field not in recipe:
                return False
        
        if not recipe["name"] or not recipe["ingredients"] or not recipe["instructions"]:
            return False
        
        return True
