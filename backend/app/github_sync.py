"""
Módulo de sincronización y respaldo de base de datos.
Permite:
1. Exportar e importar datos en JSON (descarga directa).
2. Sincronización automática con GitHub si se configuran GITHUB_TOKEN y GITHUB_REPO.
"""
import os
import json
import base64
import threading
import urllib.request
import urllib.error
from datetime import datetime
from sqlalchemy.orm import Session
from .models import Insumo, Receta, RecetaIngrediente, SesionProduccion, SesionProduccionItem, Configuracion, PresentacionVenta, PresentacionVentaItem, PresentacionVentaPackaging

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO = os.getenv("GITHUB_REPO") # Ej: "FNT138/calculadora-costos-panaderia"
BACKUP_FILE_PATH = "data/db_backup.json"

def export_db_to_dict(db: Session) -> dict:
    """Exporta todos los datos de la base a un diccionario serializable."""
    insumos = db.query(Insumo).all()
    recetas = db.query(Receta).all()
    sesiones = db.query(SesionProduccion).all()
    configs = db.query(Configuracion).all()
    presentaciones = db.query(PresentacionVenta).all()

    data = {
        "timestamp": datetime.utcnow().isoformat(),
        "configuraciones": [{"clave": c.clave, "valor": c.valor, "descripcion": c.descripcion} for c in configs],
        "insumos": [
            {
                "id": i.id,
                "nombre": i.nombre,
                "categoria": i.categoria,
                "unidad_compra": i.unidad_compra,
                "cantidad_compra": i.cantidad_compra,
                "precio_compra": i.precio_compra,
                "merma_porcentaje": i.merma_porcentaje,
                "unidad_base": i.unidad_base,
                "costo_por_unidad_base": i.costo_por_unidad_base,
                "notas": i.notas
            }
            for i in insumos
        ],
        "recetas": [
            {
                "id": r.id,
                "nombre": r.nombre,
                "categoria": r.categoria,
                "descripcion": r.descripcion,
                "rendimiento_unidades": r.rendimiento_unidades,
                "tiempo_preparacion_minutos": r.tiempo_preparacion_minutos,
                "porcentaje_costos_indirectos": r.porcentaje_costos_indirectos,
                "margen_ganancia_sugerido": r.margen_ganancia_sugerido,
                "precio_venta_fijado": r.precio_venta_fijado,
                "ingredientes": [
                    {
                        "insumo_id": ri.insumo_id,
                        "cantidad": ri.cantidad,
                        "notas": ri.notas
                    }
                    for ri in r.ingredientes
                ]
            }
            for r in recetas
        ],
        "sesiones": [
            {
                "id": s.id,
                "fecha": s.fecha.isoformat() if s.fecha else None,
                "titulo": s.titulo,
                "horas_trabajadas": s.horas_trabajadas,
                "costo_hora_mano_obra": s.costo_hora_mano_obra,
                "costo_total_mano_obra": s.costo_total_mano_obra,
                "notas": s.notas,
                "items": [
                    {
                        "receta_id": si.receta_id,
                        "unidades_producidas": si.unidades_producidas,
                        "factor_dificultad": si.factor_dificultad,
                        "costo_mano_obra_unitario": si.costo_mano_obra_unitario,
                        "costo_ingredientes_unitario": si.costo_ingredientes_unitario,
                        "costo_packaging_unitario": si.costo_packaging_unitario,
                        "costo_indirectos_unitario": si.costo_indirectos_unitario,
                        "costo_total_unitario": si.costo_total_unitario
                    }
                    for si in s.items
                ]
            }
            for s in sesiones
        ],
        "presentaciones": [
            {
                "id": p.id,
                "nombre": p.nombre,
                "descripcion": p.descripcion,
                "categoria": p.categoria,
                "packaging_id": p.packaging_id,
                "cantidad_packaging": p.cantidad_packaging,
                "margen_adicional": p.margen_adicional,
                "precio_venta_fijado": p.precio_venta_fijado,
                "redondeo_multiplo": p.redondeo_multiplo,
                "activo": p.activo,
                "items": [
                    {
                        "receta_id": pi.receta_id,
                        "cantidad": pi.cantidad,
                        "notas": pi.notas
                    }
                    for pi in p.items
                ],
                "packagings": [
                    {
                        "insumo_id": pki.insumo_id,
                        "cantidad": pki.cantidad,
                        "notas": pki.notas
                    }
                    for pki in (p.packagings if hasattr(p, "packagings") and p.packagings else [])
                ]
            }
            for p in presentaciones
        ]
    }
    return data

