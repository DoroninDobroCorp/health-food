"""Сервис для анализа биомаркеров и генерации рекомендаций"""
from typing import Any, Dict, List
from ..repositories.biomarker_repository import BiomarkerRepository


class BiomarkerService:
    """Сервис анализа биомаркеров"""
    
    def __init__(self, repository: BiomarkerRepository):
        self.repository = repository
    
    def analyze_labs(self, labs: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Анализирует результаты лабораторных анализов
        
        Args:
            labs: Словарь с биомаркерами и их значениями
            
        Returns:
            Список выявленных дефицитов и проблем
        """
        deficits = []
        rules = self.repository.get_all_rules()
        
        for rule in rules:
            lab_value = labs.get(rule["marker_key"])
            if lab_value is None:
                continue
            
            triggered = self._check_rule(lab_value, rule["operator"], rule["threshold"])
            
            if triggered:
                deficits.append({
                    "marker": rule["deficit_tag"],
                    "marker_key": rule["marker_key"],
                    "value": lab_value,
                    "threshold": rule["threshold"],
                    "operator": rule["operator"],
                    "why": rule["reason_template"],
                    "targets": rule["targets"],
                    "foods": rule["foods"],
                    "severity": self._calculate_severity(
                        lab_value, rule["threshold"], rule["operator"]
                    ),
                })
        
        # Сортируем по серьезности
        deficits.sort(key=lambda x: x["severity"], reverse=True)
        
        return deficits
    
    def _check_rule(self, value: float, operator: str, threshold: float) -> bool:
        """Проверяет срабатывание правила"""
        if operator == "<":
            return value < threshold
        elif operator == ">":
            return value > threshold
        elif operator == "<=":
            return value <= threshold
        elif operator == ">=":
            return value >= threshold
        return False
    
    def _calculate_severity(self, value: float, threshold: float, operator: str) -> float:
        """
        Рассчитывает серьезность отклонения (0-1)
        Чем больше значение, тем серьезнее проблема
        """
        if operator == "<":
            # Насколько ниже порога (в процентах)
            deviation = (threshold - value) / threshold
        elif operator == ">":
            # Насколько выше порога (в процентах)
            deviation = (value - threshold) / threshold
        else:
            return 0.5
        
        # Ограничиваем от 0 до 1
        return min(max(deviation, 0), 1)
    
    def generate_vitamin_recommendations(
        self, labs: Dict[str, float], deficits: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Генерирует рекомендации по витаминам на основе анализов
        
        Args:
            labs: Лабораторные анализы
            deficits: Выявленные дефициты
            
        Returns:
            Список рекомендаций по добавкам
        """
        recommendations = []
        markers = {d["marker"] for d in deficits}
        
        # Витамин D
        if "vitamin_d" in markers:
            severity = next((d["severity"] for d in deficits if d["marker"] == "vitamin_d"), 0.5)
            dose = "2000-4000 IU/day" if severity > 0.5 else "1000-2000 IU/day"
            recommendations.append({
                "name": "Витамин D3",
                "dose": dose,
                "priority": "high" if severity > 0.5 else "medium",
                "note": "Принимать с жирной пищей для лучшего усвоения. Проверить уровень через 2-3 месяца.",
                "form": "Холекальциферол (D3)",
            })
        
        # B12
        if "b12" in markers:
            severity = next((d["severity"] for d in deficits if d["marker"] == "b12"), 0.5)
            recommendations.append({
                "name": "Витамин B12",
                "dose": "1000 mcg/day (сублингвально)" if severity > 0.5 else "500 mcg/day",
                "priority": "high" if severity > 0.5 else "medium",
                "note": "Метилкобаламин или цианокобаламин. Можно принимать сублингвально.",
                "form": "Метилкобаламин (предпочтительно)",
            })
        
        # Железо
        if "iron" in markers:
            severity = next((d["severity"] for d in deficits if d["marker"] == "iron"), 0.5)
            recommendations.append({
                "name": "Железо",
                "dose": "18-27 mg/day элементарного железа",
                "priority": "high",
                "note": "Бисглицинат железа (хелатная форма) - меньше побочных эффектов. Принимать отдельно от кофе, чая, кальция. С витамином C для лучшего усвоения.",
                "form": "Бисглицинат железа",
                "warning": "Проконсультируйтесь с врачом при сильном дефиците.",
            })
        
        # Фолат
        if "folate" in markers:
            recommendations.append({
                "name": "Фолат (B9)",
                "dose": "400-800 mcg/day",
                "priority": "medium",
                "note": "Метилфолат предпочтительнее фолиевой кислоты.",
                "form": "L-метилфолат",
            })
        
        # Омега-3 (при повышенных триглицеридах или холестерине)
        if "triglycerides" in markers or "ldl" in markers:
            recommendations.append({
                "name": "Омега-3 (EPA/DHA)",
                "dose": "1-2 g/day EPA+DHA",
                "priority": "medium",
                "note": "Рыбий жир высокого качества или водоросли (веганский вариант). Или 2-3 порции жирной рыбы в неделю.",
                "form": "Триглицеридная форма (предпочтительно)",
            })
        
        # Магний (при воспалении или проблемах с гликемией)
        if "inflammation" in markers or "glycemic_control" in markers:
            recommendations.append({
                "name": "Магний",
                "dose": "300-400 mg/day",
                "priority": "medium",
                "note": "Цитрат или глицинат магния. Улучшает контроль глюкозы и снижает воспаление.",
                "form": "Цитрат или глицинат магния",
            })
        
        # Добавляем дисклеймер
        recommendations.append({
            "disclaimer": "⚠️ Это информационные рекомендации, не медицинский совет. Обязательно проконсультируйтесь с врачом перед началом приема добавок. Повторите анализы через 8-12 недель для оценки эффективности."
        })
        
        return recommendations
