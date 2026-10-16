from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from ..models import SesionProduccion, SesionProduccionItem, Receta
from ..schemas import SesionCreate, SesionOut, SesionItemOut
from ..calculos import calcular_desglose_receta, get_config_val
from ..github_sync import trigger_auto_sync
from .auth import require_admin

router = APIRouter(prefix="/api/produccion", tags=["Sesiones de Producción y Mano de Obra"])

def format_sesion_out(sesion: SesionProduccion) -> SesionOut:
    items_out = []
    costo_total_sesion = 0.0
    total_unidades = 0.0
    horas_activas_totales = 0.0
    inversion_ingredientes_total = 0.0
    inversion_packaging_total = 0.0
    ingreso_estimado_total = 0.0

    valor_hora = sesion.costo_hora_mano_obra or 20000.0

    for item in sesion.items:
        rec = item.receta
        rec_nombre = rec.nombre if rec else "Receta Eliminada"
        costo_item_total = item.costo_total_unitario * item.unidades_producidas
        costo_total_sesion += costo_item_total
        total_unidades += item.unidades_producidas

        # Tiempo activo de preparación estimado para el lote
        tiempo_prep = rec.tiempo_preparacion_minutos if (rec and rec.tiempo_preparacion_minutos) else 30.0
        tandas = getattr(item, "tandas", 1.0) or 1.0
        tiempo_activo_item_min = tiempo_prep * tandas
        horas_activas_totales += (tiempo_activo_item_min / 60.0)

        # Inversiones en insumos
        ing_subtot = item.costo_ingredientes_unitario * item.unidades_producidas
        pack_subtot = item.costo_packaging_unitario * item.unidades_producidas
        inversion_ingredientes_total += ing_subtot
        inversion_packaging_total += pack_subtot

        # Precios y márgenes
        margen = rec.margen_ganancia_sugerido if (rec and rec.margen_ganancia_sugerido is not None) else 60.0
        precio_sug = round(item.costo_total_unitario * (1.0 + margen / 100.0), 2)
        precio_fijado = rec.precio_venta_fijado if rec else None
        ganancia_unit = round(precio_sug - item.costo_total_unitario, 2)

        precio_efectivo = precio_fijado if (precio_fijado and precio_fijado > 0) else precio_sug
        ingreso_estimado_total += (precio_efectivo * item.unidades_producidas)

        items_out.append(SesionItemOut(
            id=item.id,
            receta_id=item.receta_id,
            receta_nombre=rec_nombre,
            unidades_producidas=item.unidades_producidas,
            factor_dificultad=item.factor_dificultad,
            tandas=tandas,
            tiempo_activo_minutos=round(tiempo_activo_item_min, 1),
            costo_mano_obra_unitario=round(item.costo_mano_obra_unitario, 2),
            costo_ingredientes_unitario=round(item.costo_ingredientes_unitario, 2),
            costo_packaging_unitario=round(item.costo_packaging_unitario, 2),
            costo_indirectos_unitario=round(item.costo_indirectos_unitario, 2),
            costo_total_unitario=round(item.costo_total_unitario, 2),
            costo_total_item=round(costo_item_total, 2),
            precio_sugerido_unitario=precio_sug,
            precio_venta_fijado=precio_fijado,
            margen_ganancia_sugerido=margen,
            ganancia_unitaria_sugerida=ganancia_unit
        ))

    inversion_insumos = inversion_ingredientes_total + inversion_packaging_total
    costo_mo_activa = round(horas_activas_totales * valor_hora, 2)
    ganancia_neta = round(ingreso_estimado_total - costo_total_sesion, 2)

    return SesionOut(
        id=sesion.id,
        fecha=sesion.fecha,
        titulo=sesion.titulo,
        horas_trabajadas=sesion.horas_trabajadas,
        costo_hora_mano_obra=sesion.costo_hora_mano_obra,
        costo_total_mano_obra=sesion.costo_total_mano_obra,
        horas_activas=round(horas_activas_totales, 2),
        costo_mano_obra_activa=costo_mo_activa,
        inversion_ingredientes=round(inversion_ingredientes_total, 2),
        inversion_packaging=round(inversion_packaging_total, 2),
        inversion_total_insumos=round(inversion_insumos, 2),
        ingreso_estimado_sugerido=round(ingreso_estimado_total, 2),
        ganancia_neta_estimada=ganancia_neta,
        notas=sesion.notas,
        items=items_out,
        costo_total_sesion=round(costo_total_sesion, 2),
        total_unidades_producidas=round(total_unidades, 1)
    )

@router.get("", response_model=List[SesionOut])
def listar_sesiones(db: Session = Depends(get_db)):
    sesiones = (
        db.query(SesionProduccion)
        .options(
            selectinload(SesionProduccion.items).selectinload(SesionProduccionItem.receta)
        )
        .order_by(SesionProduccion.fecha.desc())
        .all()
    )
    return [format_sesion_out(s) for s in sesiones]

