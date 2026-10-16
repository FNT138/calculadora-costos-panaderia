import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .database import engine, Base
from .seed import seed_database
from .routers import insumos, recetas, produccion, simulador, config

# Inicialización de tablas y seed
Base.metadata.create_all(bind=engine)
try:
    seed_database()
except Exception as e:
    print(f"Aviso durante seed: {e}")

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
app.include_router(config.router)

@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Panaderia Costos"}

# Servir Frontend compilado si existe la carpeta 'dist'
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DIST_DIR = BASE_DIR / "frontend" / "dist"

if DIST_DIR.exists() and (DIST_DIR / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        file_path = DIST_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")