def import_dict_to_db(db: Session, data: dict):
    """Restaura los datos en la base de datos a partir de un diccionario."""
    try:
        # 1. Configuraciones
        if "configuraciones" in data:
            for c in data["configuraciones"]:
                existente = db.query(Configuracion).filter(Configuracion.clave == c["clave"]).first()
                if existente:
                    existente.valor = str(c["valor"])
                    existente.descripcion = c.get("descripcion")
                else:
                    db.add(Configuracion(clave=c["clave"], valor=str(c["valor"]), descripcion=c.get("descripcion")))

        # 2. Insumos
        if "insumos" in data:
            for item in data["insumos"]:
                ins = db.query(Insumo).filter(Insumo.id == item["id"]).first()
                if not ins:
                    ins = Insumo(
                        id=item["id"],
                        nombre=item["nombre"],
                        categoria=item["categoria"],
                        unidad_compra=item["unidad_compra"],
                        cantidad_compra=item["cantidad_compra"],
                        precio_compra=item["precio_compra"],
                        merma_porcentaje=item.get("merma_porcentaje", 0),
                        unidad_base=item["unidad_base"],
                        costo_por_unidad_base=item["costo_por_unidad_base"],
                        notas=item.get("notas")
                    )
                    db.add(ins)
                else:
                    ins.nombre = item["nombre"]
                    ins.categoria = item["categoria"]
                    ins.unidad_compra = item["unidad_compra"]
                    ins.cantidad_compra = item["cantidad_compra"]
                    ins.precio_compra = item["precio_compra"]
                    ins.merma_porcentaje = item.get("merma_porcentaje", 0)
                    ins.unidad_base = item["unidad_base"]
                    ins.costo_por_unidad_base = item["costo_por_unidad_base"]
                    ins.notas = item.get("notas")

        # 3. Recetas
        if "recetas" in data:
            for r_data in data["recetas"]:
                rec = db.query(Receta).filter(Receta.id == r_data["id"]).first()
                if not rec:
                    rec = Receta(
                        id=r_data["id"],
                        nombre=r_data["nombre"],
                        categoria=r_data.get("categoria", "General"),
                        descripcion=r_data.get("descripcion"),
                        rendimiento_unidades=r_data["rendimiento_unidades"],
                        tiempo_preparacion_minutos=r_data["tiempo_preparacion_minutos"],
                        porcentaje_costos_indirectos=r_data["porcentaje_costos_indirectos"],
                        margen_ganancia_sugerido=r_data["margen_ganancia_sugerido"],
                        precio_venta_fijado=r_data.get("precio_venta_fijado")
                    )
                    db.add(rec)
                    db.flush()
                else:
                    rec.nombre = r_data["nombre"]
                    rec.categoria = r_data.get("categoria", "General")
                    rec.descripcion = r_data.get("descripcion")
                    rec.rendimiento_unidades = r_data["rendimiento_unidades"]
                    rec.tiempo_preparacion_minutos = r_data["tiempo_preparacion_minutos"]
                    rec.porcentaje_costos_indirectos = r_data["porcentaje_costos_indirectos"]
                    rec.margen_ganancia_sugerido = r_data["margen_ganancia_sugerido"]
                    rec.precio_venta_fijado = r_data.get("precio_venta_fijado")

                # Actualizar ingredientes
                db.query(RecetaIngrediente).filter(RecetaIngrediente.receta_id == rec.id).delete()
                for ing in r_data.get("ingredientes", []):
                    db.add(RecetaIngrediente(
                        receta_id=rec.id,
                        insumo_id=ing["insumo_id"],
                        cantidad=ing["cantidad"],
                        notas=ing.get("notas")
                    ))

        # 4. Sesiones de Producción
        if "sesiones" in data:
            for s_data in data["sesiones"]:
                ses = db.query(SesionProduccion).filter(SesionProduccion.id == s_data["id"]).first()
                fecha_val = datetime.fromisoformat(s_data["fecha"]) if s_data.get("fecha") else datetime.utcnow()
                if not ses:
                    ses = SesionProduccion(
                        id=s_data["id"],
                        fecha=fecha_val,
                        titulo=s_data["titulo"],
                        horas_trabajadas=s_data["horas_trabajadas"],
                        costo_hora_mano_obra=s_data["costo_hora_mano_obra"],
                        costo_total_mano_obra=s_data["costo_total_mano_obra"],
                        notas=s_data.get("notas")
                    )
                    db.add(ses)
                    db.flush()
                else:
                    ses.fecha = fecha_val
                    ses.titulo = s_data["titulo"]
                    ses.horas_trabajadas = s_data["horas_trabajadas"]
                    ses.costo_hora_mano_obra = s_data["costo_hora_mano_obra"]
                    ses.costo_total_mano_obra = s_data["costo_total_mano_obra"]
                    ses.notas = s_data.get("notas")

                # Items de sesión
                db.query(SesionProduccionItem).filter(SesionProduccionItem.sesion_id == ses.id).delete()
                for sit in s_data.get("items", []):
                    db.add(SesionProduccionItem(
                        sesion_id=ses.id,
                        receta_id=sit.get("receta_id"),
                        unidades_producidas=sit["unidades_producidas"],
                        factor_dificultad=sit.get("factor_dificultad", 1.0),
                        costo_mano_obra_unitario=sit.get("costo_mano_obra_unitario", 0),
                        costo_ingredientes_unitario=sit.get("costo_ingredientes_unitario", 0),
                        costo_packaging_unitario=sit.get("costo_packaging_unitario", 0),
                        costo_indirectos_unitario=sit.get("costo_indirectos_unitario", 0),
                        costo_total_unitario=sit.get("costo_total_unitario", 0)
                    ))

        # 5. Presentaciones de Venta & Packs
        if "presentaciones" in data:
            for p_data in data["presentaciones"]:
                pres = db.query(PresentacionVenta).filter(PresentacionVenta.id == p_data["id"]).first()
                if not pres:
                    pres = PresentacionVenta(
                        id=p_data["id"],
                        nombre=p_data["nombre"],
                        descripcion=p_data.get("descripcion"),
                        categoria=p_data.get("categoria", "Packs & Bandejas"),
                        packaging_id=p_data.get("packaging_id"),
                        cantidad_packaging=p_data.get("cantidad_packaging", 1.0),
                        margen_adicional=p_data.get("margen_adicional", 0.0),
                        precio_venta_fijado=p_data.get("precio_venta_fijado"),
                        redondeo_multiplo=p_data.get("redondeo_multiplo", 50),
                        activo=p_data.get("activo", 1)
                    )
                    db.add(pres)
                    db.flush()
                else:
                    pres.nombre = p_data["nombre"]
                    pres.descripcion = p_data.get("descripcion")
                    pres.categoria = p_data.get("categoria", "Packs & Bandejas")
                    pres.packaging_id = p_data.get("packaging_id")
                    pres.cantidad_packaging = p_data.get("cantidad_packaging", 1.0)
                    pres.margen_adicional = p_data.get("margen_adicional", 0.0)
                    pres.precio_venta_fijado = p_data.get("precio_venta_fijado")
                    pres.redondeo_multiplo = p_data.get("redondeo_multiplo", 50)
                    pres.activo = p_data.get("activo", 1)

                db.query(PresentacionVentaItem).filter(PresentacionVentaItem.presentacion_id == pres.id).delete()
                for pi in p_data.get("items", []):
                    db.add(PresentacionVentaItem(
                        presentacion_id=pres.id,
                        receta_id=pi["receta_id"],
                        cantidad=pi["cantidad"],
                        notas=pi.get("notas")
                    ))

                db.query(PresentacionVentaPackaging).filter(PresentacionVentaPackaging.presentacion_id == pres.id).delete()
                for pki in p_data.get("packagings", []):
                    db.add(PresentacionVentaPackaging(
                        presentacion_id=pres.id,
                        insumo_id=pki["insumo_id"],
                        cantidad=pki.get("cantidad", 1.0),
                        notas=pki.get("notas")
                    ))

        db.commit()
        
        # Sincronizar secuencias seriales en PostgreSQL
        if db.bind and db.bind.dialect.name == "postgresql":
            from sqlalchemy import text
            for tbl in ["insumos", "recetas", "receta_ingredientes", "sesiones_produccion", "sesion_produccion_items", "presentaciones_venta", "presentacion_venta_items", "presentacion_venta_packagings"]:
                try:
                    db.execute(text(f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), coalesce(max(id), 0) + 1, false) FROM {tbl};"))
                    db.commit()
                except Exception:
                    db.rollback()

        return True
    except Exception as e:
        db.rollback()
        raise e

