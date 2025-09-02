from abc import ABC, abstractmethod
from typing import Any, Dict, List


class BaseLLMProvider(ABC):
    @abstractmethod
    async def analyze_image(self, image_data: bytes, prompt: str) -> List[str]:
        """
        Analyzes an image and returns a list of detected items based on the prompt.

        :param image_data: The image data in bytes.
        :param prompt: The instruction or question for the model.
        :return: A list of strings representing the detected items.
        """
        pass

    @abstractmethod
    async def generate_recipes(
        self, user_context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generates a list of recipes based on user context.

        :param user_context: A dictionary containing user's labs, preferences, etc.
        :return: A list of recipe dictionaries.
        """
        pass

    @abstractmethod
    async def get_vitamin_recommendations(
        self, user_message: str, thread_id: str, user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Gets vitamin and supplement recommendations based on user's lab results.

        :param user_message: The user's message or query.
        :param thread_id: The thread ID for continuing a conversation, or None for a new one.
        :param user_context: A dictionary containing user's labs, deficits, preferences, etc.
        :return: A dictionary with the recommendation reply and thread ID.
        """
        pass
