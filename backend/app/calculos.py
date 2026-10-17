import math
from typing import Tuple, List, Dict, Any
from .models import Receta, Insumo, Configuracion, PresentacionVenta
from .schemas import DesgloseCostos, PuntoCurvaGanancia, SimuladorAnalisis

def get_config_val(db, clave: str, default: float) -> float:
    cfg = db.query(Configuracion).filter(Configuracion.clave == clave).first()
    if cfg:
        try:
            return float(cfg.valor)
        except ValueError:
            return default
    return default

def calcular_desglose_receta(receta: Receta, valor_hora: float = 20000.0) -> DesgloseCostos:
    """Calcula el desglose completo de costos de una receta por tanda y por unidad."""
    costo_ingredientes_tanda = 0.0
    costo_packaging_tanda = 0.0

    rendimiento = receta.rendimiento_unidades if receta.rendimiento_unidades > 0 else 1.0

    for item in receta.ingredientes:
        insumo = item.insumo
        if not insumo:
            continue
        # Aseguramos que el costo base esté actualizado
        costo_base = insumo.costo_por_unidad_base
        if costo_base <= 0:
            costo_base = insumo.calcular_costo_base()
        
        costo_linea = costo_base * item.cantidad
        if insumo.categoria == "packaging":
            costo_packaging_tanda += costo_linea
        else:
            costo_ingredientes_tanda += costo_linea

    costo_materia_prima_tanda = costo_ingredientes_tanda + costo_packaging_tanda

    costo_ingredientes_unit = costo_ingredientes_tanda / rendimiento
    costo_packaging_unit = costo_packaging_tanda / rendimiento
    costo_materia_prima_unit = costo_materia_prima_tanda / rendimiento

    # Mano de obra estándar estimada por tanda
    horas_tanda = (receta.tiempo_preparacion_minutos or 0.0) / 60.0
    costo_mano_obra_tanda = horas_tanda * valor_hora
    costo_mano_obra_unit = costo_mano_obra_tanda / rendimiento

    # Costos indirectos (gas, luz, desgaste) aplicados sobre materia prima + mano de obra
    porc_indirectos = (receta.porcentaje_costos_indirectos or 0.0) / 100.0
    costo_indirectos_unit = (costo_materia_prima_unit + costo_mano_obra_unit) * porc_indirectos

    costo_total_unit = costo_materia_prima_unit + costo_mano_obra_unit + costo_indirectos_unit

    # Precio sugerido según margen de ganancia configurado en la receta
    margen_pct = (receta.margen_ganancia_sugerido or 50.0) / 100.0
    # Margen sobre costo (Cost-plus): Precio = Costo * (1 + Margen)
    precio_sugerido = costo_total_unit * (1.0 + margen_pct)
    ganancia_sugerida = precio_sugerido - costo_total_unit

    margen_sobre_costo = (ganancia_sugerida / costo_total_unit * 100.0) if costo_total_unit > 0 else 0.0
    margen_sobre_precio = (ganancia_sugerida / precio_sugerido * 100.0) if precio_sugerido > 0 else 0.0

    # Si hay precio manual fijado
    ganancia_fijada = None
    margen_fijado = None
    if receta.precio_venta_fijado is not None and receta.precio_venta_fijado > 0:
        ganancia_fijada = receta.precio_venta_fijado - costo_total_unit
        margen_fijado = (ganancia_fijada / costo_total_unit * 100.0) if costo_total_unit > 0 else 0.0

    return DesgloseCostos(
        costo_ingredientes_tanda=round(costo_ingredientes_tanda, 2),
        costo_packaging_tanda=round(costo_packaging_tanda, 2),
        costo_materia_prima_tanda=round(costo_materia_prima_tanda, 2),
        costo_ingredientes_unitario=round(costo_ingredientes_unit, 2),
        costo_packaging_unitario=round(costo_packaging_unit, 2),
        costo_materia_prima_unitario=round(costo_materia_prima_unit, 2),
        costo_mano_obra_unitario=round(costo_mano_obra_unit, 2),
        costo_indirectos_unitario=round(costo_indirectos_unit, 2),
        costo_total_unitario=round(costo_total_unit, 2),
        precio_sugerido=round(precio_sugerido, 2),
        ganancia_unitaria_sugerida=round(ganancia_sugerida, 2),
        margen_sobre_costo=round(margen_sobre_costo, 1),
        margen_sobre_precio=round(margen_sobre_precio, 1),
        precio_venta_fijado=receta.precio_venta_fijado,
        ganancia_unitaria_fijada=round(ganancia_fijada, 2) if ganancia_fijada is not None else None,
        margen_fijado=round(margen_fijado, 1) if margen_fijado is not None else None,
    )


