"""Numex Görev Paneli — FastAPI uygulamasının giriş noktası.

Bu dosya bilinçli olarak İNCE tutuldu: yalnızca uygulamayı kurar,
router'ları bağlar ve arayüzü (frontend) servis eder. İş mantığı
backend/ paketindedir.

Çalıştırma:
    python -m uvicorn main:app --reload --port 8000
veya:
    python main.py
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.models import HealthResponse
from backend.routers import tasks, ws_logs
from backend.routers.ws_logs import active_connection_count

# Proje kökü ve arayüz dizini (taşınabilirlik için Path ile hesaplanır).
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(
    title="Numex Görev Paneli",
    description=(
        "Gerçek zamanlı görev yönetimi ve canlı log izleme API'si.\n\n"
        "- **/api/v1/tasks** → görev CRUD uç noktaları\n"
        "- **/ws/logs** → WebSocket üzerinden 3 saniyede bir sistem logu"
    ),
    version="1.0.0",
)

# CORS: arayüz aynı origin'den servis edilse de geliştirme sırasında
# farklı porttan (ör. canlı önizleme araçlarından) erişim olabilir.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------- #
# Router bağlantıları
# ---------------------------------------------------------------------- #
app.include_router(tasks.router)      # /api/v1/tasks ...
app.include_router(ws_logs.router)    # /ws/logs


# ---------------------------------------------------------------------- #
# Sağlık kontrolü
# ---------------------------------------------------------------------- #
@app.get("/api/v1/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    """Sunucu ayakta mı? Ayrıca kaç canlı WebSocket istemcisi var?"""
    return HealthResponse()


@app.get("/api/v1/health/detay", tags=["system"])
def health_detail() -> dict:
    """Sunucu + WebSocket bağlantı durumu detayı."""
    return {
        "status": "ok",
        "active_websocket_connections": active_connection_count(),
    }


# ---------------------------------------------------------------------- #
# Arayüz (frontend) servisi
# ---------------------------------------------------------------------- #
# Statik varlıklar (css/js): /static/... altından servis edilir.
if (FRONTEND_DIR / "style.css").exists():
    app.mount(
        "/static",
        StaticFiles(directory=str(FRONTEND_DIR)),
        name="static",
    )


@app.get("/", include_in_schema=False)
def anasayfa(request: Request) -> FileResponse:
    """Ana arayüzü döndürür."""
    index = FRONTEND_DIR / "index.html"
    if not index.exists():
        # Arayüz dosyası silinmişse anlaşılır bir hata ver.
        return JSONResponse(  # type: ignore[return-value]
            status_code=500,
            content={"detail": "frontend/index.html bulunamadı."},
        )
    return FileResponse(index)


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> JSONResponse:
    """Tarayıcının favicon isteğini sessizce karşıla (404 gürültüsü olmasın)."""
    return JSONResponse(status_code=204, content=None)


# ---------------------------------------------------------------------- #
# Doğrudan çalıştırma desteği
# ---------------------------------------------------------------------- #
if __name__ == "__main__":
    import uvicorn

    # host 127.0.0.1: yerel geliştirme için güvenli varsayılan.
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
