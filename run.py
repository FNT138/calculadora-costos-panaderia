"""
Lanzador principal del Sistema de Panadería Costos.
Permite iniciar la aplicación para acceder localmente o en la nube (Render, Railway, etc.).
"""
import os
import sys
import socket
from pathlib import Path
import uvicorn

# Agregar el directorio raíz al path
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR / "backend"))

def get_local_ip():
    """Obtiene la IP local de la computadora en la red Wi-Fi/Ethernet."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

def main():
    local_ip = get_local_ip()
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    print("=" * 65)
    print("      PANADERIA COSTOS - SISTEMA DE COSTEO Y PRECIOS        ")
    print("=" * 65)
    print(f" Servidor iniciado con exito!")
    print(f" Puerto de escucha:              {port}")
    print(f" Acceso en esta PC:              http://localhost:{port}")
    print(f" Acceso desde Celular (Wi-Fi):   http://{local_ip}:{port}")
    print("=" * 65)
    print(" Presiona Ctrl + C en esta ventana para detener el servidor.")
    print("=" * 65)

    uvicorn.run("app.main:app", host=host, port=port, reload=False)

if __name__ == "__main__":
    main()