@router.post("", response_model=SesionOut, status_code=201, dependencies=[Depends(require_admin)])
def registrar_sesion_produccion(sesion_in: SesionCreate, db: Session = Depends(get_db)):
    if not sesion_in.items:
        raise HTTPException(status_code=400, detail="Debe incluir al menos un producto elaborado en la sesión")

    valor_hora = sesion_in.costo_hora_mano_obra
    if valor_hora is None or valor_hora <= 0:
        valor_hora = get_config_val(db, "costo_hora_defecto", 20000.0)

    costo_total_mo = sesion_in.horas_trabajadas * valor_hora
    modo = sesion_in.modo_calculo or "activo"

    costo_por_unidad_ponderada_mo = 0.0
    if modo == "prorrateo":
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
        tandas = item_in.tandas if item_in.tandas and item_in.tandas > 0 else 1.0

        if modo == "activo":
            # Tiempo activo de preparación de la tanda (no multiplica tiempo si se hace en una sola batida)
            tiempo_prep = receta.tiempo_preparacion_minutos if receta.tiempo_preparacion_minutos and receta.tiempo_preparacion_minutos > 0 else 30.0
            tiempo_activo_horas = (tiempo_prep / 60.0) * tandas
            costo_mo_item = tiempo_activo_horas * valor_hora * dificultad
            mo_unitario = costo_mo_item / item_in.unidades_producidas
        else:
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

@router.put("/{sesion_id}", response_model=SesionOut, dependencies=[Depends(require_admin)])
def actualizar_sesion_produccion(sesion_id: int, sesion_in: SesionCreate, db: Session = Depends(get_db)):
    sesion = db.query(SesionProduccion).filter(SesionProduccion.id == sesion_id).first()
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    if not sesion_in.items:
        raise HTTPException(status_code=400, detail="Debe incluir al menos un producto elaborado en la sesión")

    valor_hora = sesion_in.costo_hora_mano_obra
    if valor_hora is None or valor_hora <= 0:
        valor_hora = get_config_val(db, "costo_hora_defecto", 20000.0)

    costo_total_mo = sesion_in.horas_trabajadas * valor_hora
    modo = sesion_in.modo_calculo or "activo"

    costo_por_unidad_ponderada_mo = 0.0
    if modo == "prorrateo":
        unidades_ponderadas_totales = sum(item.unidades_producidas * (item.factor_dificultad or 1.0) for item in sesion_in.items)
        if unidades_ponderadas_totales <= 0:
            raise HTTPException(status_code=400, detail="Las unidades producidas deben ser mayores a cero")
        costo_por_unidad_ponderada_mo = costo_total_mo / unidades_ponderadas_totales

    sesion.titulo = sesion_in.titulo.strip()
    if sesion_in.fecha:
        sesion.fecha = sesion_in.fecha
    sesion.horas_trabajadas = sesion_in.horas_trabajadas
    sesion.costo_hora_mano_obra = valor_hora
    sesion.costo_total_mano_obra = round(costo_total_mo, 2)
    sesion.notas = sesion_in.notas

    # Reemplazar items de la sesión
    db.query(SesionProduccionItem).filter(SesionProduccionItem.sesion_id == sesion.id).delete()

    for item_in in sesion_in.items:
        receta = db.query(Receta).filter(Receta.id == item_in.receta_id).first()
        if not receta:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Receta ID {item_in.receta_id} no encontrada")

        desglose = calcular_desglose_receta(receta, valor_hora=valor_hora)
        dificultad = item_in.factor_dificultad if item_in.factor_dificultad and item_in.factor_dificultad > 0 else 1.0
        tandas = item_in.tandas if item_in.tandas and item_in.tandas > 0 else 1.0

        if modo == "activo":
            tiempo_prep = receta.tiempo_preparacion_minutos if receta.tiempo_preparacion_minutos and receta.tiempo_preparacion_minutos > 0 else 30.0
            tiempo_activo_horas = (tiempo_prep / 60.0) * tandas
            costo_mo_item = tiempo_activo_horas * valor_hora * dificultad
            mo_unitario = costo_mo_item / item_in.unidades_producidas
        else:
            mo_unitario = costo_por_unidad_ponderada_mo * dificultad

        porc_ind = (receta.porcentaje_costos_indirectos or 10.0) / 100.0
        indirectos_unit = (desglose.costo_materia_prima_unitario + mo_unitario) * porc_ind
        costo_tot_unit = desglose.costo_materia_prima_unitario + mo_unitario + indirectos_unit

        item_db = SesionProduccionItem(
            sesion_id=sesion.id,
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
    db.refresh(sesion)
    trigger_auto_sync(db)
    return format_sesion_out(sesion)

@router.delete("/{sesion_id}", status_code=204, dependencies=[Depends(require_admin)])
def eliminar_sesion(sesion_id: int, db: Session = Depends(get_db)):
    sesion = db.query(SesionProduccion).filter(SesionProduccion.id == sesion_id).first()
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    db.delete(sesion)
    db.commit()
    trigger_auto_sync(db)
    return None
