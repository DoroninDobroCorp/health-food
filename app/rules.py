from typing import Dict, Any, List

# Very simplified thresholds (example values for MVP; not medical advice)
DEFAULT_RANGES = {
    "ferritin": (30, 150),
    "vitamin_d": (30, 60),  # ng/mL
    "b12": (300, 900),
    "folate": (5, 20),  # ng/mL
    "ldl": (0, 100),  # mg/dL
    "triglycerides": (0, 150),
    "hba1c": (4.8, 5.6),
    "crp": (0, 3),
}


def analyze_biomarkers(labs: Dict[str, float]) -> List[Dict[str, Any]]:
    deficits: List[Dict[str, Any]] = []

    def add_deficit(name: str, why: str, targets: Dict[str, Any], foods: List[str]):
        deficits.append({"marker": name, "why": why, "targets": targets, "foods": foods})

    ferritin = labs.get("ferritin")
    if ferritin is not None and ferritin < DEFAULT_RANGES["ferritin"][0]:
        add_deficit(
            "iron",
            "low ferritin",
            {"iron": ">=18 mg/day", "vitamin_c": ">=75 mg/day"},
            ["beef", "liver", "shellfish", "lentils", "spinach", "citrus"],
        )

    b12 = labs.get("b12")
    if b12 is not None and b12 < DEFAULT_RANGES["b12"][0]:
        add_deficit(
            "b12",
            "low B12",
            {"b12": ">2.4 mcg/day"},
            ["fish", "eggs", "dairy", "fortified plant milks"],
        )

    folate = labs.get("folate")
    if folate is not None and folate < DEFAULT_RANGES["folate"][0]:
        add_deficit(
            "folate",
            "low folate",
            {"folate": ">=400 mcg/day"},
            ["leafy greens", "legumes", "citrus"],
        )

    vitd = labs.get("vitamin_d")
    if vitd is not None and vitd < DEFAULT_RANGES["vitamin_d"][0]:
        add_deficit(
            "vitamin_d",
            "low vitamin D",
            {"vitamin_d": "1000–2000 IU/day"},
            ["salmon", "mackerel", "eggs"],
        )

    hba1c = labs.get("hba1c")
    if hba1c is not None and hba1c > DEFAULT_RANGES["hba1c"][1]:
        add_deficit(
            "glycemic_control",
            "elevated HbA1c",
            {"fiber": "25–35 g/day", "protein": "1.2–1.6 g/kg"},
            ["legumes", "oats", "non-starchy vegetables", "vinegar before starch"],
        )

    ldl = labs.get("ldl")
    if ldl is not None and ldl > DEFAULT_RANGES["ldl"][1]:
        add_deficit(
            "ldl",
            "elevated LDL",
            {"soluble_fiber": "10–15 g/day", "omega3": "2–3 servings fish/week"},
            ["oats", "legumes", "olive oil", "nuts", "fish"],
        )

    tg = labs.get("triglycerides")
    if tg is not None and tg > DEFAULT_RANGES["triglycerides"][1]:
        add_deficit(
            "triglycerides",
            "elevated TG",
            {"refined_carbs": "reduce", "omega3": "increase"},
            ["fish", "nuts", "less alcohol", "berries"],
        )

    crp = labs.get("crp")
    if crp is not None and crp > DEFAULT_RANGES["crp"][1]:
        add_deficit(
            "inflammation",
            "elevated CRP",
            {"anti_inflammatory": "pattern"},
            ["olive oil", "nuts", "fish", "berries", "vegetables"],
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
