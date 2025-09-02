from typing import List, Optional
from pydantic import BaseModel


class Ingredient(BaseModel):
    name: str
    amount: str


class RecipeBase(BaseModel):
    name: str
    time_min: Optional[int] = None
    description: Optional[str] = None
    ingredients: Optional[List[Ingredient]] = []
    instructions: Optional[List[str]] = []
    tags: Optional[List[str]] = []


class RecipeCreate(RecipeBase):
    pass


class RecipeUpdate(RecipeBase):
    pass


class Recipe(RecipeBase):
    id: str
    user_id: Optional[int] = None

    class Config:
        from_attributes = True
