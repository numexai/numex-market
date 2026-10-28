"""Numex Görev Paneli — backend paketi.

Bu paket, FastAPI tabanlı görev yönetimi API'sini ve WebSocket log
yayıncısını barındırır. Alt modüller:

- models  : Pydantic şemaları (Task, TaskCreate, TaskUpdate, ...)
- store   : Bellek içi (in-memory) veri deposu
- routers : HTTP ve WebSocket uç noktaları
"""

__all__ = ["models", "store", "routers"]
