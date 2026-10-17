from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

# ----------------- INSUMOS -----------------
class InsumoBase(BaseModel):
    nombre: str = Field(..., example="Harina 000")
    categoria: str = Field(default="ingrediente", example="ingrediente") # "ingrediente" o "packaging"
    unidad_compra: str = Field(..., example="kg")
    cantidad_compra: float = Field(default=1.0, gt=0, example=1.0)
    precio_compra: float = Field(..., ge=0, example=1500.0)
    merma_porcentaje: float = Field(default=0.0, ge=0, lt=100, example=0.0)
    notas: Optional[str] = None

class InsumoCreate(InsumoBase):
    pass

class InsumoUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    unidad_compra: Optional[str] = None
    cantidad_compra: Optional[float] = None
    precio_compra: Optional[float] = None
    merma_porcentaje: Optional[float] = None
    notas: Optional[str] = None

class InsumoOut(InsumoBase):
    id: int
    unidad_base: str
    costo_por_unidad_base: float
    fecha_actualizacion: Optional[datetime] = None

    class Config:
        from_attributes = True

class InsumoBulkItemUpdate(BaseModel):
    id: int
    precio_compra: float = Field(..., ge=0)
    cantidad_compra: Optional[float] = Field(default=None, gt=0)
    merma_porcentaje: Optional[float] = Field(default=None, ge=0, lt=100)

class InsumoBulkUpdateRequest(BaseModel):
    items: List[InsumoBulkItemUpdate] = []
    porcentaje_aumento_global: Optional[float] = None
    categoria_filtro: Optional[str] = None


# ----------------- RECETA INGREDIENTES -----------------
class RecetaIngredienteCreate(BaseModel):
    insumo_id: int
    cantidad: float = Field(..., gt=0, example=400.0) # en unidad base (g, ml, unid)
    notas: Optional[str] = None

class RecetaIngredienteOut(BaseModel):
    id: int
    insumo_id: int
    insumo_nombre: str
    insumo_categoria: str
    unidad_base: str
    cantidad: float
    costo_unitario_insumo: float
    subtotal: float
    notas: Optional[str] = None

    class Config:
        from_attributes = True


# ----------------- RECETAS -----------------
class RecetaBase(BaseModel):
    nombre: str = Field(..., example="Cañoncitos de Dulce de Leche")
    categoria: Optional[str] = Field(default="General", example="Facturas")
    descripcion: Optional[str] = None
    rendimiento_unidades: float = Field(default=1.0, gt=0, example=24.0)
    unidad_rendimiento: Optional[str] = Field(default="unidad", example="alfajor")
    tiempo_preparacion_minutos: float = Field(default=60.0, ge=0, example=45.0)
    porcentaje_costos_indirectos: float = Field(default=10.0, ge=0, example=10.0)
    margen_ganancia_sugerido: float = Field(default=60.0, ge=0, example=60.0)
    precio_venta_fijado: Optional[float] = None

class RecetaCreate(RecetaBase):
    ingredientes: List[RecetaIngredienteCreate] = []

class RecetaUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    descripcion: Optional[str] = None
    rendimiento_unidades: Optional[float] = None
    unidad_rendimiento: Optional[str] = None
    tiempo_preparacion_minutos: Optional[float] = None
    porcentaje_costos_indirectos: Optional[float] = None
    margen_ganancia_sugerido: Optional[float] = None
    precio_venta_fijado: Optional[float] = None
    ingredientes: Optional[List[RecetaIngredienteCreate]] = None

class DesgloseCostos(BaseModel):
    costo_ingredientes_tanda: float
    costo_packaging_tanda: float
    costo_materia_prima_tanda: float
    costo_indirectos_tanda: float = 0.0
    costo_total_tanda: float = 0.0
    precio_sugerido_tanda: float = 0.0
    ganancia_sugerida_tanda: float = 0.0
    
    costo_ingredientes_unitario: float
    costo_packaging_unitario: float
    costo_materia_prima_unitario: float
    costo_mano_obra_unitario: float
    costo_indirectos_unitario: float
    costo_total_unitario: float

    # Mano de obra prorrateada desde la última sesión de Stock (Mano de Obra & Horas)
    costo_mano_obra_prorrateada: float = 0.0
    costo_total_con_mo_prorrateada: float = 0.0
    precio_sugerido_con_mo_prorrateada: float = 0.0

    precio_sugerido: float
    ganancia_unitaria_sugerida: float
    margen_sobre_costo: float
    margen_sobre_precio: float

    precio_venta_fijado: Optional[float] = None
    ganancia_unitaria_fijada: Optional[float] = None
    margen_fijado: Optional[float] = None

class RecetaOut(RecetaBase):
    id: int
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    ingredientes: List[RecetaIngredienteOut] = []
    costos: Optional[DesgloseCostos] = None

    class Config:
        from_attributes = True


# ----------------- SESIONES DE PRODUCCIÓN (VENTANA TEMPORAL) -----------------
class SesionItemInput(BaseModel):
    receta_id: int
    unidades_producidas: float = Field(..., gt=0, example=40.0)
    factor_dificultad: float = Field(default=1.0, gt=0, example=1.0)
    tandas: Optional[float] = Field(default=1.0, gt=0, example=1.0)

class SesionCreate(BaseModel):
    titulo: str = Field(..., example="Horneada del Sábado Mañana")
    fecha: Optional[datetime] = None
    horas_trabajadas: float = Field(..., gt=0, example=3.0)
    costo_hora_mano_obra: Optional[float] = Field(default=None, example=20000.0)
    modo_calculo: Optional[str] = Field(default="activo", example="activo")
    notas: Optional[str] = None
    items: List[SesionItemInput] = []

