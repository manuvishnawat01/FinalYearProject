from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, PatientProfile
from app.schemas.auth import UserCreate, UserLogin, UserOut, Token
from app.core.security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user = User(
        email=user_in.email.lower().strip(),
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name.strip(),
        role=user_in.role or "patient",
        is_active=True
    )
    db.add(user)
    db.flush()

    # Create patient profile
    profile = PatientProfile(
        user_id=user.id,
        date_of_birth=user_in.date_of_birth,
        gender=user_in.gender,
        blood_group=user_in.blood_group,
        emergency_contact=user_in.emergency_contact,
        allergies=[],
        chronic_conditions=[]
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login_user(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower().strip()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated."
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role, "email": user.email})
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        role=user.role,
        full_name=user.full_name
    )

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
