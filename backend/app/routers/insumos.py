from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Insumo, RecetaIngrediente
from ..schemas import InsumoCreate, InsumoUpdate, InsumoOut
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
