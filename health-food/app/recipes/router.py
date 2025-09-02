from sqlite3 import Connection
from typing import List

from fastapi import APIRouter, Depends, Response, status

from ..auth import schemas as auth_schemas
from ..auth.dependencies import get_current_user
from ..db import get_conn
from . import crud, schemas
from .dependencies import get_recipe_for_user

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.post("/", response_model=schemas.Recipe, status_code=status.HTTP_201_CREATED)
def create_recipe(
    recipe: schemas.RecipeCreate,
    conn: Connection = Depends(get_conn),
    current_user: auth_schemas.User = Depends(get_current_user),
):
    return crud.recipe_crud.create_user_recipe(
        conn=conn, recipe=recipe, user_id=current_user.id
    )


@router.get("/", response_model=List[schemas.Recipe])
def read_user_recipes(
    conn: Connection = Depends(get_conn),
    current_user: auth_schemas.User = Depends(get_current_user),
):
    return crud.recipe_crud.get_user_recipes(conn=conn, user_id=current_user.id)


@router.get("/{recipe_id}", response_model=schemas.Recipe)
def read_recipe(
    recipe: schemas.Recipe = Depends(get_recipe_for_user),
):
    return recipe


@router.put("/{recipe_id}", response_model=schemas.Recipe)
def update_recipe(
    recipe_in: schemas.RecipeUpdate,
    recipe: schemas.Recipe = Depends(get_recipe_for_user),
    conn: Connection = Depends(get_conn),
):
    return crud.recipe_crud.update_recipe(
        conn=conn, recipe_id=recipe.id, recipe_in=recipe_in
    )


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(
    recipe: schemas.Recipe = Depends(get_recipe_for_user),
    conn: Connection = Depends(get_conn),
):
    crud.recipe_crud.delete_recipe(conn=conn, recipe_id=recipe.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
