"""WebSocket canlı log yayıncısı — /ws/logs

Sunucu, bağlı olan her istemciye PERİYODİK olarak (varsayılan 3 saniye)
bir "sistem durumu" logu gönderir. Log içeriği:

    { "type": "system_log", "timestamp": "...", "level": "info|warn|error",
      "message": "...", "cpu_usage": 42.5, "active_connections": 2,
      "task_count": 5 }

Tasarım notları:
- Bağlantı başına AYRI bir asyncio task başlatılır; istemci sekmeyi
  kapatınca (WebSocketDisconnect) döngü kırılır, kaynak sızmaz.
- Paylaşılan bağlantı sayacı asyncio.Lock ile korunur — aynı anda
  birden fazla istemci bağlanabilir.
- CPU ölçümü: psutil varsa GERÇEK değer, yoksa rastgele simülasyon
  (proje bağımlılığını minimumda tutmak için bilinçli fallback).
"""

from __future__ import annotations

import asyncio
import random
from datetime import datetime, timezone
from typing import Dict, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..store import store

# psutil zorunlu bağımlılık değil: varsa gerçek CPU değeri okunur.
try:  # pragma: no cover - ortama bağlı dal
    import psutil  # type: ignore

    _PSUTIL_VAR = True
except Exception:  # pragma: no cover - psutil yoksa buraya düşer
    psutil = None  # type: ignore
    _PSUTIL_VAR = False


router = APIRouter(tags=["logs"])

# Log yayın periyodu (saniye). Test edilebilirlik için tek yerde duruyor.
LOG_INTERVAL_SECONDS = 3.0

# Aktif WebSocket bağlantıları. id(websocket) -> WebSocket
_active_connections: Dict[int, WebSocket] = {}
_connections_lock = asyncio.Lock()

# Sistem mesajlarının havuzu; her turda rastgele biri seçilir.
_SYSTEM_MESSAGES: Set[str] = {
    "Periyodik sağlık kontrolü tamamlandı",
    "API istek kuyruğu normal seviyede",
    "Bellek kullanımı stabil",
    "Görev deposu senkronize edildi",
    "Arka plan işçisi (worker) aktif",
    "Önbellek temizliği yapıldı",
    "Veritabanı bağlantı havuzu sağlıklı",
}

# Ara sıra farklı seviyede log üretelim ki panel renkli görünsün.
_LEVEL_WEIGHTS = [
    ("info", 8),   # %80
    ("warn", 1),   # %10
    ("error", 1),  # %10
]


def _olcum_cpu() -> float:
    """Anlık CPU kullanım yüzdesini döndürür.

    psutil varsa gerçek ölçüm (interval=None → son çağrıdan beri geçen
    süreye göre non-blocking okuma). Yoksa simülasyon üretilir.
    """
    if _PSUTIL_VAR and psutil is not None:
        try:
            deger = float(psutil.cpu_percent(interval=None))
            return round(deger, 1)
        except Exception:
            # Ölçüm sırasında beklenmedik hata olursa simülasyona düş.
            pass
    return round(random.uniform(3.0, 65.0), 1)


def _seviye_sec() -> str:
    """Ağırlıklı rastgele log seviyesi seçer (çoğunlukla 'info')."""
    seviyeler = [s for s, agirlik in _LEVEL_WEIGHTS for _ in range(agirlik)]
    return random.choice(seviyeler)


def _log_uret() -> dict:
    """Tek bir sistem durum logu üretir."""
    seviye = _seviye_sec()
    mesaj = random.choice(tuple(_SYSTEM_MESSAGES))

    # Bağlantı sayısı için event loop dışından güvenli okuma yapamayız;
    # sadece anlık uzunluğu alıyoruz (Python'da len() atomiktir).
    aktif = len(_active_connections)

    return {
        "type": "system_log",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": seviye,
        "message": mesaj,
        "cpu_usage": _olcum_cpu(),
        "active_connections": aktif,
        "task_count": store.count(),
        "by_status": store.count_by_status(),
    }


async def _baglantiyi_kaydet(websocket: WebSocket) -> None:
    """Bağlantıyı aktif listeye ekler."""
    async with _connections_lock:
        _active_connections[id(websocket)] = websocket


async def _baglantiyi_sil(websocket: WebSocket) -> None:
    """Bağlantıyı aktif listeden çıkarır (idempotent)."""
    async with _connections_lock:
        _active_connections.pop(id(websocket), None)


@router.websocket("/ws/logs")
async def ws_logs(websocket: WebSocket) -> None:
    """Sunucu istemciye her 3 saniyede bir sistem logu yayınlar.

    İstemci bağlantıyı kapatana kadar döngü devam eder. İstemci tarafından
    gelen mesajlar okunur (ping/keepalive) ama işlenmez; tek yönlü yayın
    yeterlidir.
    """
    await websocket.accept()
    await _baglantiyi_kaydet(websocket)

    try:
        # İlk log hemen gitsin; kullanıcı 3 saniye boş ekran görmesin.
        await websocket.send_json(_log_uret())

        while True:
            # Periyodik bekleme. asyncio.sleep kullanıyoruz ki diğer
            # istekler bloklanmasın.
            await asyncio.sleep(LOG_INTERVAL_SECONDS)
            await websocket.send_json(_log_uret())

    except WebSocketDisconnect:
        # İstemci sekmeyi kapattı / ağ koptu → normal akış, sessizce çık.
        pass
    except Exception:
        # Beklenmedik hata (ör. yayın sırasında kopma): bağlantıyı düşür.
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
    finally:
        # Hangi yolla çıkılırsa çıkılsın kaydı temizle (kaynak sızıntısı yok).
        await _baglantiyi_sil(websocket)


def active_connection_count() -> int:
    """Testler ve sağlık ucu için aktif bağlantı sayısı."""
    return len(_active_connections)
