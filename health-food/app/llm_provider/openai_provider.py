import base64
import json
import os
from typing import Any, Dict, List

from agents import Agent, Runner
from openai import OpenAI

from .base import BaseLLMProvider


class OpenAIProvider(BaseLLMProvider):
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.assistant_id = os.getenv("OPENAI_ASSISTANT_ID")
        self.nutrition_agent = self._create_nutrition_agent()
        self.recipe_agent = self._create_recipe_agent()

    def _create_nutrition_agent(self):
        """Создает агента для рекомендаций по добавкам на основе анализов"""
        return Agent(
            name="AI-Диетолог",
            instructions="""Ты опытный диетолог и эксперт по нутрициологии. 
            
            Твоя задача - давать персонализированные рекомендации по витаминам, минералам и питанию на основе анализов крови пользователя.
            
            КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
            1. 📊 АНАЛИЗИРУЙ ДАННЫЕ: Всегда начинай с анализа предоставленных показателей. Указывай конкретные значения и отклонения от нормы.
            
            2. 🎯 ПРИОРИТЕЗИРУЙ: Выдели 2-3 самых важных дефицита/проблемы. Не перегружай информацией.
            
            3. 💊 КОНКРЕТНЫЕ РЕКОМЕНДАЦИИ:
               - Название добавки
               - Дозировка (с диапазоном)
               - Лучшая форма (например, "цитрат магния", "метилкобаламин B12")
               - Когда и как принимать
               - С чем комбинировать или избегать
            
            4. 🍎 ПИТАНИЕ ПЕРВИЧНО: Всегда упоминай продукты-источники перед добавками.
            
            5. ⚠️ СВЯЗЬ С СИМПТОМАМИ: Объясняй, какие симптомы могут быть связаны с дефицитами (усталость, выпадение волос, проблемы с кожей и т.д.).
            
            6. 📅 ПЛАН ДЕЙСТВИЙ: Предложи четкий план - что делать сейчас, через месяц, через 3 месяца.
            
            7. ⚖️ БАЛАНС: Учитывай взаимодействия нутриентов (например, железо лучше с витамином C, но не с кальцием).
            
            8. 🔬 МЕДИЦИНСКАЯ ОГОВОРКА: Всегда завершай напоминанием о консультации с врачом, особенно при серьезных отклонениях.
            
            9. 💬 ТОНАЛЬНОСТЬ: Используй дружелюбный, поддерживающий тон. Пиши простым языком, избегай медицинского жаргона.
            
            10. 📝 ФОРМАТ: Структурируй ответ с эмодзи для читаемости, но без излишнего форматирования (не используй жирный текст или заголовки markdown).
            
            Если данных об анализах недостаточно, вежливо попроси уточнить конкретные показатели.
            """,
            model="gpt-4o",
        )

    def _create_recipe_agent(self):
        """Создает агента для генерации рецептов."""
        return Agent(
            name="AI-Шеф-повар",
            instructions="""Ты — AI-диетолог и шеф-повар. Твоя задача — сгенерировать 3 рецепта на основе предоставленных данных. 
            
            СТРОГИЕ ПРАВИЛА:
            1.  **ИСПОЛЬЗУЙ ТОЛЬКО ДОСТУПНЫЕ ПРОДУКТЫ:** Рецепты должны состоять ИСКЛЮЧИТЕЛЬНО из продуктов, перечисленных в `user_context.preferences.available`. НЕ ДОБАВЛЯЙ никаких других ингредиентов, кроме базовых специй (соль, перец).
            2.  **УЧИТЫВАЙ АНАЛИЗЫ И ПРЕДПОЧТЕНИЯ:** Рецепты должны быть максимально полезны с учетом анализов (`labs`) и соответствовать диетическим предпочтениям (`preferences`).
            3.  **СОБЛЮДАЙ СЛОЖНОСТЬ:** Уровень сложности (`difficulty`) должен отражаться в рецептах.
            4.  **СТРОГИЙ JSON ФОРМАТ:** Ответ должен быть ТОЛЬКО в формате JSON без каких-либо пояснений до или после. JSON-объект должен содержать один ключ `recipes`, значение которого — это список из ТРЁХ объектов-рецептов. Несоблюдение формата сделает твой ответ бесполезным.
            5.  **ПИШИ ТОЛЬКО ДЕЙСТВИТЕЛЬНЫЕ РЕЦЕПТЫ:** Не пиши рецепты, которые невозможно приготовить, или те что не соответствуют анализу пользователя, а так же те, которые объективно будут не очень как по вкусу так и по полезности.
            6.  **ПОЛЯ РЕЦЕПТА:** Каждый объект-рецепт должен содержать следующие ключи:
                - `id` (string): Уникальный идентификатор (например, 'ai_recipe_123').
                - `name` (string): Название рецепта на русском языке.
                - `time_min` (integer): Время приготовления в минутах.
                - `description` (string): Краткое, привлекательное описание на русском.
                - `ingredients` (list of objects): Список ингредиентов из ДОСТУПНЫХ продуктов `{'name': '...', 'amount': '...'}`.
                - `instructions` (list of strings): Пошаговая инструкция.
                - `tags` (list of strings): Обязательно добавь теги 'ai_generated', тег сложности ('лёгкий', 'средний' или 'сложный') и нужен тег который будет указывать, какой\как витамин будет в рецепте.
                
            7.  **Логика:**
                *   **Учитывай биомаркеры:** Если есть дефициты, включай в рецепты продукты, богатые соответствующими витаминами и минералами. Если есть избытки — избегай продуктов, которые могут их усугубить.
                *   **Следуй предпочтениям:** Учитывай диетические ограничения (веган, без глютена и т.д.) и вкусовые предпочтения пользователя.
                *   **Используй продукты:** Основой рецептов должны быть перечисленные продукты. Можно добавлять базовые ингредиенты (соль, перец, масло, специи), но основные должны быть из списка.
                *   **Сложность:** Рецепты должны соответствовать выбранному уровню сложности:
                    *   **легкий:** Быстрые и простые блюда (до 30 мин), минимум шагов.
                    *   **средний:** Более интересные рецепты (30-60 мин) с несколькими этапами приготовления.
                    *   **сложный:** Изысканные блюда (от 60 мин), требующие внимания к деталям и техникам.
            """,
            model="gpt-4o-mini",
        )

    async def analyze_image(self, image_data: bytes, prompt: str) -> List[str]:
        base64_image = base64.b64encode(image_data).decode("utf-8")
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                },
                            },
                        ],
                    }
                ],
            )
            content = response.choices[0].message.content
            if content:
                if content.startswith("```json"):
                    content = content[7:-3]
                data = json.loads(content)
                return data.get("items", [])
        except Exception as e:
            print(f"Failed to analyze image with OpenAI: {e}")
        return []
        # return [
        #     "овсянка",
        #     "яйца",
        #     "рыба",
        #     "яблоки",
        #     "оливковое масло",
        #     "кукуруза",
        #     "рис",
        #     "томаты",
        #     "шпинат",
        # ]

    # async def get_assistant_response(
    #     self, thread_id: str, user_message: str, user_context: dict
    # ) -> dict:
    #     if not self.assistant_id:
    #         return {"error": "Assistant ID not configured"}

    #     if not thread_id:
    #         full_message = (
    #             f"Вот контекст о пользователе:\n{json.dumps(user_context, indent=2, ensure_ascii=False)}\n\n"
    #             f"Сообщение пользователя: {user_message}"
    #         )
    #         thread = self.client.beta.threads.create(
    #             messages=[{"role": "user", "content": full_message}]
    #         )
    #         thread_id = thread.id
    #     else:
    #         self.client.beta.threads.messages.create(
    #             thread_id=thread_id, role="user", content=user_message
    #         )

    #     run = self.client.beta.threads.runs.create(
    #         thread_id=thread_id, assistant_id=self.assistant_id
    #     )

    #     while run.status not in ["completed", "failed"]:
    #         time.sleep(1)
    #         run = self.client.beta.threads.runs.retrieve(
    #             thread_id=thread_id, run_id=run.id
    #         )

    #     if run.status == "failed":
    #         return {"error": "Assistant run failed."}

    #     messages = self.client.beta.threads.messages.list(thread_id=thread_id)

    #     assistant_reply = "No response from assistant."
    #     if messages.data and messages.data[0].content:
    #         assistant_reply = messages.data[0].content[0].text.value

    #     return {"reply": assistant_reply, "thread_id": thread_id}

    async def generate_recipes(
        self, user_context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        try:
            prompt = (
                "Сгенерируй рецепты на основе следующих данных от пользователя:\n"
                f"{json.dumps(user_context, indent=2, ensure_ascii=False)}\n\n"
                "Следуй моим системным инструкциям и верни ТОЛЬКО JSON."
            )

            result = await Runner.run(self.recipe_agent, prompt)
            content = result.final_output

            if content:
                if content.startswith("```json"):
                    content = content[7:-3]

                data = json.loads(content)
                return data.get("recipes", [])

            return []
        except Exception as e:
            print(f"Failed to generate recipes with agent: {e}")
            return []
        # return [
        #     {
        #         "id": "1",
        #         "name": "Овсянка с яйцами",
        #         "time_min": 10,
        #         "description": "Легкий завтрак с богатым содержанием белка и клетчатки",
        #     },
        #     {
        #         "id": "2",
        #         "name": "Рыба с рисом",
        #         "time_min": 20,
        #         "description": "Питательное блюдо с высоким содержанием белка и омега-3",
        #     },
        #     {
        #         "id": "3",
        #         "name": "Яблоки с оливковым маслом",
        #         "time_min": 5,
        #         "description": "Легкий перекус с богатым содержанием клетчатки и витамина C",
        #     },
        # ]

    async def get_vitamin_recommendations(
        self, user_message: str, thread_id: str, user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Получает рекомендации по витаминам от агента на основе анализов пользователя.

        Args:
            user_message: Сообщение пользователя
            thread_id: Идентификатор диалога или None для нового диалога
            user_context: Контекст пользователя (анализы, дефициты, предпочтения)

        Returns:
            Dict с ответом агента и id диалога
        """
        try:
            prompt = f"""
            Контекст о пользователе:
            Анализы: {json.dumps(user_context.get("labs", {}), ensure_ascii=False)}
            Дефициты: {json.dumps(user_context.get("deficits", {}), ensure_ascii=False)}
            Предпочтения: {json.dumps(user_context.get("preferences", {}), ensure_ascii=False)}
            
            Вопрос пользователя: {user_message}
            """

            result = await Runner.run(self.nutrition_agent, prompt)

            return {
                "reply": result.final_output,
                "thread_id": thread_id or "nutrition-agent",
            }
        except Exception as e:
            print(f"Error in vitamins recommendations: {str(e)}")
            raise e
