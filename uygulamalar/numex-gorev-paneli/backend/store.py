"""Bellek içi (in-memory) görev deposu.

Veritabanı yok; görevler süreç belleğinde bir dict içinde tutulur.
Sunucu yeniden başlarsa veriler sıfırlanır — bu proje için beklenen
davranış (bilinçli tercih, README'de de belirtildi).

Neden dict + Lock?
- dict ile id -> Task eşlemesi O(1) arama sağlar (listede O(n) tarama gerekirdi).
- WebSocket log döngüsü ile HTTP istekleri AYNI ANDA çalışabildiği için
  paylaşılan listeye eşzamanlı erişim olur; threading.Lock bunu güvene alır.
"""

from __future__ import annotations

import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional

from .models import Task, TaskCreate, TaskStatus, TaskUpdate


def _utcnow() -> datetime:
    """Zaman damgası için tek merkez: hep UTC döner."""
    return datetime.now(timezone.utc)


class TaskStore:
    """Görevlerin tutulduğu bellek içi depo (CRUD operasyonları)."""

    def __init__(self) -> None:
        # id -> Task eşlemesi. Sıralamayı ayrıca tutmuyoruz; listelerken
        # created_at'e göre sıralıyoruz (en yeni en üstte).
        self._items: Dict[str, Task] = {}
        self._lock = threading.Lock()

    # ------------------------------------------------------------------ #
    # Okuma işlemleri
    # ------------------------------------------------------------------ #
    def list_all(self) -> List[Task]:
        """Tüm görevleri en yeni en üstte olacak şekilde döndürür."""
        with self._lock:
            gorevler = list(self._items.values())
        # created_at ISO/aware datetime olduğu için doğrudan karşılaştırılabilir
        gorevler.sort(key=lambda t: t.created_at, reverse=True)
        return gorevler

    def get(self, task_id: str) -> Optional[Task]:
        """Verilen id'ye ait görevi döndürür; yoksa None."""
        with self._lock:
            return self._items.get(task_id)

    def count(self) -> int:
        """Toplam görev sayısı (WebSocket loglarında kullanılıyor)."""
        with self._lock:
            return len(self._items)

    def count_by_status(self) -> Dict[str, int]:
        """Durum bazında görev sayısı — paneldeki istatistik için."""
        with self._lock:
            degerler = list(self._items.values())
        sonuc = {s.value: 0 for s in TaskStatus}
        for gorev in degerler:
            sonuc[gorev.status.value] += 1
        return sonuc

    # ------------------------------------------------------------------ #
    # Yazma işlemleri
    # ------------------------------------------------------------------ #
    def create(self, payload: TaskCreate) -> Task:
        """Yeni görev oluşturur (id ve created_at otomatik üretilir)."""
        gorev = Task(title=payload.title, status=payload.status)
        with self._lock:
            self._items[gorev.id] = gorev
        return gorev

    def update(self, task_id: str, payload: TaskUpdate) -> Optional[Task]:
        """Var olan görevi günceller.

        Dönen değer:
        - Task  : güncelleme başarılı
        - None  : bu id'de görev yok (router bunu 404'e çevirir)
        """
        with self._lock:
            mevcut = self._items.get(task_id)
            if mevcut is None:
                return None

            # Yalnızca gönderilen alanları değiştir (PATCH benzeri davranış)
            guncel = mevcut.model_copy(deep=True)
            if payload.title is not None:
                guncel.title = payload.title
            if payload.status is not None:
                guncel.status = payload.status

            self._items[task_id] = guncel
            return guncel

    def delete(self, task_id: str) -> Optional[Task]:
        """Görevi siler.

        Dönen değer:
        - Task : silinen görev (istemciye bilgi amaçlı döner)
        - None : bu id'de görev yok -> 404
        """
        with self._lock:
            return self._items.pop(task_id, None)

    def clear(self) -> None:
        """Tüm görevleri temizler — testler arası izolasyon için."""
        with self._lock:
            self._items.clear()


# Uygulama genelinde TEK depo örneği. Router'lar ve WebSocket döngüsü
# hep bu nesneyi paylaşır; bu yüzden Lock kullanımı zorunluydu.
store = TaskStore()
