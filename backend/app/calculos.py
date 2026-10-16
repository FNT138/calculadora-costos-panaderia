from typing import Tuple, List
from .models import Receta, Insumo, Configuracion
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
