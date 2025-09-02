from typing import Any, Dict, List

from .db import get_biomarker_rules

BIOMARKER_RULES: List[Dict[str, Any]] = [
    {
        "marker_key": "ferritin",
        "operator": "<",
        "threshold": 30,
        "deficit_tag": "iron",
        "reason_template": "low ferritin",
        "targets": {"iron": ">=18 mg/day", "vitamin_c": ">=75 mg/day"},
        "foods": ["beef", "liver", "shellfish", "lentils", "spinach", "citrus"],
    },
    {
        "marker_key": "b12",
        "operator": "<",
        "threshold": 300,
        "deficit_tag": "b12",
        "reason_template": "low B12",
        "targets": {"b12": ">2.4 mcg/day"},
        "foods": ["fish", "eggs", "dairy", "fortified plant milks"],
    },
    {
        "marker_key": "folate",
        "operator": "<",
        "threshold": 5,
        "deficit_tag": "folate",
        "reason_template": "low folate",
        "targets": {"folate": ">=400 mcg/day"},
        "foods": ["leafy greens", "legumes", "citrus"],
    },
    {
        "marker_key": "vitamin_d",
        "operator": "<",
        "threshold": 30,
        "deficit_tag": "vitamin_d",
        "reason_template": "low vitamin D",
        "targets": {"vitamin_d": "1000–2000 IU/day"},
        "foods": ["salmon", "mackerel", "eggs"],
    },
    {
        "marker_key": "hba1c",
        "operator": ">",
        "threshold": 5.6,
        "deficit_tag": "glycemic_control",
        "reason_template": "elevated HbA1c",
        "targets": {"fiber": "25–35 g/day", "protein": "1.2–1.6 g/kg"},
        "foods": ["legumes", "oats", "non-starchy vegetables", "vinegar before starch"],
    },
    {
        "marker_key": "ldl",
        "operator": ">",
        "threshold": 100,
        "deficit_tag": "ldl",
        "reason_template": "elevated LDL",
        "targets": {"soluble_fiber": "10–15 g/day", "omega3": "2–3 servings fish/week"},
        "foods": ["oats", "legumes", "olive oil", "nuts", "fish"],
    },
    {
        "marker_key": "triglycerides",
        "operator": ">",
        "threshold": 150,
        "deficit_tag": "triglycerides",
        "reason_template": "elevated TG",
        "targets": {"refined_carbs": "reduce", "omega3": "increase"},
        "foods": ["fish", "nuts", "less alcohol", "berries"],
    },
    {
        "marker_key": "crp",
        "operator": ">",
        "threshold": 3,
        "deficit_tag": "inflammation",
        "reason_template": "elevated CRP",
        "targets": {"anti_inflammatory": "pattern"},
        "foods": ["olive oil", "nuts", "fish", "berries", "vegetables"],
    },
]


def analyze_biomarkers(labs: Dict[str, float]) -> List[Dict[str, Any]]:
    deficits: List[Dict[str, Any]] = []
    rules = get_biomarker_rules()

    for rule in rules:
        lab_value = labs.get(rule["marker_key"])
        if lab_value is None:
            continue

        triggered = False
        if rule["operator"] == "<" and lab_value < rule["threshold"]:
            triggered = True
        elif rule["operator"] == ">" and lab_value > rule["threshold"]:
            triggered = True

        if triggered:
            deficits.append(
                {
                    "marker": rule["deficit_tag"],
                    "why": rule["reason_template"],
                    "targets": rule["targets"],
                    "foods": rule["foods"],
                }
            )

    return deficits


def vitamin_recommendations(labs: Dict[str, float], deficits: List[Dict[str, Any]]):
    recs = []
    markers = {d["marker"] for d in deficits}

    if "vitamin_d" in markers:
        recs.append({
            "name": "Vitamin D3",
            "dose": "1000–2000 IU/day",
            "note": "Adjust after re-test; take with fat.",
        })
    if "b12" in markers:
        recs.append({
            "name": "Vitamin B12",
            "dose": "500–1000 mcg/day (if vegan) or per need",
            "note": "Sublingual acceptable.",
        })
    if "iron" in markers:
        recs.append({
            "name": "Iron (bisglycinate)",
            "dose": "18–27 mg/day",
            "note": "Away from coffee/tea and calcium; confirm with doctor if severe.",
        })
    if "triglycerides" in markers or "ldl" in markers:
        recs.append({
            "name": "Omega-3 (EPA/DHA)",
            "dose": "1–2 g/day",
            "note": "Or fish 2–3x/week.",
        })

    recs.append({
        "disclaimer": "Educational use only. Not medical advice. Re-test in 8–12 weeks."
    })
    return recs
