import json
import uuid
from sqlite3 import Connection
from typing import List, Optional

from . import schemas


def _row_to_recipe(row) -> Optional[schemas.Recipe]:
    if row is None:
        return None
    
    recipe_dict = dict(row)
    recipe_dict["ingredients"] = json.loads(recipe_dict.get("ingredients", "[]") or "[]")
    recipe_dict["instructions"] = json.loads(recipe_dict.get("instructions", "[]") or "[]")
    recipe_dict["tags"] = json.loads(recipe_dict.get("tags", "[]") or "[]")
    return schemas.Recipe(**recipe_dict)


class RecipeCRUD:
    def create_user_recipe(
        self, conn: Connection, recipe: schemas.RecipeCreate, user_id: int
    ) -> schemas.Recipe:
        recipe_id = f"custom_{uuid.uuid4().hex[:8]}"
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO recipes (id, user_id, name, time_min, description, ingredients, instructions, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                recipe_id,
                user_id,
                recipe.name,
                recipe.time_min,
                recipe.description,
                json.dumps([i.dict() for i in recipe.ingredients]),
                json.dumps(recipe.instructions),
                json.dumps(recipe.tags),
            ),
        )
        conn.commit()
        return self.get_recipe(conn, recipe_id)

    def get_recipe(self, conn: Connection, recipe_id: str) -> Optional[schemas.Recipe]:
        cur = conn.cursor()
        cur.execute("SELECT * FROM recipes WHERE id = ?", (recipe_id,))
        row = cur.fetchone()
        return _row_to_recipe(row)

    def get_user_recipes(self, conn: Connection, user_id: int) -> List[schemas.Recipe]:
        cur = conn.cursor()
        cur.execute("SELECT * FROM recipes WHERE user_id = ? OR user_id IS NULL", (user_id,))
        rows = cur.fetchall()
        return [_row_to_recipe(row) for row in rows]

    def update_recipe(
        self, conn: Connection, recipe_id: str, recipe_in: schemas.RecipeUpdate
    ) -> Optional[schemas.Recipe]:
        update_data = recipe_in.dict(exclude_unset=True)
        
        # Serialize JSON fields
        for field in ["ingredients", "instructions", "tags"]:
            if field in update_data:
                update_data[field] = json.dumps(update_data[field])

        if not update_data:
            return self.get_recipe(conn, recipe_id)
            
        set_clause = ", ".join([f"{key} = ?" for key in update_data.keys()])
        params = list(update_data.values())
        params.append(recipe_id)

        cur = conn.cursor()
        cur.execute(f"UPDATE recipes SET {set_clause} WHERE id = ?", tuple(params))
        conn.commit()
        
        return self.get_recipe(conn, recipe_id)

    def delete_recipe(self, conn: Connection, recipe_id: str) -> bool:
        cur = conn.cursor()
        cur.execute("DELETE FROM recipes WHERE id = ?", (recipe_id,))
        conn.commit()
        return cur.rowcount > 0

recipe_crud = RecipeCRUD()
