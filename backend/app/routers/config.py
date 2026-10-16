from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Configuracion, Insumo, Receta, SesionProduccion
from ..schemas import ConfiguracionUpdate
from ..github_sync import trigger_auto_sync
from .auth import require_admin

router = APIRouter(prefix="/api/configuracion", tags=["Configuración y Resumen"])

@router.get("")
def obtener_configuracion(db: Session = Depends(get_db)) -> Dict[str, Any]:
    configs = db.query(Configuracion).all()
    cfg_map = {c.clave: c.valor for c in configs}

    # Estadísticas rápidas para el dashboard
    total_insumos = db.query(Insumo).count()
    total_recetas = db.query(Receta).count()
    total_sesiones = db.query(SesionProduccion).count()

    return {
        "costo_hora_defecto": float(cfg_map.get("costo_hora_defecto", "20000.0")),
        "margen_defecto": float(cfg_map.get("margen_defecto", "60.0")),
        "porcentaje_servicios_defecto": float(cfg_map.get("porcentaje_servicios_defecto", "10.0")),
        "estadisticas": {
            "total_insumos": total_insumos,
            "total_recetas": total_recetas,
            "total_sesiones": total_sesiones,
        }
    }

@router.put("", dependencies=[Depends(require_admin)])
def actualizar_configuracion(cfg_in: ConfiguracionUpdate, db: Session = Depends(get_db)):
    if cfg_in.costo_hora_defecto is not None:
        c = db.query(Configuracion).filter(Configuracion.clave == "costo_hora_defecto").first()
        if c:
            c.valor = str(cfg_in.costo_hora_defecto)
        else:
            db.add(Configuracion(clave="costo_hora_defecto", valor=str(cfg_in.costo_hora_defecto)))

    if cfg_in.margen_defecto is not None:
        c = db.query(Configuracion).filter(Configuracion.clave == "margen_defecto").first()
        if c:
            c.valor = str(cfg_in.margen_defecto)
        else:
            db.add(Configuracion(clave="margen_defecto", valor=str(cfg_in.margen_defecto)))

    if cfg_in.porcentaje_servicios_defecto is not None:
        c = db.query(Configuracion).filter(Configuracion.clave == "porcentaje_servicios_defecto").first()
        if c:
            c.valor = str(cfg_in.porcentaje_servicios_defecto)
        else:
            db.add(Configuracion(clave="porcentaje_servicios_defecto", valor=str(cfg_in.porcentaje_servicios_defecto)))

    db.commit()
    trigger_auto_sync(db)
    return obtener_configuracion(db)