def generar_curva_sensibilidad(receta: Receta, desglose: DesgloseCostos) -> Tuple[List[PuntoCurvaGanancia], float]:
    """
    Genera puntos de la curva de sensibilidad y maximización de ganancias.
    Usa un modelo de elasticidad de demanda estimado para panadería casera (epsilon = 1.6).
    Muestra cómo varía la ganancia total al mover el precio entre costo base y 3x el costo.
    """
    costo_unit = desglose.costo_total_unitario
    if costo_unit <= 0:
        costo_unit = 100.0

    # Precio base de referencia (ej. con 60% de margen)
    precio_ref = costo_unit * 1.6
    volumen_ref = 100.0 # Tanda base de 100 unidades semanales
    elasticidad = 1.65 # Elasticidad precio de la demanda típica en repostería artesanal

    curva: List[PuntoCurvaGanancia] = []
    
    # Probamos multiplicadores desde 1.0 (costo puro) hasta 2.8 (alta gama)
    multiplicadores = [
        1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.2, 2.4, 2.6, 2.8
    ]

    max_ganancia_total = -1.0
    precio_optimo = precio_ref

    for m in multiplicadores:
        p = round(costo_unit * m, 2)
        ganancia_u = p - costo_unit
        margen_pct = round(((p - costo_unit) / costo_unit) * 100.0, 1) if costo_unit > 0 else 0.0

        # Modelo de demanda con elasticidad: Q = Q0 * (P0 / P)^elasticidad
        if p > 0:
            factor_precio = precio_ref / p
            # Acotamos para evitar extremos irreales
            volumen = max(5.0, round(volumen_ref * (factor_precio ** elasticidad), 1))
        else:
            volumen = 0.0

        ingreso_tot = round(p * volumen, 2)
        costo_tot = round(costo_unit * volumen, 2)
        ganancia_tot = round(ganancia_u * volumen, 2)

        if ganancia_tot > max_ganancia_total and p > costo_unit:
            max_ganancia_total = ganancia_tot
            precio_optimo = p

        curva.append(PuntoCurvaGanancia(
            precio=p,
            margen_porcentaje=margen_pct,
            ganancia_unitaria=round(ganancia_u, 2),
            volumen_estimado=volumen,
            ingreso_total=ingreso_tot,
            costo_total=costo_tot,
            ganancia_total=ganancia_tot
        ))

    return curva, precio_optimo


def redondear_hacia_arriba(precio: float, multiplo: int = 50) -> float:
    """
    Redondea un precio hacia arriba (ceiling) al múltiplo indicado (5, 10, 50, 100, etc.).
    Ejemplo: 1234 con múltiplo 10 -> 1240; con múltiplo 50 -> 1250.
    """
    if not multiplo or multiplo <= 0:
        return float(math.ceil(precio))
    return float(math.ceil(precio / multiplo) * multiplo)


