"""Analysis ORM model.

One row per completed content analysis, linked to the document it was
generated from. Scores are 0-100 content-quality/recommendation scores,
not predictions of real engagement (see README "Known limitations").
"""

import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )

    overall_score: Mapped[int] = mapped_column(Integer, nullable=False)
    hook_score: Mapped[int] = mapped_column(Integer, nullable=False)
    clarity_score: Mapped[int] = mapped_column(Integer, nullable=False)
    engagement_score: Mapped[int] = mapped_column(Integer, nullable=False)
    cta_score: Mapped[int] = mapped_column(Integer, nullable=False)
    readability_score: Mapped[int] = mapped_column(Integer, nullable=False)

    tone: Mapped[str] = mapped_column(String(50), nullable=False)
    sentiment: Mapped[str] = mapped_column(String(50), nullable=False)
    target_audience: Mapped[str] = mapped_column(String(255), nullable=False)

    strengths: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    weaknesses: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    recommendations: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    improved_content: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