def _async_push_worker(data_dict: dict):
    token = os.getenv("GITHUB_TOKEN")
    repo = os.getenv("GITHUB_REPO")
    if not token or not repo:
        return

    try:
        json_content = json.dumps(data_dict, indent=2, ensure_ascii=False)
        content_b64 = base64.b64encode(json_content.encode("utf-8")).decode("utf-8")

        url = f"https://api.github.com/repos/{repo}/contents/{BACKUP_FILE_PATH}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "PanaderiaCostosApp"
        }

        sha = None
        req = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(req) as resp:
                res_data = json.loads(resp.read().decode())
                sha = res_data.get("sha")
        except urllib.error.HTTPError as e:
            if e.code != 404:
                print(f"Aviso SHA: {e}")

        payload = {
            "message": "Auto-backup de recetas e insumos [skip ci]",
            "content": content_b64,
            "branch": "main"
        }
        if sha:
            payload["sha"] = sha

        put_req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={**headers, "Content-Type": "application/json"},
            method="PUT"
        )
        with urllib.request.urlopen(put_req) as resp:
            print("Auto-backup sincronizado en GitHub exitosamente.")
    except Exception as e:
        print(f"Aviso durante auto-sync en GitHub: {e}")

def trigger_auto_sync(db: Session):
    """Ejecuta sincronización con GitHub en un hilo no bloqueante."""
    token = os.getenv("GITHUB_TOKEN")
    repo = os.getenv("GITHUB_REPO")
    if not token or not repo:
        return
    try:
        data = export_db_to_dict(db)
        thread = threading.Thread(target=_async_push_worker, args=(data,), daemon=True)
        thread.start()
    except Exception as e:
        print(f"Aviso al iniciar auto-sync: {e}")

