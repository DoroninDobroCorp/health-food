from sqlite3 import Connection
from typing import Optional

from . import schemas
from .security import get_password_hash


class UserCRUD:
    def get_user_by_email(self, conn: Connection, email: str) -> Optional[schemas.UserInDB]:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = ?", (email,))
        user_data = cur.fetchone()
        if user_data:
            return schemas.UserInDB(**dict(user_data))
        return None

    def get_user_by_username(self, conn: Connection, username: str) -> Optional[schemas.UserInDB]:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = ?", (username,))
        user_data = cur.fetchone()
        if user_data:
            return schemas.UserInDB(**dict(user_data))
        return None


    def create_user(self, conn: Connection, user: schemas.UserCreate) -> schemas.User:
        hashed_password = get_password_hash(user.password)
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?)",
            (user.username, user.email, hashed_password),
        )
        conn.commit()
        user_id = cur.lastrowid
        return schemas.User(id=user_id, username=user.username, email=user.email)

user_crud = UserCRUD()
