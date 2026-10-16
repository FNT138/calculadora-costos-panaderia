"""
Script de precarga de datos iniciales para panadería casera.
"""
from datetime import datetime
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import Insumo, Receta, RecetaIngrediente, SesionProduccion, SesionProduccionItem, Configuracion
from .calculos import calcular_desglose_receta

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Configuraciones por defecto
        configs = [
            ("costo_hora_defecto", "20000.0", "Valor hora de trabajo deseado en ARS"),
            ("margen_defecto", "60.0", "Margen de ganancia objetivo por defecto (%)"),
            ("porcentaje_servicios_defecto", "10.0", "Porcentaje para gas, luz y desgaste (%)"),
        ]
        for k, v, d in configs:
            if not db.query(Configuracion).filter(Configuracion.clave == k).first():
                db.add(Configuracion(clave=k, valor=v, descripcion=d))
        db.commit()

        # Si ya hay insumos, no resembrar
        if db.query(Insumo).count() > 0:
            print("Base de datos ya cuenta con datos.")
            return

        print("Precargando catálogo de insumos y packaging...")

        # 2. Insumos - Materia Prima
        insumos_data = [
            # Ingredientes
            {"nombre": "Harina 0000", "categoria": "ingrediente", "unidad_compra": "kg", "cantidad_compra": 1.0, "precio_compra": 1800.0, "merma_porcentaje": 1.0},
            {"nombre": "Harina 000", "categoria": "ingrediente", "unidad_compra": "kg", "cantidad_compra": 1.0, "precio_compra": 1500.0, "merma_porcentaje": 1.0},
            {"nombre": "Azúcar Común", "categoria": "ingrediente", "unidad_compra": "kg", "cantidad_compra": 1.0, "precio_compra": 1200.0, "merma_porcentaje": 0.0},
            {"nombre": "Manteca", "categoria": "ingrediente", "unidad_compra": "g", "cantidad_compra": 500.0, "precio_compra": 4500.0, "merma_porcentaje": 0.0},
            {"nombre": "Dulce de Leche Repostero", "categoria": "ingrediente", "unidad_compra": "kg", "cantidad_compra": 5.0, "precio_compra": 19500.0, "merma_porcentaje": 2.0},
            {"nombre": "Huevos (Maple 30u)", "categoria": "ingrediente", "unidad_compra": "pack", "cantidad_compra": 30.0, "precio_compra": 6000.0, "merma_porcentaje": 0.0},
            {"nombre": "Levadura Fresca", "categoria": "ingrediente", "unidad_compra": "g", "cantidad_compra": 500.0, "precio_compra": 2500.0, "merma_porcentaje": 3.0},
            {"nombre": "Leche Entera", "categoria": "ingrediente", "unidad_compra": "litro", "cantidad_compra": 1.0, "precio_compra": 1400.0, "merma_porcentaje": 0.0},
            {"nombre": "Almidón de Maíz (Maicena)", "categoria": "ingrediente", "unidad_compra": "kg", "cantidad_compra": 1.0, "precio_compra": 2800.0, "merma_porcentaje": 1.0},
            {"nombre": "Coco Rallado", "categoria": "ingrediente", "unidad_compra": "g", "cantidad_compra": 500.0, "precio_compra": 4000.0, "merma_porcentaje": 2.0},
            {"nombre": "Esencia de Vainilla", "categoria": "ingrediente", "unidad_compra": "ml", "cantidad_compra": 100.0, "precio_compra": 1500.0, "merma_porcentaje": 0.0},
            {"nombre": "Sal Fina", "categoria": "ingrediente", "unidad_compra": "g", "cantidad_compra": 500.0, "precio_compra": 600.0, "merma_porcentaje": 0.0},
            {"nombre": "Azúcar Impalpable", "categoria": "ingrediente", "unidad_compra": "kg", "cantidad_compra": 1.0, "precio_compra": 2200.0, "merma_porcentaje": 1.0},
            {"nombre": "Chocolate Cobertura Semiamargo", "categoria": "ingrediente", "unidad_compra": "kg", "cantidad_compra": 1.0, "precio_compra": 9500.0, "merma_porcentaje": 2.0},
            
            # Packaging
            {"nombre": "Bolsitas Polipropileno Cristal (15x25)", "categoria": "packaging", "unidad_compra": "pack", "cantidad_compra": 100.0, "precio_compra": 2800.0, "merma_porcentaje": 0.0},
            {"nombre": "Bandejitas de Cartón Pasteleras N°3", "categoria": "packaging", "unidad_compra": "pack", "cantidad_compra": 50.0, "precio_compra": 6500.0, "merma_porcentaje": 0.0},
            {"nombre": "Cajas para Docena de Facturas", "categoria": "packaging", "unidad_compra": "pack", "cantidad_compra": 25.0, "precio_compra": 11250.0, "merma_porcentaje": 0.0},
            {"nombre": "Stickers / Etiquetas con Logo", "categoria": "packaging", "unidad_compra": "pack", "cantidad_compra": 100.0, "precio_compra": 3500.0, "merma_porcentaje": 0.0},
            {"nombre": "Papel Manteca Separador", "categoria": "packaging", "unidad_compra": "pack", "cantidad_compra": 100.0, "precio_compra": 2000.0, "merma_porcentaje": 0.0},
        ]

        insumo_map = {}
        for d in insumos_data:
            ins = Insumo(**d)
            ins.calcular_costo_base()
            db.add(ins)
            db.flush()
            insumo_map[ins.nombre] = ins

        db.commit()

        print("Precargando recetas de ejemplo...")
        # Receta 1: Cañoncitos de Dulce de Leche
        receta_canon = Receta(
            nombre="Cañoncitos de Dulce de Leche",
            categoria="Facturas / Masas",
            descripcion="Masa hojaldrada crujiente rellena con abundante dulce de leche repostero.",
            rendimiento_unidades=24.0, # 24 cañoncitos
            tiempo_preparacion_minutos=60.0, # 1 hora de trabajo para la tanda
            porcentaje_costos_indirectos=10.0,
            margen_ganancia_sugerido=65.0,
            precio_venta_fijado=1400.0 # Precio de venta sugerido al público
        )
        db.add(receta_canon)
        db.flush()

        # Ingredientes tanda 24 cañoncitos
        items_canon = [
            (insumo_map["Harina 0000"].id, 450.0, "Masa"),
            (insumo_map["Manteca"].id, 220.0, "Empaste hojaldre"),
            (insumo_map["Sal Fina"].id, 5.0, "Pizca de sal"),
            (insumo_map["Dulce de Leche Repostero"].id, 750.0, "~31g de relleno por cañoncito"),
            (insumo_map["Azúcar Impalpable"].id, 50.0, "Espolvoreado final"),
            (insumo_map["Bolsitas Polipropileno Cristal (15x25)"].id, 24.0, "1 bolsita por unidad"),
            (insumo_map["Stickers / Etiquetas con Logo"].id, 24.0, "1 etiqueta por unidad"),
        ]
        for ins_id, cant, notas in items_canon:
            db.add(RecetaIngrediente(receta_id=receta_canon.id, insumo_id=ins_id, cantidad=cant, notas=notas))

        # Receta 2: Alfajores de Maicena
        receta_alfa = Receta(
            nombre="Alfajorcitos de Maicena Artesanales",
            categoria="Pastelería",
            descripcion="Típicos alfajores de masa suave y quebradiza con dulce de leche y coco.",
            rendimiento_unidades=20.0,
            tiempo_preparacion_minutos=50.0,
            porcentaje_costos_indirectos=10.0,
            margen_ganancia_sugerido=60.0,
            precio_venta_fijado=1600.0
        )
        db.add(receta_alfa)
        db.flush()

        items_alfa = [
            (insumo_map["Almidón de Maíz (Maicena)"].id, 300.0, "Tapas"),
            (insumo_map["Harina 0000"].id, 200.0, "Tapas"),
            (insumo_map["Manteca"].id, 200.0, "Tapas"),
            (insumo_map["Azúcar Común"].id, 150.0, "Tapas"),
            (insumo_map["Huevos (Maple 30u)"].id, 3.0, "Yemas y huevos"),
            (insumo_map["Esencia de Vainilla"].id, 10.0, "Saborizante"),
            (insumo_map["Dulce de Leche Repostero"].id, 500.0, "Relleno copioso"),
            (insumo_map["Coco Rallado"].id, 80.0, "Rebozado bordes"),
            (insumo_map["Bolsitas Polipropileno Cristal (15x25)"].id, 20.0, "Envasado individual"),
            (insumo_map["Stickers / Etiquetas con Logo"].id, 20.0, "Cierre de bolsita"),
        ]
        for ins_id, cant, notas in items_alfa:
            db.add(RecetaIngrediente(receta_id=receta_alfa.id, insumo_id=ins_id, cantidad=cant, notas=notas))

        db.commit()

        # 3. Sesión de producción histórica de ejemplo
        print("Registrando sesión de producción de ejemplo...")
        sesion_ejemplo = SesionProduccion(
            titulo="Producción de fin de semana para ferias",
            fecha=datetime.utcnow(),
            horas_trabajadas=3.0,
            costo_hora_mano_obra=20000.0,
            costo_total_mano_obra=60000.0,
            notas="Hornada completa de cañoncitos y alfajorcitos. Excelente rendimiento."
        )
        db.add(sesion_ejemplo)
        db.flush()

        # Prorrateo: 48 cañoncitos (2 tandas) y 40 alfajores (2 tandas)
        # Total 88 unidades en 3 horas ($60.000 / 88 = $681.82 de MO c/u)
        desg_canon = calcular_desglose_receta(receta_canon, valor_hora=20000.0)
        desg_alfa = calcular_desglose_receta(receta_alfa, valor_hora=20000.0)

        mo_u = round(60000.0 / 88.0, 2)
        
        ind_c = round((desg_canon.costo_materia_prima_unitario + mo_u) * 0.10, 2)
        tot_c = round(desg_canon.costo_materia_prima_unitario + mo_u + ind_c, 2)

        ind_a = round((desg_alfa.costo_materia_prima_unitario + mo_u) * 0.10, 2)
        tot_a = round(desg_alfa.costo_materia_prima_unitario + mo_u + ind_a, 2)

        db.add(SesionProduccionItem(
            sesion_id=sesion_ejemplo.id,
            receta_id=receta_canon.id,
            unidades_producidas=48.0,
            factor_dificultad=1.0,
            costo_mano_obra_unitario=mo_u,
            costo_ingredientes_unitario=desg_canon.costo_ingredientes_unitario,
            costo_packaging_unitario=desg_canon.costo_packaging_unitario,
            costo_indirectos_unitario=ind_c,
            costo_total_unitario=tot_c
        ))

        db.add(SesionProduccionItem(
            sesion_id=sesion_ejemplo.id,
            receta_id=receta_alfa.id,
            unidades_producidas=40.0,
            factor_dificultad=1.0,
            costo_mano_obra_unitario=mo_u,
            costo_ingredientes_unitario=desg_alfa.costo_ingredientes_unitario,
            costo_packaging_unitario=desg_alfa.costo_packaging_unitario,
            costo_indirectos_unitario=ind_a,
            costo_total_unitario=tot_a
        ))

        db.commit()
        print("Precarga completada con éxito.")

    except Exception as e:
        db.rollback()
        print(f"Error en la precarga: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
