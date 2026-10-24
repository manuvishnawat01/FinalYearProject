from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.health_reading import DailyHealthReading
from app.models.document import MedicalObservation
from app.schemas.intelligence_modules import TrendSeriesResult, TrendDataPoint

class EarlyWarningRulesEngine:
    RULE_VERSION = "2026.1"

    @staticmethod
    def evaluate_warnings(metric: str, data_points: List[TrendDataPoint]) -> List[Dict[str, Any]]:
        warnings = []
        if not data_points:
            return warnings

        # 1. Blood Pressure Rules (AHA / ACC 2024-2026 Guidelines)
        if metric == "blood_pressure":
            # Check most recent reading
            latest = data_points[-1]
            if latest.systolic is not None and latest.diastolic is not None:
                if latest.systolic >= 180 or latest.diastolic >= 120:
                    warnings.append({
                        "rule_id": "BP-CRITICAL-001",
                        "rule_version": EarlyWarningRulesEngine.RULE_VERSION,
                        "severity": "critical",
                        "title": "Hypertensive Crisis Range Detected",
                        "message": f"Recorded reading {latest.systolic}/{latest.diastolic} mmHg is in the hypertensive crisis tier. If accompanied by chest pain, shortness of breath, numbness or vision disturbance, seek emergency medical care immediately.",
                        "date": latest.date,
                        "reference_source": "AHA/ACC Hypertension Guidelines"
                    })
                elif latest.systolic >= 140 or latest.diastolic >= 90:
                    # Check if sustained (at least 2 consecutive high readings)
                    high_count = sum(1 for dp in data_points[-3:] if (dp.systolic and dp.systolic >= 140) or (dp.diastolic and dp.diastolic >= 90))
                    warnings.append({
                        "rule_id": "BP-STAGE2-002",
                        "rule_version": EarlyWarningRulesEngine.RULE_VERSION,
                        "severity": "moderate",
                        "title": "Stage 2 Hypertension Level",
                        "message": f"Reading {latest.systolic}/{latest.diastolic} mmHg exceeds the standard stage 2 threshold (140/90 mmHg). Repeated in {high_count} recent reading(s). Schedule a clinical review.",
                        "date": latest.date,
                        "reference_source": "AHA/ACC Clinical Reference"
                    })

        # 2. Glucose Rules (ADA Standards of Care)
        elif metric == "blood_glucose":
            latest = data_points[-1]
            if latest.value is not None:
                context = latest.context or "random"
                if latest.value < 70:
                    warnings.append({
                        "rule_id": "GLU-HYPO-001",
                        "rule_version": EarlyWarningRulesEngine.RULE_VERSION,
                        "severity": "critical",
                        "title": "Hypoglycemia (Low Blood Sugar) Warning",
                        "message": f"Recorded glucose {latest.value} mg/dL is below 70 mg/dL. Promptly consume fast-acting carbohydrates (15g rule) and re-test.",
                        "date": latest.date,
                        "reference_source": "American Diabetes Association Standards of Care"
                    })
                elif context == "fasting" and latest.value >= 126:
                    warnings.append({
                        "rule_id": "GLU-FAST-HIGH-002",
                        "rule_version": EarlyWarningRulesEngine.RULE_VERSION,
                        "severity": "moderate",
                        "title": "Elevated Fasting Glucose",
                        "message": f"Fasting reading {latest.value} mg/dL exceeds the normal fasting threshold (100 mg/dL) and diabetes diagnostic cut-off (126 mg/dL). Clinical evaluation recommended.",
                        "date": latest.date,
                        "reference_source": "ADA Fasting Blood Glucose Criteria"
                    })
                elif context in ["post_meal", "pre_meal"] and latest.value >= 200:
                    warnings.append({
                        "rule_id": "GLU-POST-HIGH-003",
                        "rule_version": EarlyWarningRulesEngine.RULE_VERSION,
                        "severity": "moderate",
                        "title": "Marked Post-Prandial Hyperglycemia",
                        "message": f"Post-meal glucose of {latest.value} mg/dL is notably elevated (threshold <180 mg/dL).",
                        "date": latest.date,
                        "reference_source": "ADA Postprandial Guidelines"
                    })

        # 3. HbA1c Rules
        elif metric == "hba1c":
            latest = data_points[-1]
            if latest.value is not None:
                if latest.value >= 8.5:
                    warnings.append({
                        "rule_id": "HBA1C-HIGH-001",
                        "rule_version": EarlyWarningRulesEngine.RULE_VERSION,
                        "severity": "high",
                        "title": "Substantially Elevated Glycated Hemoglobin",
                        "message": f"HbA1c of {latest.value}% indicates persistent hyperglycemia over the preceding 3 months. Review medication regimen with your endocrinologist.",
                        "date": latest.date,
                        "reference_source": "ADA/EASD Consensus Guidelines"
                    })

        # 4. Creatinine Rules
        elif metric == "creatinine":
            latest = data_points[-1]
            if latest.value is not None and latest.reference_high and latest.value > latest.reference_high:
                warnings.append({
                    "rule_id": "CREAT-ELEVATED-001",
                    "rule_version": EarlyWarningRulesEngine.RULE_VERSION,
                    "severity": "moderate",
                    "title": "Serum Creatinine Above Laboratory Reference Range",
                    "message": f"Creatinine {latest.value} {latest.unit} exceeds reported upper normal limit ({latest.reference_high}). Suggests review of renal clearance, especially if taking nephrotoxic agents.",
                    "date": latest.date,
                    "reference_source": "KDIGO Clinical Practice Guideline for Acute Kidney Injury"
                })

        return warnings

