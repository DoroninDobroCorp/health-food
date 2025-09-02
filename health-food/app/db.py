import json
import sqlite3
import uuid
from pathlib import Path
from typing import Any, Dict, List

DB_PATH = Path(__file__).resolve().parent.parent / "data.db"


def get_conn():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _seed_data(conn):
    from .recipe_utils import RECIPE_DB
    from .restaurants import RESTAURANTS_DB
    from .rules import BIOMARKER_RULES

    cur = conn.cursor()
    # Create a default user - REMOVED for auth implementation

    # Seed recipes
    for recipe in RECIPE_DB:
        cur.execute(
            """
            INSERT OR IGNORE INTO recipes (id, user_id, name, time_min, description, ingredients, instructions, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                recipe["id"],
                None,  # Public recipe
                recipe["name"],
                recipe.get("time_min"),
                recipe.get("description"),
                json.dumps(recipe.get("ingredients", [])),
                json.dumps(recipe.get("instructions", [])),
                json.dumps(recipe.get("tags", [])),
            ),
        )

    # Seed restaurants and dishes
    for restaurant in RESTAURANTS_DB:
        cur.execute("SELECT id FROM restaurants WHERE id = ?", (restaurant["id"],))
        if cur.fetchone():
            continue  # Skip if restaurant already exists

        cur.execute(
            "INSERT INTO restaurants (id, name, lat, lon) VALUES (?, ?, ?, ?)",
            (
                restaurant["id"],
                restaurant["name"],
                restaurant["lat"],
                restaurant["lon"],
            ),
        )
        restaurant_id = restaurant["id"]
        for dish in restaurant.get("dishes", []):
            cur.execute(
                "INSERT INTO dishes (restaurant_id, name, nutrients) VALUES (?, ?, ?)",
                (restaurant_id, dish["name"], json.dumps(dish.get("nutrients", {}))),
            )

    # Seed biomarker rules
    cur.execute("DELETE FROM biomarker_rules")
    for rule in BIOMARKER_RULES:
        cur.execute(
            """
            INSERT INTO biomarker_rules (marker_key, operator, threshold, deficit_tag, reason_template, targets, foods)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                rule["marker_key"],
                rule["operator"],
                rule["threshold"],
                rule["deficit_tag"],
                rule["reason_template"],
                json.dumps(rule.get("targets", {})),
                json.dumps(rule.get("foods", [])),
            ),
        )

    conn.commit()


def init_db():
    conn = get_conn()
    cur = conn.cursor()

    # Main tables
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            goals TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS recipes (
            id TEXT PRIMARY KEY,
            user_id INTEGER,
            name TEXT NOT NULL,
            time_min INTEGER,
            description TEXT,
            ingredients TEXT,
            instructions TEXT,
            tags TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS restaurants (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            lat REAL NOT NULL,
            lon REAL NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS dishes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            restaurant_id TEXT,
            name TEXT NOT NULL,
            nutrients TEXT,
            FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS biomarker_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            marker_key TEXT NOT NULL,
            operator TEXT NOT NULL,
            threshold REAL NOT NULL,
            deficit_tag TEXT NOT NULL,
            reason_template TEXT,
            targets TEXT,
            foods TEXT
        )
        """
    )

    # Dependent tables
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS labs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            data_json TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            due_at TEXT NOT NULL,
            kind TEXT NOT NULL,
            note TEXT,
            done INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        """
    )
    conn.commit()

    # Seed initial data
    _seed_data(conn)

    conn.close()


def save_labs_and_schedule(
    labs: Dict[str, Any], weeks_from_now: int = 10, note: str = "Re-test labs"
) -> Dict[str, Any]:
    import datetime as dt

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO labs (user_id, data_json) VALUES (1, ?)", (json.dumps(labs),)
    )
    due_date = dt.datetime.utcnow() + dt.timedelta(weeks=weeks_from_now)
    cur.execute(
        "INSERT INTO reminders (user_id, due_at, kind, note) VALUES (1, ?, ?, ?)",
        (due_date.strftime("%Y-%m-%dT%H:%M:%SZ"), "labs_retest", note),
    )
    conn.commit()
    conn.close()
    return {"status": "ok", "due_at": due_date.strftime("%Y-%m-%dT%H:%M:%SZ")}


