"""Sourced values — engines must not emit unlabeled facts."""

from typing import Any

from pydantic import BaseModel, Field

from app.enums import DataSource


class SourcedValue(BaseModel):
    value: Any
    unit: str | None = None
    source: DataSource
    observed_at: str | None = None
    quality: str | None = None
    note: str | None = None
