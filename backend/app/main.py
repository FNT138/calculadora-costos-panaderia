import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import json
from .database import engine, Base, SessionLocal
from .models import Insumo
from .seed import seed_database
from .github_sync import pull_backup_from_github, import_dict_to_db
from .routers import insumos, recetas, produccion, simulador, config, backup, auth, ventas

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Inicialización de tablas y restauración de datos
Base.metadata.create_all(bind=engine)
try:
    db = SessionLocal()
    # 1. Si GitHub Sync está configurado, restauramos el último respaldo remoto
    if os.getenv("GITHUB_TOKEN") and os.getenv("GITHUB_REPO"):
        pull_backup_from_github(db)
    elif db.query(Insumo).count() == 0:
        # 2. Si es una base nueva/vacía (ej. Turso nuevo), restauramos la copia del repositorio
        backup_local = BASE_DIR / "data" / "db_backup.json"
        if backup_local.exists():
            with open(backup_local, "r", encoding="utf-8") as f:
                backup_data = json.load(f)
            import_dict_to_db(db, backup_data)
            print("Base de datos inicializada desde data/db_backup.json")
    seed_database()
    
    # 3. Sincronizar secuencias seriales de PostgreSQL para evitar error de duplicate key
    if db.bind and db.bind.dialect.name == "postgresql":
        from sqlalchemy import text
        for tbl in ["insumos", "recetas", "receta_ingredientes", "sesiones_produccion", "sesion_produccion_items", "presentaciones_venta", "presentacion_venta_items"]:
            try:
                db.execute(text(f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), coalesce(max(id), 0) + 1, false) FROM {tbl};"))
                db.commit()
            except Exception as seq_err:
                db.rollback()
                print(f"Aviso sync secuencia {tbl}: {seq_err}")
                
    db.close()
except Exception as e:
    print(f"Aviso durante inicio y seed: {e}")

app = FastAPI(
    title="Panadería Costos & Maximización de Precios",
    description="Sistema para cálculo de escandallos, mano de obra por ventana de tiempo y simulación de precios para panadería artesanal.",
    version="1.0.0"
)

# CORS habilitado para acceso desde celular / red Wi-Fi local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusión de routers
app.include_router(insumos.router)
app.include_router(recetas.router)
app.include_router(produccion.router)
app.include_router(simulador.router)
app.include_router(ventas.router)
app.include_router(config.router)
app.include_router(backup.router)
app.include_router(auth.router)

@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Panaderia Costos"}

# Servir Frontend compilado si existe la carpeta 'dist'
DIST_DIR = BASE_DIR / "frontend" / "dist"

if DIST_DIR.exists() and (DIST_DIR / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        file_path = DIST_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")