def get_upcoming_reminders(days: int = 120) -> List[Dict[str, Any]]:
    import datetime as dt

    now = dt.datetime.utcnow()
    until = now + dt.timedelta(days=days)
    conn = get_conn()
    cur = conn.cursor()
    rows = cur.execute(
        "SELECT id, due_at, kind, note, done FROM reminders WHERE done=0 AND user_id = 1 AND due_at BETWEEN ? AND ? ORDER BY due_at ASC",
        (now.strftime("%Y-%m-%dT%H:%M:%SZ"), until.strftime("%Y-%m-%dT%H:%M:%SZ")),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_restaurants_with_dishes() -> List[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()

    restaurants = {}

    rows = cur.execute("SELECT id, name, lat, lon FROM restaurants").fetchall()
    for row in rows:
        restaurants[row["id"]] = dict(row)
        restaurants[row["id"]]["dishes"] = []

    dish_rows = cur.execute(
        "SELECT restaurant_id, name, nutrients FROM dishes"
    ).fetchall()
    for dish_row in dish_rows:
        res_id = dish_row["restaurant_id"]
        if res_id in restaurants:
            dish = dict(dish_row)
            dish["nutrients"] = json.loads(dish["nutrients"])
            restaurants[res_id]["dishes"].append(dish)

    conn.close()
    return list(restaurants.values())


def get_biomarker_rules() -> List[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    rows = cur.execute("SELECT * FROM biomarker_rules").fetchall()
    conn.close()

    rules = []
    for row in rows:
        rule = dict(row)
        rule["targets"] = json.loads(rule["targets"])
        rule["foods"] = json.loads(rule["foods"])
        rules.append(rule)
    return rules


def get_public_recipes() -> List[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    rows = cur.execute("SELECT * FROM recipes WHERE user_id IS NULL").fetchall()
    conn.close()

    recipes = []
    for row in rows:
        recipe = dict(row)
        recipe["ingredients"] = json.loads(recipe["ingredients"])
        recipe["instructions"] = json.loads(recipe["instructions"])
        recipe["tags"] = json.loads(recipe["tags"])
        recipes.append(recipe)
    return recipes


def save_user_recipe(conn: sqlite3.Connection, user_id: int, recipe: Dict[str, Any]) -> Dict[str, Any]:
    """Saves a new recipe for a specific user."""
    cur = conn.cursor()

    recipe_id = recipe.get("id", f"ai_{uuid.uuid4().hex[:8]}")

    cur.execute(
        """
        INSERT INTO recipes (id, user_id, name, time_min, description, ingredients, instructions, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            recipe_id,
            user_id,
            recipe.get("name"),
            recipe.get("time_min"),
            recipe.get("description"),
            json.dumps(recipe.get("ingredients", [])),
            json.dumps(recipe.get("instructions", [])),
            json.dumps(recipe.get("tags", [])),
        ),
    )
    conn.commit()

    saved_recipe = recipe.copy()
    saved_recipe["id"] = recipe_id
    saved_recipe["user_id"] = user_id

    return saved_recipe


def save_profile(name: str = "", email: str = "", goals: str = "", user_id: int = None) -> Dict[str, Any]:
    """Updates user profile information (name, email, and goals)."""
    conn = get_conn()
    cur = conn.cursor()
    
    cur.execute(
        """
        UPDATE users 
        SET username = ?, email = ?, goals = ?
        WHERE id = ?
        """,
        (name, email, goals, user_id)
    )
    conn.commit()
    
    result = {
        "username": name,
        "email": email,
        "goals": goals
    }
    
    conn.close()
    return result


