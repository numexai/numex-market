"""Görev (Task) CRUD uç noktaları — /api/v1/tasks

Desteklenen işlemler:
- GET    /api/v1/tasks          → tüm görevleri listeler
- GET    /api/v1/tasks/{id}     → tek görevi getirir
- POST   /api/v1/tasks          → yeni görev oluşturur (201)
- PUT    /api/v1/tasks/{id}     → görevi günceller (kısmi güncelleme destekli)
- DELETE /api/v1/tasks/{id}     → görevi siler (204)

Hata yönetimi: var olmayan bir id ile geliştirilen isteklerde
standart biçimde HTTP 404 Not Found döndürülür.
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, Response, status

from ..models import Task, TaskCreate, TaskUpdate
from ..store import store

# prefix ve tags: main.py'de router eklenirken de verilebilir; ama
# uç noktaların kendi tanımlarında net dursun diye burada veriyoruz.
router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.get("", response_model=List[Task], summary="Tüm görevleri listele")
def list_tasks() -> List[Task]:
    """Bellekteki tüm görevleri döndürür (en yeni en üstte)."""
    return store.list_all()


@router.get("/{task_id}", response_model=Task, summary="Tek görev getir")
def get_task(task_id: str) -> Task:
    """Verilen id'ye ait görevi döndürür; yoksa 404."""
    gorev = store.get(task_id)
    if gorev is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"'{task_id}' id'li görev bulunamadı.",
        )
    return gorev


@router.post(
    "",
    response_model=Task,
    status_code=status.HTTP_201_CREATED,
    summary="Yeni görev oluştur",
)
def create_task(payload: TaskCreate) -> Task:
    """Yeni bir görev oluşturur.

    id ve created_at alanları sunucu tarafında üretilir; istemci
    bunları göndermek zorunda değildir.
    """
    return store.create(payload)


@router.put("/{task_id}", response_model=Task, summary="Görevi güncelle")
def update_task(task_id: str, payload: TaskUpdate) -> Task:
    """Görevi günceller.

    Yalnızca gönderilen alanlar değiştirilir (title ve/veya status).
    Görev yoksa 404, gövde geçersizse 422 döner.
    """
    guncellenen = store.update(task_id, payload)
    if guncellenen is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"'{task_id}' id'li görev bulunamadı.",
        )
    return guncellenen


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Görevi sil",
)
def delete_task(task_id: str) -> Response:
    """Görevi siler.

    Silinen görev bulunamazsa 404 döner. Başarılı silmede gövde
    dönmez (204 No Content) — REST sözleşmesine uygun davranış.

    NOT: response_class=Response şart. Aksi hâlde FastAPI 204 yanıtı
    için bir JSON gövdesi üretmeye çalışır ve uygulama açılışta
    "Status code 204 must not have a response body" hatası verir.
    """
    silinen = store.delete(task_id)
    if silinen is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"'{task_id}' id'li görev bulunamadı.",
        )
    # Boş gövde: gerçek 204 No Content
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/stats/ozet", summary="Durum bazlı görev özeti")
def task_stats() -> dict:
    """Panelin üstündeki istatistik kartlarını besleyen özet.

    NOT: Bu uç nokta /{task_id}'den ÖNCE tanımlanmalıdır; aksi halde
    FastAPI "stats" kelimesini bir id sanıp yanlış eşleme yapar.
    """
    return {
        "total": store.count(),
        "by_status": store.count_by_status(),
    }
