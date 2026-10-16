from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from ..models import Receta, RecetaIngrediente
from ..schemas import SimuladorAnalisis
from ..calculos import calcular_desglose_receta, generar_curva_sensibilidad, get_config_val

router = APIRouter(prefix="/api/simulador", tags=["Simulador de Precios y Ganancias"])

@router.get("/analisis/{receta_id}", response_model=SimuladorAnalisis)
def analizar_receta(
    receta_id: int,
    valor_hora: Optional[float] = Query(None, description="Sobrescribir valor hora para la simulación"),
    margen_override: Optional[float] = Query(None, description="Sobrescribir margen % para la simulación"),
    db: Session = Depends(get_db)
):
    receta = (
        db.query(Receta)
        .options(
            selectinload(Receta.ingredientes).selectinload(RecetaIngrediente.insumo)
        )
        .filter(Receta.id == receta_id)
        .first()
    )
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

    v_hora = valor_hora if (valor_hora is not None and valor_hora > 0) else get_config_val(db, "costo_hora_defecto", 20000.0)
    
    # Si hay margen override temporal para simulación
    margen_original = receta.margen_ganancia_sugerido
    if margen_override is not None and margen_override >= 0:
        receta.margen_ganancia_sugerido = margen_override

    desglose = calcular_desglose_receta(receta, valor_hora=v_hora)
    curva, precio_optimo = generar_curva_sensibilidad(receta, desglose)

    # Restauramos si lo cambiamos temporalmente en memoria
    receta.margen_ganancia_sugerido = margen_original

    costo_u = desglose.costo_total_unitario
    precio_minimo = costo_u
    precio_economico = round(costo_u * 1.30, 2)
    precio_rec = desglose.precio_sugerido
    precio_prem = round(costo_u * 2.20, 2)

    return SimuladorAnalisis(
        receta_id=receta.id,
        receta_nombre=receta.nombre,
        costo_total_unitario=costo_u,
        desglose=desglose,
        precio_minimo_equilibrio=round(precio_minimo, 2),
        precio_economico=precio_economico,
        precio_recomendado=precio_rec,
        precio_premium=precio_prem,
        precio_optimo_ganancia=round(precio_optimo, 2),
        curva_sensibilidad=curva
    )
