import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Supplement(Base):
    __tablename__ = "supplements"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_name = Column(String(255), nullable=False, index=True)
    brand = Column(String(255), nullable=True)
    supplement_type = Column(String(100), default="multivitamin", nullable=False)  # multivitamin, herbal, mineral, protein, other
    serving_size = Column(String(100), nullable=True)  # e.g., "1 capsule", "2 scoops"
    recorded_frequency = Column(String(100), nullable=True)  # e.g., "Once daily", "Twice daily"
    daily_servings_count = Column(Float, default=1.0, nullable=True)  # servings per day
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50), nullable=True)
    status = Column(String(50), default="active", nullable=False)  # active, stopped
    source = Column(String(100), default="packaging", nullable=False)
    verification_status = Column(String(50), default="unverified", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    patient = relationship("User", back_populates="supplements")
    ingredients = relationship("SupplementIngredient", back_populates="supplement", cascade="all, delete-orphan")

class SupplementIngredient(Base):
    __tablename__ = "supplement_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    supplement_id = Column(Integer, ForeignKey("supplements.id", ondelete="CASCADE"), nullable=False, index=True)
    ingredient_name = Column(String(255), nullable=False, index=True)
    normalized_name = Column(String(255), nullable=False, index=True)
    amount_per_serving = Column(Float, nullable=True)  # nullable: if missing, never assume zero!
    unit = Column(String(50), nullable=True)  # mg, mcg, IU, g, ml
    is_amount_unknown = Column(String(20), default="false", nullable=False)

    supplement = relationship("Supplement", back_populates="ingredients")
