from typing import List, Optional
import io
import csv
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from ..models import PresentacionVenta, PresentacionVentaItem, Receta, Insumo
from ..schemas import (
    PresentacionCreate,
    PresentacionUpdate,
    PresentacionOut,
    PresentacionItemOut
)
from ..calculos import calcular_desglose_presentacion, get_config_val
from ..github_sync import trigger_auto_sync
from .auth import require_admin

router = APIRouter(prefix="/api/ventas", tags=["Ventas y Presentaciones"])


def format_presentacion_out(p: PresentacionVenta, valor_hora: float) -> PresentacionOut:
    calc = calcular_desglose_presentacion(p, valor_hora=valor_hora)
    
    items_out = [
        PresentacionItemOut(
            id=it["id"],
            receta_id=it["receta_id"],
            receta_nombre=it["receta_nombre"],
            receta_categoria=it.get("receta_categoria"),
            cantidad=it["cantidad"],
            costo_unitario_receta=it["costo_unitario_receta"],
            costo_total_item=it["costo_total_item"],
            precio_sugerido_unitario=it["precio_sugerido_unitario"],
            precio_sugerido_item=it["precio_sugerido_item"],
            notas=it.get("notas")
        )
        for it in calc["items"]
    ]

    return PresentacionOut(
        id=p.id,
        nombre=p.nombre,
        descripcion=p.descripcion,
        categoria=p.categoria,
        packaging_id=p.packaging_id,
        cantidad_packaging=p.cantidad_packaging,
        margen_adicional=p.margen_adicional,
        precio_venta_fijado=p.precio_venta_fijado,
        redondeo_multiplo=p.redondeo_multiplo,
        activo=p.activo,
        packaging_nombre=calc["packaging_nombre"],
        costo_packaging_unitario=calc["costo_packaging_unitario"],
        costo_packaging_total=calc["costo_packaging_total"],
        costo_productos_total=calc["costo_productos_total"],
        costo_total_presentacion=calc["costo_total_presentacion"],
        precio_base_calculado=calc["precio_base_calculado"],
        precio_venta_redondeado=calc["precio_venta_redondeado"],
        precio_venta_final=calc["precio_venta_final"],
        ganancia_neta=calc["ganancia_neta"],
        margen_porcentaje=calc["margen_porcentaje"],
        items=items_out,
        fecha_creacion=p.fecha_creacion,
        fecha_actualizacion=p.fecha_actualizacion
    )


@router.get("/presentaciones", response_model=List[PresentacionOut])
def listar_presentaciones(
    categoria: Optional[str] = Query(None),
    buscar: Optional[str] = Query(None),
    solo_activos: bool = Query(True),
    db: Session = Depends(get_db)
):
    valor_hora = get_config_val(db, "costo_hora_defecto", 20000.0)
    query = db.query(PresentacionVenta).options(
        selectinload(PresentacionVenta.packaging),
        selectinload(PresentacionVenta.items).selectinload(PresentacionVentaItem.receta)
    )

    if solo_activos:
        query = query.filter(PresentacionVenta.activo == 1)
    if categoria:
        query = query.filter(PresentacionVenta.categoria == categoria)
    if buscar:
        query = query.filter(PresentacionVenta.nombre.ilike(f"%{buscar}%"))

    presentaciones = query.order_by(PresentacionVenta.categoria.asc(), PresentacionVenta.nombre.asc()).all()
    return [format_presentacion_out(p, valor_hora) for p in presentaciones]


@router.get("/presentaciones/{id}", response_model=PresentacionOut)
def obtener_presentacion(id: int, db: Session = Depends(get_db)):
    valor_hora = get_config_val(db, "costo_hora_defecto", 20000.0)
    p = db.query(PresentacionVenta).options(
        selectinload(PresentacionVenta.packaging),
        selectinload(PresentacionVenta.items).selectinload(PresentacionVentaItem.receta)
    ).filter(PresentacionVenta.id == id).first()

    if not p:
        raise HTTPException(status_code=404, detail="Presentación de venta no encontrada")
    return format_presentacion_out(p, valor_hora)


@router.post("/presentaciones", response_model=PresentacionOut, status_code=201, dependencies=[Depends(require_admin)])
def crear_presentacion(data: PresentacionCreate, db: Session = Depends(get_db)):
    if not data.items:
        raise HTTPException(status_code=400, detail="Debe incluir al menos un producto o receta en la presentación")

    # Validar packaging si se seleccionó
    if data.packaging_id:
        pkg = db.query(Insumo).filter(Insumo.id == data.packaging_id).first()
        if not pkg:
            raise HTTPException(status_code=400, detail=f"Packaging ID {data.packaging_id} no existe")

    nueva = PresentacionVenta(
        nombre=data.nombre.strip(),
        descripcion=data.descripcion.strip() if data.descripcion else None,
        categoria=data.categoria.strip() if data.categoria else "Packs & Bandejas",
        packaging_id=data.packaging_id,
        cantidad_packaging=data.cantidad_packaging if data.cantidad_packaging is not None else 1.0,
        margen_adicional=data.margen_adicional or 0.0,
        precio_venta_fijado=data.precio_venta_fijado,
        redondeo_multiplo=data.redondeo_multiplo or 50,
        activo=data.activo if data.activo is not None else 1
    )
    db.add(nueva)
    db.flush()

    for it in data.items:
        receta = db.query(Receta).filter(Receta.id == it.receta_id).first()
        if not receta:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Receta ID {it.receta_id} no existe")
        
        db.add(PresentacionVentaItem(
            presentacion_id=nueva.id,
            receta_id=it.receta_id,
            cantidad=it.cantidad,
            notas=it.notas
        ))

    db.commit()
    db.refresh(nueva)
    trigger_auto_sync(db)

    valor_hora = get_config_val(db, "costo_hora_defecto", 20000.0)
    return format_presentacion_out(nueva, valor_hora)


