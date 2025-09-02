from sqlite3 import Connection

from fastapi import Depends, HTTPException, status

from ..auth import schemas as auth_schemas
from ..auth.dependencies import get_current_user
from ..db import get_conn
from . import crud, schemas


def get_recipe_for_user(
    recipe_id: str,
    conn: Connection = Depends(get_conn),
    current_user: auth_schemas.User = Depends(get_current_user),
) -> schemas.Recipe:
    recipe = crud.recipe_crud.get_recipe(conn, recipe_id=recipe_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    if recipe.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this recipe",
        )
    return recipe
