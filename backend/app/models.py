from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class Insumo(Base):
    __tablename__ = "insumos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False, index=True)
    categoria = Column(String(50), nullable=False, default="ingrediente") # "ingrediente" o "packaging"
    unidad_compra = Column(String(30), nullable=False) # "kg", "g", "litro", "ml", "unidad", "pack", "docena"
    cantidad_compra = Column(Float, nullable=False, default=1.0)
    precio_compra = Column(Float, nullable=False) # Precio total pagado por ese paquete/bulto
    merma_porcentaje = Column(Float, nullable=False, default=0.0) # Desperdicio / pérdida en cocción
    unidad_base = Column(String(20), nullable=False, default="g") # "g", "ml", "unidad"
    costo_por_unidad_base = Column(Float, nullable=False, default=0.0)
    notas = Column(Text, nullable=True)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relación con recetas - cascada completa
    receta_items = relationship("RecetaIngrediente", back_populates="insumo", cascade="all, delete-orphan", passive_deletes=True)

    def calcular_costo_base(self):
        """Calcula el costo por unidad base (gramo, ml o unidad) considerando merma."""
        u = self.unidad_compra.lower().strip()
        cant = self.cantidad_compra if self.cantidad_compra > 0 else 1.0

        if u in ["kg", "kilo", "kilos"]:
            cant_base = cant * 1000.0
            base = "g"
        elif u in ["g", "gr", "gramo", "gramos"]:
            cant_base = cant
            base = "g"
        elif u in ["litro", "l", "litros"]:
            cant_base = cant * 1000.0
            base = "ml"
        elif u in ["ml", "cm3", "cc"]:
            cant_base = cant
            base = "ml"
        elif u in ["docena", "docenas"]:
            cant_base = cant * 12.0
            base = "unidad"
        else: # "pack", "unidad", etc.
            cant_base = cant
            base = "unidad"

        self.unidad_base = base
        # Factor de aprovechamiento (1 - merma)
        aprovechamiento = max(0.01, 1.0 - (self.merma_porcentaje / 100.0))
        costo_base = (self.precio_compra / cant_base) / aprovechamiento
        self.costo_por_unidad_base = round(costo_base, 4)
        return self.costo_por_unidad_base


class Receta(Base):
    __tablename__ = "recetas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False, index=True)
    categoria = Column(String(50), nullable=True, default="General") # "Facturas", "Panes", "Tartas", etc.
    descripcion = Column(Text, nullable=True)
    rendimiento_unidades = Column(Float, nullable=False, default=1.0) # Unidades que salen por tanda
    tiempo_preparacion_minutos = Column(Float, nullable=False, default=60.0) # Minutos estimados por tanda
    porcentaje_costos_indirectos = Column(Float, nullable=False, default=10.0) # Gas, luz, desgaste
    margen_ganancia_sugerido = Column(Float, nullable=False, default=60.0) # % margen sobre costo o precio
    precio_venta_fijado = Column(Float, nullable=True) # Precio que el usuario decidió cobrar
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Cascadas para permitir borrado limpio sin errores de clave foránea
    ingredientes = relationship("RecetaIngrediente", back_populates="receta", cascade="all, delete-orphan", passive_deletes=True)
    producciones = relationship("SesionProduccionItem", back_populates="receta", cascade="all, delete-orphan", passive_deletes=True)


class RecetaIngrediente(Base):
    __tablename__ = "receta_ingredientes"

    id = Column(Integer, primary_key=True, index=True)
    receta_id = Column(Integer, ForeignKey("recetas.id", ondelete="CASCADE"), nullable=False)
    insumo_id = Column(Integer, ForeignKey("insumos.id", ondelete="CASCADE"), nullable=False)
    cantidad = Column(Float, nullable=False) # Cantidad expresada en la unidad_base del insumo
    notas = Column(String(150), nullable=True)

    receta = relationship("Receta", back_populates="ingredientes")
    insumo = relationship("Insumo", back_populates="receta_items")


class SesionProduccion(Base):
    __tablename__ = "sesiones_produccion"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=datetime.utcnow, index=True)
    titulo = Column(String(150), nullable=False) # Ej: "Producción fin de semana"
    horas_trabajadas = Column(Float, nullable=False, default=1.0)
    costo_hora_mano_obra = Column(Float, nullable=False, default=20000.0)
    costo_total_mano_obra = Column(Float, nullable=False, default=20000.0)
    notas = Column(Text, nullable=True)

    items = relationship("SesionProduccionItem", back_populates="sesion", cascade="all, delete-orphan", passive_deletes=True)


class SesionProduccionItem(Base):
    __tablename__ = "sesion_produccion_items"

    id = Column(Integer, primary_key=True, index=True)
    sesion_id = Column(Integer, ForeignKey("sesiones_produccion.id", ondelete="CASCADE"), nullable=False)
    # Permite borrar receta sin violar restricción NOT NULL
    receta_id = Column(Integer, ForeignKey("recetas.id", ondelete="CASCADE"), nullable=True)
    unidades_producidas = Column(Float, nullable=False) # Cantidad obtenida en esta sesión
    factor_dificultad = Column(Float, nullable=False, default=1.0) # Ponderador de esfuerzo (1.0 = normal)
    
    # Costos congelados al momento de producir para histórico confiable
    costo_mano_obra_unitario = Column(Float, nullable=False, default=0.0)
    costo_ingredientes_unitario = Column(Float, nullable=False, default=0.0)
    costo_packaging_unitario = Column(Float, nullable=False, default=0.0)
    costo_indirectos_unitario = Column(Float, nullable=False, default=0.0)
    costo_total_unitario = Column(Float, nullable=False, default=0.0)

    sesion = relationship("SesionProduccion", back_populates="items")
    receta = relationship("Receta", back_populates="producciones")


class Configuracion(Base):
    __tablename__ = "configuraciones"

    clave = Column(String(80), primary_key=True)
    valor = Column(String(255), nullable=False)
    descripcion = Column(String(255), nullable=True)
