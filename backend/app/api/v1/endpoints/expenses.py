from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.expense import MedicalExpense, DuplicateTestFlag
from app.schemas.intelligence_modules import (
    ExpenseCreate,
    ExpenseOut,
    DuplicateTestCheckRequest,
    DuplicateTestFlagOut
)
from app.core.security import get_current_user
from app.core.permissions import verify_patient_access
from app.services.expense_duplicate_service import ExpenseDuplicateService

router = APIRouter()

@router.post("/", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def record_expense(
    exp_in: ExpenseCreate,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_edit", resource_type="expense")

    if exp_in.amount <= 0:
        raise HTTPException(status_code=422, detail="Expense amount must be a positive numerical value.")

    exp = ExpenseDuplicateService.add_expense(db=db, patient_id=target_patient_id, exp_in=exp_in)
    return exp

@router.get("/", response_model=List[ExpenseOut])
def list_expenses(
    patient_id: Optional[int] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_readings", resource_type="expense")

    query = db.query(MedicalExpense).filter(MedicalExpense.patient_id == target_patient_id)
    if category:
        query = query.filter(MedicalExpense.category == category)
    return query.order_by(MedicalExpense.expense_date.desc()).all()

@router.get("/summary", response_model=Dict[str, Any])
def get_expense_summary(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_readings", resource_type="expense_summary")

    return ExpenseDuplicateService.get_expense_summary(db=db, patient_id=target_patient_id)

@router.get("/export-csv")
def export_expenses_csv(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_readings", resource_type="expense_export")

    csv_data = ExpenseDuplicateService.export_expenses_csv(db=db, patient_id=target_patient_id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Healthcare_Expenses_Patient_{target_patient_id}.csv"}
    )

@router.post("/check-duplicates", response_model=List[DuplicateTestFlagOut])
def check_duplicate_tests(
    req: DuplicateTestCheckRequest,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_reports", resource_type="duplicate_test_check")

    flags = ExpenseDuplicateService.check_duplicate_investigations(
        db=db,
        patient_id=target_patient_id,
        review_window_days=req.review_window_days
    )
    return flags