@router.put("/presentaciones/{id}", response_model=PresentacionOut, dependencies=[Depends(require_admin)])
def actualizar_presentacion(id: int, data: PresentacionUpdate, db: Session = Depends(get_db)):
    p = db.query(PresentacionVenta).filter(PresentacionVenta.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Presentación de venta no encontrada")

    if data.nombre is not None:
        p.nombre = data.nombre.strip()
    if data.descripcion is not None:
        p.descripcion = data.descripcion.strip() if data.descripcion else None
    if data.categoria is not None:
        p.categoria = data.categoria.strip()
    if data.packaging_id is not None:
        if data.packaging_id > 0:
            pkg = db.query(Insumo).filter(Insumo.id == data.packaging_id).first()
            if not pkg:
                raise HTTPException(status_code=400, detail=f"Packaging ID {data.packaging_id} no existe")
            p.packaging_id = data.packaging_id
        else:
            p.packaging_id = None
    if data.cantidad_packaging is not None:
        p.cantidad_packaging = data.cantidad_packaging
    if data.margen_adicional is not None:
        p.margen_adicional = data.margen_adicional
    if data.precio_venta_fijado is not None:
        p.precio_venta_fijado = data.precio_venta_fijado if data.precio_venta_fijado > 0 else None
    if data.redondeo_multiplo is not None:
        p.redondeo_multiplo = data.redondeo_multiplo
    if data.activo is not None:
        p.activo = data.activo

    p.fecha_actualizacion = datetime.utcnow()

    # Actualizar items si fueron enviados
    if data.items is not None:
        if len(data.items) == 0:
            raise HTTPException(status_code=400, detail="Debe incluir al menos un producto o receta en la presentación")
        
        db.query(PresentacionVentaItem).filter(PresentacionVentaItem.presentacion_id == p.id).delete()
        for it in data.items:
            receta = db.query(Receta).filter(Receta.id == it.receta_id).first()
            if not receta:
                db.rollback()
                raise HTTPException(status_code=400, detail=f"Receta ID {it.receta_id} no existe")
            
            db.add(PresentacionVentaItem(
                presentacion_id=p.id,
                receta_id=it.receta_id,
                cantidad=it.cantidad,
                notas=it.notas
            ))

    db.commit()
    db.refresh(p)
    trigger_auto_sync(db)

    valor_hora = get_config_val(db, "costo_hora_defecto", 20000.0)
    return format_presentacion_out(p, valor_hora)


@router.delete("/presentaciones/{id}", status_code=204, dependencies=[Depends(require_admin)])
def eliminar_presentacion(id: int, db: Session = Depends(get_db)):
    p = db.query(PresentacionVenta).filter(PresentacionVenta.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Presentación de venta no encontrada")

    db.delete(p)
    db.commit()
    trigger_auto_sync(db)
    return Response(status_code=204)


@router.get("/exportar-csv")
def exportar_lista_precios_csv(db: Session = Depends(get_db)):
    """
    Genera un archivo CSV con la lista de precios redondeada y los componentes de cada presentación,
    listo para abrir directamente en Microsoft Excel o imprimir.
    """
    valor_hora = get_config_val(db, "costo_hora_defecto", 20000.0)
    presentaciones = db.query(PresentacionVenta).options(
        selectinload(PresentacionVenta.packaging),
        selectinload(PresentacionVenta.items).selectinload(PresentacionVentaItem.receta)
    ).filter(PresentacionVenta.activo == 1).order_by(
        PresentacionVenta.categoria.asc(), 
        PresentacionVenta.nombre.asc()
    ).all()

    output = io.StringIO()
    writer = csv.writer(output, delimiter=';') # Delimitador ';' ideal para Excel en español

    # Encabezados
    writer.writerow([
        "Categoría",
        "Presentación / Combo",
        "Descripción / Contenido",
        "Packaging",
        "Costo Total ($)",
        "Precio Base Calculado ($)",
        "Múltiplo Redondeo",
        "PRECIO DE VENTA ($)",
        "Ganancia Neta ($)",
        "Margen (%)"
    ])

    for p in presentaciones:
        calc = calcular_desglose_presentacion(p, valor_hora=valor_hora)
        contenido_str = ", ".join([f"{it['cantidad']}x {it['receta_nombre']}" for it in calc["items"]])
        pkg_str = f"{p.cantidad_packaging}x {calc['packaging_nombre']}" if calc['packaging_nombre'] else "Sin packaging adicional"

        writer.writerow([
            p.categoria,
            p.nombre,
            contenido_str,
            pkg_str,
            f"{calc['costo_total_presentacion']:.2f}",
            f"{calc['precio_base_calculado']:.2f}",
            f"${p.redondeo_multiplo}",
            f"{calc['precio_venta_final']:.2f}",
            f"{calc['ganancia_neta']:.2f}",
            f"{calc['margen_porcentaje']:.1f}%"
        ])

    csv_data = output.getvalue()
    # Codificamos en UTF-8 con BOM para compatibilidad total con Excel en Windows
    bom_csv = b'\xef\xbb\xbf' + csv_data.encode('utf-8')

    filename = f"lista_precios_panaderia_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"
    return StreamingResponse(
        io.BytesIO(bom_csv),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
