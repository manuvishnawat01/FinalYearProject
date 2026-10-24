import csv
import io
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.expense import MedicalExpense, DuplicateTestFlag
from app.models.document import MedicalObservation, MedicalDocument
from app.schemas.intelligence_modules import ExpenseCreate, ExpenseSummaryOut, DuplicateTestFlagOut

class ExpenseDuplicateService:
    @staticmethod
    def add_expense(db: Session, patient_id: int, exp_in: ExpenseCreate) -> MedicalExpense:
        exp = MedicalExpense(
            patient_id=patient_id,
            expense_date=exp_in.expense_date,
            provider_facility=exp_in.provider_facility.strip(),
            category=exp_in.category,
            service_or_test_name=exp_in.service_or_test_name.strip(),
            amount=exp_in.amount,
            currency=exp_in.currency or "INR",
            related_report_id=exp_in.related_report_id,
            payment_status=exp_in.payment_status or "paid",
            notes=exp_in.notes,
            verification_status="patient_entered"
        )
        db.add(exp)
        db.commit()
        db.refresh(exp)
        return exp

    @staticmethod
    def get_expense_summary(db: Session, patient_id: int, year: Optional[int] = None) -> Dict[str, Any]:
        expenses = db.query(MedicalExpense).filter(MedicalExpense.patient_id == patient_id).all()
        
        total_spent = sum(e.amount for e in expenses)
        by_category: Dict[str, float] = {}
        by_provider: Dict[str, float] = {}
        by_month: Dict[str, float] = {}

        for e in expenses:
            cat = e.category.capitalize()
            by_category[cat] = by_category.get(cat, 0.0) + e.amount
            
            prov = e.provider_facility
            by_provider[prov] = by_provider.get(prov, 0.0) + e.amount
            
            # Month key YYYY-MM
            month_key = e.expense_date[:7] if len(e.expense_date) >= 7 else "Unknown"
            by_month[month_key] = by_month.get(month_key, 0.0) + e.amount

        # Round values
        return {
            "total_expenses_count": len(expenses),
            "total_expenditure": round(total_spent, 2),
            "currency": expenses[0].currency if expenses else "INR",
            "category_breakdown": {k: round(v, 2) for k, v in by_category.items()},
            "provider_breakdown": {k: round(v, 2) for k, v in by_provider.items()},
            "monthly_breakdown": {k: round(v, 2) for k, v in sorted(by_month.items())}
        }

    @staticmethod
    def export_expenses_csv(db: Session, patient_id: int) -> str:
        expenses = db.query(MedicalExpense).filter(
            MedicalExpense.patient_id == patient_id
        ).order_by(MedicalExpense.expense_date.desc()).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Expense ID", "Date", "Provider / Facility", "Category", 
            "Service / Investigation", "Amount", "Currency", "Payment Status", "Notes"
        ])
        for e in expenses:
            writer.writerow([
                e.id, e.expense_date, e.provider_facility, e.category,
                e.service_or_test_name, e.amount, e.currency, e.payment_status, e.notes or ""
            ])

        return output.getvalue()

    @staticmethod
    def check_duplicate_investigations(db: Session, patient_id: int, review_window_days: int = 90) -> List[DuplicateTestFlag]:
        """
        Scans laboratory observations and medical expenses to detect tests performed repeatedly
        within the configured review window (e.g. 90 days).
        Does NOT state test is unnecessary; provides clear clinical context for doctor review.
        """
        observations = db.query(MedicalObservation).filter(
            MedicalObservation.patient_id == patient_id
        ).order_by(MedicalObservation.observation_date.asc()).all()

        flags: List[DuplicateTestFlag] = []

        # Group by normalized test name
        grouped: Dict[str, List[MedicalObservation]] = {}
        for obs in observations:
            norm = obs.normalized_name.lower().strip()
            if norm not in grouped:
                grouped[norm] = []
            grouped[norm].append(obs)

        for test_norm, obs_list in grouped.items():
            if len(obs_list) >= 2:
                for i in range(len(obs_list) - 1):
                    o1 = obs_list[i]
                    o2 = obs_list[i+1]
                    try:
                        d1 = datetime.datetime.strptime(o1.observation_date[:10], "%Y-%m-%d").date()
                        d2 = datetime.datetime.strptime(o2.observation_date[:10], "%Y-%m-%d").date()
                        days_diff = abs((d2 - d1).days)
                        if 0 <= days_diff <= review_window_days:
                            match_type = "exact_duplicate" if days_diff == 0 else "repeated_investigation"
                            reason = (
                                f"Test '{o2.observation_name}' on {o2.observation_date} was previously performed on {o1.observation_date} "
                                f"({days_diff} day(s) apart, within {review_window_days}-day review window)."
                            )
                            flag = DuplicateTestFlag(
                                patient_id=patient_id,
                                current_test_name=o2.observation_name,
                                previous_test_name=o1.observation_name,
                                current_test_date=o2.observation_date,
                                previous_test_date=o1.observation_date,
                                days_between=days_diff,
                                review_window_days=review_window_days,
                                flag_reason=reason,
                                match_type=match_type,
                                status="pending_review",
                                clinical_disclaimer="Repeated investigations are often clinically indicated to monitor therapeutic efficacy, organ function, or disease progression. Discuss with your doctor prior to cancelling scheduled investigations."
                            )
                            db.add(flag)
                            flags.append(flag)
                    except Exception:
                        pass

        db.commit()
        return flags