def calcular_desglose_presentacion(presentacion: PresentacionVenta, valor_hora: float = 20000.0) -> Dict[str, Any]:
    """
    Calcula el costo total de los productos incluidos, el costo de packaging,
    el precio base sugerido, el precio redondeado hacia arriba y las ganancias netas del pack.
    """
    costo_productos = 0.0
    precio_productos = 0.0
    items_desglose = []

    for it in presentacion.items:
        receta = it.receta
        if not receta:
            continue
        desglose_rec = calcular_desglose_receta(receta, valor_hora=valor_hora)
        costo_u = desglose_rec.costo_total_unitario
        # Precio unitario base de la receta (si tiene fijado, lo toma; si no, el sugerido)
        precio_u = receta.precio_venta_fijado if (receta.precio_venta_fijado and receta.precio_venta_fijado > 0) else desglose_rec.precio_sugerido
        
        cant = it.cantidad if it.cantidad > 0 else 1.0
        subtot_costo = round(costo_u * cant, 2)
        subtot_precio = round(precio_u * cant, 2)

        costo_productos += subtot_costo
        precio_productos += subtot_precio

        items_desglose.append({
            "id": it.id,
            "receta_id": it.receta_id,
            "receta_nombre": receta.nombre,
            "receta_categoria": receta.categoria,
            "cantidad": cant,
            "costo_unitario_receta": round(costo_u, 2),
            "costo_total_item": subtot_costo,
            "precio_sugerido_unitario": round(precio_u, 2),
            "precio_sugerido_item": subtot_precio,
            "notas": it.notas
        })

    # Packaging
    costo_packaging_unit = 0.0
    packaging_nombre = None
    if presentacion.packaging:
        pkg = presentacion.packaging
        packaging_nombre = pkg.nombre
        costo_base_pkg = pkg.costo_por_unidad_base
        if costo_base_pkg <= 0:
            costo_base_pkg = pkg.calcular_costo_base()
        costo_packaging_unit = costo_base_pkg

    cant_pkg = presentacion.cantidad_packaging if presentacion.cantidad_packaging is not None else 1.0
    costo_packaging_total = round(costo_packaging_unit * cant_pkg, 2)

    costo_total = round(costo_productos + costo_packaging_total, 2)

    # Margen adicional sobre el pack si está configurado
    margen_extra = (presentacion.margen_adicional or 0.0) / 100.0
    # Precio base: suma de precios de los productos + packaging con margen
    precio_base_calculado = round((precio_productos + (costo_packaging_total * 1.5)) * (1.0 + margen_extra), 2)
    if precio_base_calculado <= 0:
        precio_base_calculado = round(costo_total * 1.6, 2)

    # Redondeo comercial hacia arriba al múltiplo (1000 al millar, 500, 5000, 100)
    multiplo = presentacion.redondeo_multiplo if (presentacion.redondeo_multiplo and presentacion.redondeo_multiplo > 0) else 1000
    precio_redondeado = redondear_hacia_arriba(precio_base_calculado, multiplo)

    # Precio final: si el usuario fijó manualmente un precio, respetarlo; de lo contrario, el redondeado
    if presentacion.precio_venta_fijado is not None and presentacion.precio_venta_fijado > 0:
        precio_final = presentacion.precio_venta_fijado
    else:
        precio_final = precio_redondeado

    ganancia_neta = round(precio_final - costo_total, 2)
    margen_pct = round((ganancia_neta / costo_total * 100.0), 1) if costo_total > 0 else 0.0

    # Precio expresado en miles (ej. $30.000 -> 30, $24.000 -> 24)
    precio_venta_miles = round(precio_final / 1000.0, 1)

    return {
        "packaging_nombre": packaging_nombre,
        "costo_packaging_unitario": round(costo_packaging_unit, 2),
        "costo_packaging_total": costo_packaging_total,
        "costo_productos_total": round(costo_productos, 2),
        "costo_total_presentacion": costo_total,
        "precio_base_calculado": precio_base_calculado,
        "precio_venta_redondeado": precio_redondeado,
        "precio_venta_final": precio_final,
        "precio_venta_miles": precio_venta_miles,
        "ganancia_neta": ganancia_neta,
        "margen_porcentaje": margen_pct,
        "items": items_desglose
    }