class TrendAnalyzerService:
    @staticmethod
    def get_trend_series(
        db: Session,
        patient_id: int,
        metric_name: str,
        glucose_context: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> TrendSeriesResult:
        metric_clean = metric_name.strip().lower()
        data_points: List[TrendDataPoint] = []

        if metric_clean == "blood_pressure":
            q = db.query(DailyHealthReading).filter(
                DailyHealthReading.patient_id == patient_id,
                DailyHealthReading.reading_type == "blood_pressure",
                DailyHealthReading.systolic.isnot(None),
                DailyHealthReading.diastolic.isnot(None)
            )
            if start_date:
                q = q.filter(DailyHealthReading.reading_date >= start_date)
            if end_date:
                q = q.filter(DailyHealthReading.reading_date <= end_date)
            readings = q.order_by(DailyHealthReading.reading_date.asc(), DailyHealthReading.measurement_time.asc()).all()

            for r in readings:
                data_points.append(TrendDataPoint(
                    date=r.reading_date,
                    time=r.measurement_time,
                    systolic=r.systolic,
                    diastolic=r.diastolic,
                    unit="mmHg",
                    reference_low=90.0,
                    reference_high=120.0,
                    context="resting",
                    source="Daily Health Reading"
                ))

            # Statistics based on systolic
            vals = [dp.systolic for dp in data_points if dp.systolic is not None]
            min_v = min(vals) if vals else None
            max_v = max(vals) if vals else None
            abs_change = None
            pct_change = None
            explanation = "Blood pressure trends track both systolic and diastolic values over time."

            if len(vals) >= 2:
                abs_change = round(vals[-1] - vals[0], 2)
                if vals[0] > 0:
                    pct_change = round(((vals[-1] - vals[0]) / vals[0]) * 100, 2)
                    explanation = f"Systolic shifted from {vals[0]} to {vals[-1]} mmHg ({abs_change:+} mmHg, {pct_change:+}%)."

            trend_summary = f"Recorded {len(data_points)} blood pressure measurements."
            if vals:
                trend_summary += f" Systolic range: {min_v} to {max_v} mmHg."

            warnings = EarlyWarningRulesEngine.evaluate_warnings("blood_pressure", data_points)

            return TrendSeriesResult(
                metric="blood_pressure",
                data_points=data_points,
                minimum_value=min_v,
                maximum_value=max_v,
                absolute_change=abs_change,
                percentage_change=pct_change,
                percentage_change_explanation=explanation,
                trend_summary=trend_summary,
                early_warnings=warnings
            )

        elif metric_clean == "blood_glucose":
            q = db.query(DailyHealthReading).filter(
                DailyHealthReading.patient_id == patient_id,
                DailyHealthReading.reading_type == "blood_glucose",
                DailyHealthReading.glucose_value.isnot(None)
            )
            if glucose_context:
                q = q.filter(DailyHealthReading.glucose_context == glucose_context)
            if start_date:
                q = q.filter(DailyHealthReading.reading_date >= start_date)
            if end_date:
                q = q.filter(DailyHealthReading.reading_date <= end_date)
            readings = q.order_by(DailyHealthReading.reading_date.asc(), DailyHealthReading.measurement_time.asc()).all()

            for r in readings:
                data_points.append(TrendDataPoint(
                    date=r.reading_date,
                    time=r.measurement_time,
                    value=r.glucose_value,
                    unit="mg/dL",
                    reference_low=70.0,
                    reference_high=99.0 if r.glucose_context == "fasting" else 140.0,
                    context=r.glucose_context or "unspecified",
                    source="Daily Health Reading"
                ))

            vals = [dp.value for dp in data_points if dp.value is not None]
            min_v = min(vals) if vals else None
            max_v = max(vals) if vals else None
            abs_change = None
            pct_change = None
            explanation = "Glucose values strictly compared within identical measurement context."

            if len(vals) >= 2:
                abs_change = round(vals[-1] - vals[0], 2)
                if vals[0] == 0:
                    pct_change = None
                    explanation = "Baseline glucose was zero; percentage change is undefined."
                else:
                    pct_change = round(((vals[-1] - vals[0]) / vals[0]) * 100, 2)
                    explanation = f"Glucose changed from {vals[0]} to {vals[-1]} mg/dL ({abs_change:+} mg/dL, {pct_change:+}%)."

            trend_summary = f"Recorded {len(data_points)} glucose measurements in '{glucose_context or 'all'}' context."
            warnings = EarlyWarningRulesEngine.evaluate_warnings("blood_glucose", data_points)

            return TrendSeriesResult(
                metric="blood_glucose",
                data_points=data_points,
                minimum_value=min_v,
                maximum_value=max_v,
                absolute_change=abs_change,
                percentage_change=pct_change,
                percentage_change_explanation=explanation,
                trend_summary=trend_summary,
                early_warnings=warnings
            )

        else:
            # Laboratory observation trend (e.g. hba1c, creatinine, hemoglobin, total_cholesterol)
            q = db.query(MedicalObservation).filter(
                MedicalObservation.patient_id == patient_id,
                MedicalObservation.normalized_name.ilike(f"%{metric_clean}%"),
                MedicalObservation.numeric_value.isnot(None)
            )
            if start_date:
                q = q.filter(MedicalObservation.observation_date >= start_date)
            if end_date:
                q = q.filter(MedicalObservation.observation_date <= end_date)
            observations = q.order_by(MedicalObservation.observation_date.asc()).all()

            for obs in observations:
                data_points.append(TrendDataPoint(
                    date=obs.observation_date,
                    value=obs.numeric_value,
                    unit=obs.unit,
                    reference_low=obs.reference_range_low,
                    reference_high=obs.reference_range_high,
                    context="laboratory",
                    source=f"Report #{obs.document_id}" if obs.document_id else "Lab Observation"
                ))

            vals = [dp.value for dp in data_points if dp.value is not None]
            min_v = min(vals) if vals else None
            max_v = max(vals) if vals else None
            abs_change = None
            pct_change = None
            unit = observations[0].unit if observations else ""
            explanation = "Laboratory observations plotted with report-specific reference ranges."

            if len(vals) >= 2:
                abs_change = round(vals[-1] - vals[0], 2)
                if vals[0] == 0:
                    pct_change = None
                    explanation = f"Baseline value was zero {unit}; percentage calculation unavailable."
                else:
                    pct_change = round(((vals[-1] - vals[0]) / vals[0]) * 100, 2)
                    explanation = f"Shifted from {vals[0]} {unit} on {data_points[0].date} to {vals[-1]} {unit} on {data_points[-1].date} ({abs_change:+} {unit}, {pct_change:+}%)."

            trend_summary = f"Recorded {len(data_points)} observations for {metric_name}."
            warnings = EarlyWarningRulesEngine.evaluate_warnings(metric_clean, data_points)

            return TrendSeriesResult(
                metric=metric_name,
                data_points=data_points,
                minimum_value=min_v,
                maximum_value=max_v,
                absolute_change=abs_change,
                percentage_change=pct_change,
                percentage_change_explanation=explanation,
                trend_summary=trend_summary,
                early_warnings=warnings
            )