def push_backup_to_github(db: Session) -> dict:
    """Envía el respaldo JSON al repositorio de GitHub de forma síncrona."""
    token = os.getenv("GITHUB_TOKEN")
    repo = os.getenv("GITHUB_REPO")
    if not token or not repo:
        return {"status": "skipped", "message": "GITHUB_TOKEN o GITHUB_REPO no configurados en las variables de entorno"}

    try:
        data = export_db_to_dict(db)
        _async_push_worker(data)
        return {"status": "success", "message": "Respaldo sincronizado en GitHub exitosamente"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def pull_backup_from_github(db: Session) -> dict:
    """Descarga e importa el respaldo JSON desde GitHub al iniciar el servidor."""
    token = os.getenv("GITHUB_TOKEN")
    repo = os.getenv("GITHUB_REPO")
    if not token or not repo:
        return {"status": "skipped", "message": "GITHUB_TOKEN o GITHUB_REPO no configurados"}

    try:
        url = f"https://api.github.com/repos/{repo}/contents/{BACKUP_FILE_PATH}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "PanaderiaCostosApp"
        }

        req = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(req) as resp:
            res_data = json.loads(resp.read().decode())
            content_b64 = res_data.get("content", "")
            json_text = base64.b64decode(content_b64).decode("utf-8")
            data = json.loads(json_text)
            import_dict_to_db(db, data)
            print("Datos restaurados exitosamente desde GitHub!")
            return {"status": "success", "message": "Datos restaurados desde GitHub"}

    except urllib.error.HTTPError as e:
        if e.code == 404:
            print("No existe respaldo previo en GitHub. Continuando normal.")
            return {"status": "not_found", "message": "No hay respaldo previo en GitHub"}
        print(f"Error HTTP al descargar de GitHub: {e}")
        return {"status": "error", "message": str(e)}
    except Exception as e:
        print(f"Error restaurando desde GitHub: {e}")
        return {"status": "error", "message": str(e)}
