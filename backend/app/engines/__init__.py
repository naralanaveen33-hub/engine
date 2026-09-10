from typing import Any

from app.enums import DataSource

try:
    from pydantic import BaseModel

    class SourcedValue(BaseModel):
        value: Any
        unit: str | None = None
        source: DataSource
        observed_at: str | None = None
        quality: str | None = None
        note: str | None = None
except ImportError:
    from dataclasses import dataclass

    @dataclass
    class SourcedValue:
        value: Any
        source: DataSource
        unit: str | None = None
        observed_at: str | None = None
        quality: str | None = None
        note: str | None = None

        def dict(self) -> dict:
            return {
                "value": self.value,
                "unit": self.unit,
                "source": self.source if isinstance(self.source, str) else getattr(self.source, "value", str(self.source)),
                "observed_at": self.observed_at,
                "quality": self.quality,
                "note": self.note,
            }

