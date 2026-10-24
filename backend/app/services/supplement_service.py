from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.supplement import Supplement, SupplementIngredient
from app.schemas.intelligence_modules import SupplementCreate, NutrientIntakeItem

class SupplementService:
    NUTRIENT_EVIDENCE_DATABASE = {
        "vitamin_d": {
            "name": "Vitamin D3 (Cholecalciferol)",
            "benefits": "Supports intestinal calcium absorption, bone mineralization, and neuromuscular function.",
            "limitations": "Routine high-dose supplementation without documented 25(OH)D deficiency does not reduce cardiovascular events or non-vertebral fractures in healthy adults.",
            "safety": "Excessive intake (>4,000 IU/day chronically) risks hypercalcemia, nephrocalcinosis, and renal injury.",
            "upper_limit": "4000 IU/day (100 mcg/day)"
        },
        "vitamin_c": {
            "name": "Vitamin C (Ascorbic Acid)",
            "benefits": "Essential cofactor in collagen synthesis, tissue repair, and antioxidant scavenging.",
            "limitations": "Does not prevent common colds in the general population; megadoses (>2000 mg/day) may cause osmotic diarrhea and increase oxalate kidney stones.",
            "safety": "Caution in patients with history of calcium oxalate nephrolithiasis or hemochromatosis.",
            "upper_limit": "2000 mg/day"
        },
        "calcium": {
            "name": "Calcium (Elemental)",
            "benefits": "Critical for skeletal integrity, cardiac contractility, and synaptic transmission.",
            "limitations": "High-dose calcium supplementation (without dietary balance) has been associated with modest increases in vascular calcification in some cohort studies.",
            "safety": "May interfere with absorption of levothyroxine, iron, and fluoroquinolone antibiotics.",
            "upper_limit": "2000-2500 mg/day"
        },
        "zinc": {
            "name": "Zinc (Elemental)",
            "benefits": "Essential trace mineral for cellular metabolism, wound healing, and immune cell function.",
            "limitations": "Long-term excessive zinc intake (>40 mg/day) induces copper deficiency and subsequent microcytic anemia and neutropenia.",
            "safety": "Avoid prolonged supra-nutritional doses without copper monitoring.",
            "upper_limit": "40 mg/day"
        },
        "omega_3": {
            "name": "Omega-3 Fatty Acids (EPA/DHA)",
            "benefits": "Lowers serum triglycerides and reduces systemic inflammatory biomarkers.",
            "limitations": "High doses (>=4g/day) may increase risk of atrial fibrillation and minor bleeding tendencies.",
            "safety": "Monitor when co-administered with anticoagulants or antiplatelet therapies.",
            "upper_limit": "3000-4000 mg/day"
        },
        "iron": {
            "name": "Iron (Ferrous salts / heme)",
            "benefits": "Reverses iron-deficiency anemia, replenishing ferritin stores and hemoglobin synthesis.",
            "limitations": "Should only be taken when laboratory deficiency (ferritin/TSAT) is confirmed. Inappropriate intake causes gastrointestinal distress and free-radical tissue damage.",
            "safety": "Accidental ingestion in children is a leading cause of fatal poisoning.",
            "upper_limit": "45 mg/day"
        }
    }

    @staticmethod
    def add_supplement(db: Session, patient_id: int, supp_in: SupplementCreate) -> Supplement:
        supp = Supplement(
            patient_id=patient_id,
            product_name=supp_in.product_name.strip(),
            brand=supp_in.brand,
            supplement_type=supp_in.supplement_type,
            serving_size=supp_in.serving_size,
            recorded_frequency=supp_in.recorded_frequency,
            daily_servings_count=supp_in.daily_servings_count or 1.0,
            start_date=supp_in.start_date,
            end_date=supp_in.end_date,
            source=supp_in.source,
            verification_status=supp_in.verification_status,
            notes=supp_in.notes
        )
        db.add(supp)
        db.flush()

        for ing in supp_in.ingredients:
            is_unknown = ing.is_amount_unknown == "true" or ing.amount_per_serving is None
            db_ing = SupplementIngredient(
                supplement_id=supp.id,
                ingredient_name=ing.ingredient_name.strip(),
                normalized_name=ing.ingredient_name.strip().lower(),
                amount_per_serving=None if is_unknown else ing.amount_per_serving,
                unit=ing.unit,
                is_amount_unknown="true" if is_unknown else "false"
            )
            db.add(db_ing)

        db.commit()
        db.refresh(supp)
        return supp

    @staticmethod
    def analyze_nutrient_intake(db: Session, patient_id: int) -> List[NutrientIntakeItem]:
        """
        Calculates cumulative daily intake across active supplements.
        NEVER treats unknown quantities as zero.
        Flags duplicate nutrients across products.
        """
        supplements = db.query(Supplement).filter(
            Supplement.patient_id == patient_id,
            Supplement.status == "active"
        ).all()

        intake_map: Dict[str, Dict[str, Any]] = {}

        SYNONYMS = {
            "ascorbic acid": "vitamin_c",
            "ascorbate": "vitamin_c",
            "cholecalciferol": "vitamin_d",
            "ergocalciferol": "vitamin_d",
            "cyanocobalamin": "vitamin_b12",
            "methylcobalamin": "vitamin_b12",
            "pyridoxine": "vitamin_b6",
            "thiamine": "vitamin_b1",
            "riboflavin": "vitamin_b2",
            "niacin": "vitamin_b3",
            "tocopherol": "vitamin_e",
            "retinol": "vitamin_a",
            "folate": "folic_acid",
            "ferrous": "iron"
        }

        for supp in supplements:
            daily_servings = supp.daily_servings_count if supp.daily_servings_count is not None else 1.0
            for ing in supp.ingredients:
                raw_norm = ing.normalized_name.lower().strip()
                # Check synonym map
                for syn, mapped_key in SYNONYMS.items():
                    if syn in raw_norm:
                        raw_norm = mapped_key
                        break

                canonical_key = raw_norm.replace(" ", "_").replace("-", "_")
                for k in SupplementService.NUTRIENT_EVIDENCE_DATABASE.keys():
                    if k == canonical_key or k in canonical_key or canonical_key in k:
                        canonical_key = k
                        break

                if canonical_key not in intake_map:
                    intake_map[canonical_key] = {
                        "display_name": ing.ingredient_name,
                        "products": [],
                        "total_daily": 0.0,
                        "unit": ing.unit,
                        "has_unknown": False,
                        "units_match": True
                    }

                entry = intake_map[canonical_key]
                entry["products"].append(f"{supp.product_name} ({supp.serving_size or '1 serving'})")

                if ing.is_amount_unknown == "true" or ing.amount_per_serving is None:
                    entry["has_unknown"] = True
                else:
                    if entry["unit"] and ing.unit and entry["unit"].lower() != ing.unit.lower():
                        entry["units_match"] = False
                    else:
                        entry["total_daily"] += (ing.amount_per_serving * daily_servings)
                        if not entry["unit"]:
                            entry["unit"] = ing.unit

        results: List[NutrientIntakeItem] = []
        for key, data in intake_map.items():
            ev = SupplementService.NUTRIENT_EVIDENCE_DATABASE.get(key, {
                "name": data["display_name"],
                "benefits": "General micronutrient or dietary compound.",
                "limitations": "Evidence from dietary sources may not directly extrapolate to concentrated supplemental forms.",
                "safety": "Follow product guidance or clinical recommendations.",
                "upper_limit": "Refer to dietary reference guidelines"
            })

            tot = round(data["total_daily"], 2) if not data["has_unknown"] and data["units_match"] else None

            results.append(NutrientIntakeItem(
                nutrient_name=ev["name"],
                total_daily_intake=tot,
                unit=data["unit"],
                has_unknown_quantities=data["has_unknown"] or not data["units_match"],
                products_containing=list(set(data["products"])),
                evidence_benefits=ev["benefits"],
                evidence_limitations=ev["limitations"],
                safety_concerns=ev["safety"],
                tolerable_upper_intake_note=ev["upper_limit"]
            ))

        return results
