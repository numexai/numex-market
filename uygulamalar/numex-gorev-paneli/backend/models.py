"""Pydantic veri modelleri.

Burada görev (Task) nesnesinin şeması ve API'ye giren/çıkan
yardımcı modeller tanımlanır. Amaç: gelen veriyi doğrulamak,
giden veriyi tutarlı bir formatta sunmak.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TaskStatus(str, Enum):
    """Bir görevin alabileceği durum değerleri.

    str tabanlı Enum kullanıyoruz; böylece JSON'a serileştirmede
    otomatik olarak "pending" gibi düz string'e dönüşür.
    """

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class TaskBase(BaseModel):
    """Task için ortak alanlar (oluşturma ve güncelleme bunu paylaşır)."""

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Görevin başlığı (1-200 karakter)",
    )
    status: TaskStatus = Field(
        default=TaskStatus.PENDING,
        description="Görevin durumu: pending | in_progress | completed",
    )

    @field_validator("title")
    @classmethod
    def _strip_title(cls, value: str) -> str:
        """Baştaki/sondaki boşlukları temizle, boş kalırsa hata ver."""
        temiz = value.strip()
        if not temiz:
            raise ValueError("title boş olamaz")
        return temiz


class TaskCreate(TaskBase):
    """POST /api/v1/tasks gövdesi (id ve created_at sunucuda üretilir)."""


class TaskUpdate(BaseModel):
    """PUT /api/v1/tasks/{id} gövdesi.

    İki alan da opsiyoneldir; istemci yalnızca değiştirmek istediği
    alanı gönderebilir. Hiç alan gönderilmezse içerik değişmez.
    """

    title: Optional[str] = Field(
        default=None, min_length=1, max_length=200, description="Yeni başlık"
    )
    status: Optional[TaskStatus] = Field(
        default=None, description="Yeni durum"
    )

    @field_validator("title")
    @classmethod
    def _strip_title(cls, value: Optional[str]) -> Optional[str]:
        """Başlık gönderildiyse boşluklarını temizle, boşsa hata ver."""
        if value is None:
            return None
        temiz = value.strip()
        if not temiz:
            raise ValueError("title boş olamaz")
        return temiz


class Task(BaseModel):
    """Sunucudan dönen tam görev nesnesi."""

    # from_attributes: ORM/dict benzeri nesnelerden model üretmeye izin verir
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Benzersiz görev kimliği (UUID4)",
    )
    title: str = Field(..., description="Görevin başlığı")
    status: TaskStatus = Field(
        default=TaskStatus.PENDING, description="Görevin durumu"
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Oluşturulma zamanı (UTC, ISO-8601)",
    )


class HealthResponse(BaseModel):
    """GET /api/v1/health yanıtı — sunucu ayakta mı kontrolü için."""

    status: str = Field(default="ok")
    service: str = Field(default="numex-task-panel")
    time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
