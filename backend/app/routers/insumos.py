from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Insumo, RecetaIngrediente
from ..schemas import InsumoCreate, InsumoUpdate, InsumoOut, InsumoBulkUpdateRequest
from ..github_sync import trigger_auto_sync
from .auth import require_admin

router = APIRouter(prefix="/api/insumos", tags=["Insumos y Packaging"])

@router.get("", response_model=List[InsumoOut])
def listar_insumos(
    categoria: Optional[str] = Query(None, description="Filtrar por 'ingrediente' o 'packaging'"),
    buscar: Optional[str] = Query(None, description="Buscar por nombre"),
    db: Session = Depends(get_db)
):
    query = db.query(Insumo)
    if categoria:
        query = query.filter(Insumo.categoria == categoria)
    if buscar:
        query = query.filter(Insumo.nombre.ilike(f"%{buscar}%"))
    insumos = query.order_by(Insumo.categoria.asc(), Insumo.nombre.asc()).all()
    for ins in insumos:
        if ins.costo_por_unidad_base <= 0:
            ins.calcular_costo_base()
    return insumos

@router.post("", response_model=InsumoOut, status_code=201, dependencies=[Depends(require_admin)])
def crear_insumo(insumo_in: InsumoCreate, db: Session = Depends(get_db)):
    nuevo = Insumo(
        nombre=insumo_in.nombre.strip(),
        categoria=insumo_in.categoria.strip().lower(),
        unidad_compra=insumo_in.unidad_compra.strip().lower(),
        cantidad_compra=insumo_in.cantidad_compra,
        precio_compra=insumo_in.precio_compra,
        merma_porcentaje=insumo_in.merma_porcentaje,
        notas=insumo_in.notas
    )
    nuevo.calcular_costo_base()
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    trigger_auto_sync(db)
    return nuevo

@router.put("/bulk-update", response_model=List[InsumoOut], dependencies=[Depends(require_admin)])
def actualizar_insumos_masivo(payload: InsumoBulkUpdateRequest, db: Session = Depends(get_db)):
    """
    Actualiza precios, cantidades o mermas de múltiples insumos en una sola transacción,
    o aplica un porcentaje de aumento global/por categoría (Modo Ticket / Mayorista).
    """
    if payload.porcentaje_aumento_global is not None and payload.porcentaje_aumento_global != 0:
        factor = 1.0 + (payload.porcentaje_aumento_global / 100.0)
        q = db.query(Insumo)
        if payload.categoria_aumento and payload.categoria_aumento in ("ingrediente", "packaging"):
            q = q.filter(Insumo.categoria == payload.categoria_aumento)
        for ins in q.all():
            ins.precio_compra = round(max(0.0, ins.precio_compra * factor), 2)
            ins.calcular_costo_base()

    if payload.items:
        ids = [it.id for it in payload.items]
        insumos_map = {ins.id: ins for ins in db.query(Insumo).filter(Insumo.id.in_(ids)).all()}
        for item in payload.items:
            ins = insumos_map.get(item.id)
            if not ins:
                continue
            if item.precio_compra is not None and item.precio_compra >= 0:
                ins.precio_compra = round(float(item.precio_compra), 2)
            if item.cantidad_compra is not None and item.cantidad_compra > 0:
                ins.cantidad_compra = float(item.cantidad_compra)
            if item.merma_porcentaje is not None and 0 <= item.merma_porcentaje < 100:
                ins.merma_porcentaje = float(item.merma_porcentaje)
            ins.calcular_costo_base()

    db.commit()
    trigger_auto_sync(db)
    return db.query(Insumo).order_by(Insumo.categoria.asc(), Insumo.nombre.asc()).all()

@router.get("/{insumo_id}", response_model=InsumoOut)
def obtener_insumo(insumo_id: int, db: Session = Depends(get_db)):
    ins = db.query(Insumo).filter(Insumo.id == insumo_id).first()
    if not ins:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    return ins

@router.put("/{insumo_id}", response_model=InsumoOut, dependencies=[Depends(require_admin)])
def actualizar_insumo(insumo_id: int, insumo_in: InsumoUpdate, db: Session = Depends(get_db)):
    ins = db.query(Insumo).filter(Insumo.id == insumo_id).first()
    if not ins:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")

    data = insumo_in.dict(exclude_unset=True)
    for field, val in data.items():
        if field == "nombre" and val:
            setattr(ins, field, val.strip())
        elif field in ["categoria", "unidad_compra"] and val:
            setattr(ins, field, val.strip().lower())
        else:
            setattr(ins, field, val)

    ins.calcular_costo_base()
    db.commit()
    db.refresh(ins)
    trigger_auto_sync(db)
    return ins

@router.delete("/{insumo_id}", status_code=204, dependencies=[Depends(require_admin)])
def eliminar_insumo(insumo_id: int, db: Session = Depends(get_db)):
    ins = db.query(Insumo).filter(Insumo.id == insumo_id).first()
    if not ins:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    
    # Eliminar cualquier uso del insumo en ingredientes de recetas para evitar errores
    db.query(RecetaIngrediente).filter(RecetaIngrediente.insumo_id == ins.id).delete(synchronize_session=False)

    db.delete(ins)
    db.commit()
    trigger_auto_sync(db)
    return None
