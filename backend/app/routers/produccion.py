from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SesionProduccion, SesionProduccionItem, Receta
from ..schemas import SesionCreate, SesionOut, SesionItemOut
from ..calculos import calcular_desglose_receta, get_config_val
from ..github_sync import trigger_auto_sync

router = APIRouter(prefix="/api/produccion", tags=["Sesiones de Producción y Mano de Obra"])

def format_sesion_out(sesion: SesionProduccion) -> SesionOut:
    items_out = []
    costo_total_sesion = 0.0
    total_unidades = 0.0

    for item in sesion.items:
        rec_nombre = item.receta.nombre if item.receta else "Receta Eliminada"
        costo_item_total = item.costo_total_unitario * item.unidades_producidas
        costo_total_sesion += costo_item_total
        total_unidades += item.unidades_producidas

        items_out.append(SesionItemOut(
            id=item.id,
            receta_id=item.receta_id,
            receta_nombre=rec_nombre,
            unidades_producidas=item.unidades_producidas,
            factor_dificultad=item.factor_dificultad,
            costo_mano_obra_unitario=round(item.costo_mano_obra_unitario, 2),
            costo_ingredientes_unitario=round(item.costo_ingredientes_unitario, 2),
            costo_packaging_unitario=round(item.costo_packaging_unitario, 2),
            costo_indirectos_unitario=round(item.costo_indirectos_unitario, 2),
            costo_total_unitario=round(item.costo_total_unitario, 2),
            costo_total_item=round(costo_item_total, 2)
        ))

    return SesionOut(
        id=sesion.id,
        fecha=sesion.fecha,
        titulo=sesion.titulo,
        horas_trabajadas=sesion.horas_trabajadas,
        costo_hora_mano_obra=sesion.costo_hora_mano_obra,
        costo_total_mano_obra=sesion.costo_total_mano_obra,
        notas=sesion.notas,
        items=items_out,
        costo_total_sesion=round(costo_total_sesion, 2),
        total_unidades_producidas=round(total_unidades, 1)
    )

@router.get("", response_model=List[SesionOut])
def listar_sesiones(db: Session = Depends(get_db)):
    sesiones = db.query(SesionProduccion).order_by(SesionProduccion.fecha.desc()).all()
    return [format_sesion_out(s) for s in sesiones]

@router.post("", response_model=SesionOut, status_code=201)
def registrar_sesion_produccion(sesion_in: SesionCreate, db: Session = Depends(get_db)):
    if not sesion_in.items:
        raise HTTPException(status_code=400, detail="Debe incluir al menos un producto elaborado en la sesión")

    valor_hora = sesion_in.costo_hora_mano_obra
    if valor_hora is None or valor_hora <= 0:
        valor_hora = get_config_val(db, "costo_hora_defecto", 20000.0)

    costo_total_mo = sesion_in.horas_trabajadas * valor_hora

    # Cálculo ponderado de unidades para prorratear la mano de obra
    # Suma de (unidades * factor_dificultad)
    unidades_ponderadas_totales = sum(item.unidades_producidas * (item.factor_dificultad or 1.0) for item in sesion_in.items)
    if unidades_ponderadas_totales <= 0:
        raise HTTPException(status_code=400, detail="Las unidades producidas deben ser mayores a cero")

    costo_por_unidad_ponderada_mo = costo_total_mo / unidades_ponderadas_totales

    nueva_sesion = SesionProduccion(
        titulo=sesion_in.titulo.strip(),
        fecha=sesion_in.fecha or datetime.utcnow(),
        horas_trabajadas=sesion_in.horas_trabajadas,
        costo_hora_mano_obra=valor_hora,
        costo_total_mano_obra=round(costo_total_mo, 2),
        notas=sesion_in.notas
    )
    db.add(nueva_sesion)
    db.flush()

    for item_in in sesion_in.items:
        receta = db.query(Receta).filter(Receta.id == item_in.receta_id).first()
        if not receta:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Receta ID {item_in.receta_id} no encontrada")

        # Calculamos los costos unitarios actuales de materia prima y packaging
        desglose = calcular_desglose_receta(receta, valor_hora=valor_hora)

        dificultad = item_in.factor_dificultad if item_in.factor_dificultad and item_in.factor_dificultad > 0 else 1.0
        # Mano de obra unitaria prorrateada en base a la ventana de tiempo real trabajada
        mo_unitario = costo_por_unidad_ponderada_mo * dificultad

        # Costos indirectos calculados para esta tanda
        porc_ind = (receta.porcentaje_costos_indirectos or 10.0) / 100.0
        indirectos_unit = (desglose.costo_materia_prima_unitario + mo_unitario) * porc_ind

        costo_tot_unit = desglose.costo_materia_prima_unitario + mo_unitario + indirectos_unit

        item_db = SesionProduccionItem(
            sesion_id=nueva_sesion.id,
            receta_id=receta.id,
            unidades_producidas=item_in.unidades_producidas,
            factor_dificultad=dificultad,
            costo_mano_obra_unitario=round(mo_unitario, 2),
            costo_ingredientes_unitario=round(desglose.costo_ingredientes_unitario, 2),
            costo_packaging_unitario=round(desglose.costo_packaging_unitario, 2),
            costo_indirectos_unitario=round(indirectos_unit, 2),
            costo_total_unitario=round(costo_tot_unit, 2)
        )
        db.add(item_db)

    db.commit()
    db.refresh(nueva_sesion)
    trigger_auto_sync(db)
    return format_sesion_out(nueva_sesion)

@router.get("/{sesion_id}", response_model=SesionOut)
def obtener_sesion(sesion_id: int, db: Session = Depends(get_db)):
    sesion = db.query(SesionProduccion).filter(SesionProduccion.id == sesion_id).first()
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return format_sesion_out(sesion)

@router.delete("/{sesion_id}", status_code=204)
def eliminar_sesion(sesion_id: int, db: Session = Depends(get_db)):
    sesion = db.query(SesionProduccion).filter(SesionProduccion.id == sesion_id).first()
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    db.delete(sesion)
    db.commit()
    trigger_auto_sync(db)
    return None