class SesionItemOut(BaseModel):
    id: int
    receta_id: int
    receta_nombre: str
    unidades_producidas: float
    factor_dificultad: float
    tandas: Optional[float] = 1.0
    tiempo_activo_minutos: Optional[float] = 0.0
    costo_mano_obra_unitario: float
    costo_ingredientes_unitario: float
    costo_packaging_unitario: float
    costo_indirectos_unitario: float
    costo_total_unitario: float
    costo_total_item: float
    precio_sugerido_unitario: Optional[float] = 0.0
    precio_venta_fijado: Optional[float] = None
    margen_ganancia_sugerido: Optional[float] = 60.0
    ganancia_unitaria_sugerida: Optional[float] = 0.0

    class Config:
        from_attributes = True

class SesionOut(BaseModel):
    id: int
    fecha: datetime
    titulo: str
    horas_trabajadas: float
    costo_hora_mano_obra: float
    costo_total_mano_obra: float
    horas_activas: Optional[float] = 0.0
    costo_mano_obra_activa: Optional[float] = 0.0
    inversion_ingredientes: Optional[float] = 0.0
    inversion_packaging: Optional[float] = 0.0
    inversion_total_insumos: Optional[float] = 0.0
    ingreso_estimado_sugerido: Optional[float] = 0.0
    ganancia_neta_estimada: Optional[float] = 0.0
    notas: Optional[str] = None
    items: List[SesionItemOut] = []
    costo_total_sesion: float
    total_unidades_producidas: float

    class Config:
        from_attributes = True


# ----------------- SIMULADOR Y MAXIMIZACIÓN DE PRECIOS -----------------
class PuntoCurvaGanancia(BaseModel):
    precio: float
    margen_porcentaje: float
    ganancia_unitaria: float
    volumen_estimado: float
    ingreso_total: float
    costo_total: float
    ganancia_total: float

class SimuladorAnalisis(BaseModel):
    receta_id: int
    receta_nombre: str
    costo_total_unitario: float
    desglose: DesgloseCostos
    precio_minimo_equilibrio: float
    precio_economico: float
    precio_recomendado: float
    precio_premium: float
    precio_optimo_ganancia: float
    curva_sensibilidad: List[PuntoCurvaGanancia]


# ----------------- CONFIGURACIÓN -----------------
class ConfiguracionItem(BaseModel):
    clave: str
    valor: str
    descripcion: Optional[str] = None

class ConfiguracionUpdate(BaseModel):
    costo_hora_defecto: Optional[float] = None
    margen_defecto: Optional[float] = None
    porcentaje_servicios_defecto: Optional[float] = None


# ----------------- PRESENTACIONES DE VENTA & PACKS -----------------
class PresentacionItemInput(BaseModel):
    receta_id: int
    cantidad: float = Field(..., gt=0, example=2.0)
    notas: Optional[str] = None

class PresentacionItemOut(BaseModel):
    id: int
    receta_id: int
    receta_nombre: str
    receta_categoria: Optional[str] = None
    cantidad: float
    costo_puro_unitario: float = 0.0
    costo_mano_obra_unitario: float = 0.0
    costo_mano_obra_item: float = 0.0
    costo_unitario_receta: float
    costo_total_item: float
    precio_sugerido_unitario: float
    precio_sugerido_item: float
    notas: Optional[str] = None

    class Config:
        from_attributes = True

class PresentacionPackagingInput(BaseModel):
    insumo_id: int
    cantidad: float = Field(default=1.0, gt=0, example=1.0)
    notas: Optional[str] = None

class PresentacionPackagingOut(BaseModel):
    id: int
    insumo_id: int
    insumo_nombre: str
    cantidad: float
    costo_unitario: float
    costo_total_item: float
    notas: Optional[str] = None

    class Config:
        from_attributes = True

class PresentacionBase(BaseModel):
    nombre: str = Field(..., example="Bandeja Degustación Merienda")
    descripcion: Optional[str] = None
    categoria: str = Field(default="Packs & Bandejas", example="Packs & Bandejas")
    packaging_id: Optional[int] = None
    cantidad_packaging: float = Field(default=1.0, ge=0)
    margen_adicional: float = Field(default=0.0, ge=0)
    precio_venta_fijado: Optional[float] = None
    redondeo_multiplo: int = Field(default=1000, example=1000) # 1000 (al millar: ej. $23.654 -> $24.000 / 24 mil), 500, 5000, 100
    activo: Optional[int] = 1

class PresentacionCreate(PresentacionBase):
    items: List[PresentacionItemInput] = []
    packagings: List[PresentacionPackagingInput] = []

class PresentacionUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    packaging_id: Optional[int] = None
    cantidad_packaging: Optional[float] = None
    margen_adicional: Optional[float] = None
    precio_venta_fijado: Optional[float] = None
    redondeo_multiplo: Optional[int] = None
    activo: Optional[int] = None
    items: Optional[List[PresentacionItemInput]] = None
    packagings: Optional[List[PresentacionPackagingInput]] = None

class PresentacionOut(PresentacionBase):
    id: int
    packaging_nombre: Optional[str] = None
    costo_packaging_unitario: float = 0.0
    costo_packaging_total: float = 0.0
    costo_puro_productos_total: float = 0.0
    costo_mano_obra_total: float = 0.0
    costo_productos_total: float = 0.0
    costo_total_presentacion: float = 0.0
    precio_base_calculado: float = 0.0
    precio_venta_redondeado: float = 0.0
    precio_venta_final: float = 0.0
    precio_venta_miles: float = 0.0 # ej. 24.0 para $24.000, 30.0 para $30.000
    ganancia_neta: float = 0.0
    margen_porcentaje: float = 0.0
    items: List[PresentacionItemOut] = []
    packagings: List[PresentacionPackagingOut] = []
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None

    class Config:
        from_attributes = True
