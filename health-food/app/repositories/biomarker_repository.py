"""Repository для работы с биомаркерами и правилами"""
import json
import sqlite3
from typing import Any, Dict, List


class BiomarkerRepository:
    """Репозиторий для работы с правилами биомаркеров"""
    
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn
        self.conn.row_factory = sqlite3.Row
    
    def get_all_rules(self) -> List[Dict[str, Any]]:
        """Получить все правила биомаркеров"""
        cur = self.conn.cursor()
        rows = cur.execute("SELECT * FROM biomarker_rules").fetchall()
        
        rules = []
        for row in rows:
            rule = dict(row)
            rule["targets"] = json.loads(rule["targets"])
            rule["foods"] = json.loads(rule["foods"])
            rules.append(rule)
        
        return rules
    
    def create_rule(self, rule: Dict[str, Any]) -> int:
        """Создать новое правило биомаркера"""
        cur = self.conn.cursor()
        cur.execute(
            """
            INSERT INTO biomarker_rules 
            (marker_key, operator, threshold, deficit_tag, reason_template, targets, foods)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                rule["marker_key"],
                rule["operator"],
                rule["threshold"],
                rule["deficit_tag"],
                rule["reason_template"],
                json.dumps(rule.get("targets", {}), ensure_ascii=False),
                json.dumps(rule.get("foods", []), ensure_ascii=False),
            ),
        )
        self.conn.commit()
        return cur.lastrowid
    
    def delete_all_rules(self):
        """Удалить все правила (для пересоздания)"""
        cur = self.conn.cursor()
        cur.execute("DELETE FROM biomarker_rules")
        self.conn.commit()
