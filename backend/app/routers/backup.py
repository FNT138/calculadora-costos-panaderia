import os
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from ..database import get_db, DATABASE_URL
from ..github_sync import export_db_to_dict, import_dict_to_db, push_backup_to_github, pull_backup_from_github

router = APIRouter(prefix="/api/backup", tags=["Respaldos y Persistencia"])

@router.get("/status")
def estado_persistencia():
    has_postgres = bool(DATABASE_URL and not DATABASE_URL.startswith("sqlite"))
    has_turso = bool(os.getenv("TURSO_DATABASE_URL"))
    has_github_sync = bool(os.getenv("GITHUB_TOKEN") and os.getenv("GITHUB_REPO"))
    
    if has_turso:
        motor = "Turso (libSQL Cloud - Permanente)"
    elif has_postgres:
        motor = "PostgreSQL (Nube permanente)"
    else:
        motor = "SQLite Local"
        
    return {
        "motor_base_datos": motor,
        "es_permanente": has_postgres or has_turso or has_github_sync,
        "github_sync_activo": has_github_sync,
        "github_repo": os.getenv("GITHUB_REPO") if has_github_sync else None
    }

@router.get("/export")
def exportar_copia_seguridad(db: Session = Depends(get_db)):
    data = export_db_to_dict(db)
    return JSONResponse(
        content=data,
        headers={
            "Content-Disposition": "attachment; filename=panaderia_backup.json"
        }
    )

@router.post("/import")
async def importar_copia_seguridad(
    request: Request,
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        content_type = request.headers.get("content-type", "")
        if file:
            content = await file.read()
            data = json.loads(content.decode("utf-8"))
        elif "application/json" in content_type:
            data = await request.json()
        else:
            form = await request.form()
            file_item = form.get("file")
            if file_item and hasattr(file_item, "read"):
                content = await file_item.read()
                data = json.loads(content.decode("utf-8"))
            else:
                body = await request.body()
                data = json.loads(body.decode("utf-8"))

        import_dict_to_db(db, data)
        if os.getenv("GITHUB_TOKEN") and os.getenv("GITHUB_REPO"):
            push_backup_to_github(db)
        return {"status": "ok", "message": "Datos importados exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al importar el archivo: {str(e)}")

@router.post("/sync-github")
def forzar_sincronizacion_github(db: Session = Depends(get_db)):
    res = push_backup_to_github(db)
    if res.get("status") == "error":
        raise HTTPException(status_code=500, detail=res.get("message"))
    return res

@router.post("/pull-github")
def forzar_descarga_github(db: Session = Depends(get_db)):
    res = pull_backup_from_github(db)
    if res.get("status") == "error":
        raise HTTPException(status_code=500, detail=res.get("message"))
    return res
