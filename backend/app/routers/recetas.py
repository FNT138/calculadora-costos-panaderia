from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from ..models import Receta, RecetaIngrediente, Insumo, SesionProduccionItem
from ..schemas import RecetaCreate, RecetaUpdate, RecetaOut, RecetaIngredienteOut
from ..calculos import calcular_desglose_receta, get_config_val
from ..github_sync import trigger_auto_sync
from .auth import require_admin

router = APIRouter(prefix="/api/recetas", tags=["Recetas y Costos"])

def format_receta_out(receta: Receta, valor_hora: float) -> RecetaOut:
    ingredientes_out = []
    for ri in receta.ingredientes:
        ins = ri.insumo
        costo_base = ins.costo_por_unidad_base if ins else 0.0
        subtot = round(costo_base * ri.cantidad, 2)
        ingredientes_out.append(RecetaIngredienteOut(
            id=ri.id,
            insumo_id=ri.insumo_id,
            insumo_nombre=ins.nombre if ins else "Desconocido",
            insumo_categoria=ins.categoria if ins else "ingrediente",
            unidad_base=ins.unidad_base if ins else "unidad",
            cantidad=ri.cantidad,
            costo_unitario_insumo=costo_base,
            subtotal=subtot,
            notas=ri.notas
        ))

    desglose = calcular_desglose_receta(receta, valor_hora=valor_hora)

    return RecetaOut(
        id=receta.id,
        nombre=receta.nombre,
        categoria=receta.categoria,
        descripcion=receta.descripcion,
        rendimiento_unidades=receta.rendimiento_unidades,
        unidad_rendimiento=getattr(receta, "unidad_rendimiento", None) or "unidad",
        tiempo_preparacion_minutos=receta.tiempo_preparacion_minutos,
        porcentaje_costos_indirectos=receta.porcentaje_costos_indirectos,
        margen_ganancia_sugerido=receta.margen_ganancia_sugerido,
        precio_venta_fijado=receta.precio_venta_fijado,
        fecha_creacion=receta.fecha_creacion,
        fecha_actualizacion=receta.fecha_actualizacion,
        ingredientes=ingredientes_out,
        costos=desglose
    )

@router.get("", response_model=List[RecetaOut])
def listar_recetas(
    categoria: Optional[str] = Query(None),
    buscar: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    valor_hora = get_config_val(db, "costo_hora_defecto", 20000.0)
    query = db.query(Receta).options(
        selectinload(Receta.ingredientes).selectinload(RecetaIngrediente.insumo),
        selectinload(Receta.producciones)
    )
    if categoria:
        query = query.filter(Receta.categoria == categoria)
    if buscar:
        query = query.filter(Receta.nombre.ilike(f"%{buscar}%"))
    recetas = query.order_by(Receta.nombre.asc()).all()
    return [format_receta_out(r, valor_hora) for r in recetas]

@router.post("", response_model=RecetaOut, status_code=201, dependencies=[Depends(require_admin)])
def crear_receta(receta_in: RecetaCreate, db: Session = Depends(get_db)):
    nueva = Receta(
        nombre=receta_in.nombre.strip(),
        categoria=receta_in.categoria.strip() if receta_in.categoria else "General",
        descripcion=receta_in.descripcion,
        rendimiento_unidades=receta_in.rendimiento_unidades,
        unidad_rendimiento=(receta_in.unidad_rendimiento or "unidad").strip(),
        tiempo_preparacion_minutos=receta_in.tiempo_preparacion_minutos,
        porcentaje_costos_indirectos=receta_in.porcentaje_costos_indirectos,
        margen_ganancia_sugerido=receta_in.margen_ganancia_sugerido,
        precio_venta_fijado=receta_in.precio_venta_fijado
    )
    db.add(nueva)
    db.flush()

    for item in receta_in.ingredientes:
        # Verificar que el insumo exista
        ins = db.query(Insumo).filter(Insumo.id == item.insumo_id).first()
        if not ins:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Insumo ID {item.insumo_id} no existe")
        ri = RecetaIngrediente(
            receta_id=nueva.id,
            insumo_id=item.insumo_id,
            cantidad=item.cantidad,
            notas=item.notas
        )
        db.add(ri)

    db.commit()
    db.refresh(nueva)
    valor_hora = get_config_val(db, "costo_hora_defecto", 20000.0)
    trigger_auto_sync(db)
    return format_receta_out(nueva, valor_hora)

@router.get("/{receta_id}", response_model=RecetaOut)
def obtener_receta(receta_id: int, db: Session = Depends(get_db)):
    receta = (
        db.query(Receta)
        .options(
            selectinload(Receta.ingredientes).selectinload(RecetaIngrediente.insumo),
            selectinload(Receta.producciones)
        )
        .filter(Receta.id == receta_id)
        .first()
    )
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    valor_hora = get_config_val(db, "costo_hora_defecto", 20000.0)
    return format_receta_out(receta, valor_hora)

@router.put("/{receta_id}", response_model=RecetaOut, dependencies=[Depends(require_admin)])
def actualizar_receta(receta_id: int, receta_in: RecetaUpdate, db: Session = Depends(get_db)):
    receta = db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

    data = receta_in.dict(exclude_unset=True)
    if "ingredientes" in data:
        items_data = data.pop("ingredientes")
        # Eliminar items existentes
        db.query(RecetaIngrediente).filter(RecetaIngrediente.receta_id == receta.id).delete()
        if items_data:
            for item in items_data:
                ins = db.query(Insumo).filter(Insumo.id == item["insumo_id"]).first()
                if not ins:
                    db.rollback()
                    raise HTTPException(status_code=400, detail=f"Insumo ID {item['insumo_id']} no existe")
                ri = RecetaIngrediente(
                    receta_id=receta.id,
                    insumo_id=item["insumo_id"],
                    cantidad=item["cantidad"],
                    notas=item.get("notas")
                )
                db.add(ri)

    for field, val in data.items():
        setattr(receta, field, val)

    db.commit()
    db.refresh(receta)
    valor_hora = get_config_val(db, "costo_hora_defecto", 20000.0)
    trigger_auto_sync(db)
    return format_receta_out(receta, valor_hora)

@router.delete("/{receta_id}", status_code=204, dependencies=[Depends(require_admin)])
def eliminar_receta(receta_id: int, db: Session = Depends(get_db)):
    receta = db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    
    # 1. Eliminar referencias en sesiones de producción para evitar error 500 por Foreign Key
    db.query(SesionProduccionItem).filter(SesionProduccionItem.receta_id == receta.id).delete(synchronize_session=False)
    
    # 2. Eliminar ingredientes de la receta
    db.query(RecetaIngrediente).filter(RecetaIngrediente.receta_id == receta.id).delete(synchronize_session=False)
    
    # 3. Eliminar la receta
    db.delete(receta)
    db.commit()
    trigger_auto_sync(db)
    return None
