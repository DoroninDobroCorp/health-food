import sqlite3
import json
from pathlib import Path
from typing import Optional, Dict, Any, List

DB_PATH = Path(__file__).resolve().parent.parent / "data.db"


def get_conn():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            name TEXT,
            email TEXT,
            goals TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS labs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id INTEGER DEFAULT 1,
            data_json TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id INTEGER DEFAULT 1,
            due_at TEXT NOT NULL,
            kind TEXT NOT NULL,
            note TEXT,
            done INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()


def get_profile() -> Dict[str, Any]:
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("SELECT id, name, email, goals FROM profiles WHERE id = 1").fetchone()
    conn.close()
    if not row:
        return {"id": 1, "name": "", "email": "", "goals": ""}
    return dict(row)


def save_profile(name: str = "", email: str = "", goals: str = "") -> Dict[str, Any]:
    conn = get_conn()
    cur = conn.cursor()
    existing = cur.execute("SELECT id FROM profiles WHERE id = 1").fetchone()
    if existing:
        cur.execute(
            "UPDATE profiles SET name=?, email=?, goals=?, updated_at=CURRENT_TIMESTAMP WHERE id=1",
            (name, email, goals),
        )
    else:
        cur.execute(
            "INSERT INTO profiles (id, name, email, goals) VALUES (1, ?, ?, ?)",
            (name, email, goals),
        )
    conn.commit()
    conn.close()
    return get_profile()


def save_labs_and_schedule(labs: Dict[str, Any], weeks_from_now: int = 10, note: str = "Re-test labs") -> Dict[str, Any]:
    import datetime as dt
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO labs (profile_id, data_json) VALUES (1, ?)", (json.dumps(labs),))
    due_date = dt.datetime.utcnow() + dt.timedelta(weeks=weeks_from_now)
    cur.execute(
        "INSERT INTO reminders (profile_id, due_at, kind, note) VALUES (1, ?, ?, ?)",
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
        "SELECT id, due_at, kind, note, done FROM reminders WHERE done=0 AND due_at BETWEEN ? AND ? ORDER BY due_at ASC",
        (now.strftime("%Y-%m-%dT%H:%M:%SZ"), until.strftime("%Y-%m-%dT%H:%M:%SZ")),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def complete_reminder(reminder_id: int) -> Dict[str, Any]:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE reminders SET done=1 WHERE id=?", (reminder_id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}
