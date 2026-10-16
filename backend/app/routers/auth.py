import os
import time
import hmac
import hashlib
import secrets
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Configuracion

router = APIRouter(prefix="/api/auth", tags=["Autenticación y PIN de Seguridad"])

# Clave secreta para firma HMAC de tokens de sesión
SECRET_KEY = os.getenv("SECRET_KEY", "panaderia-artesanal-secret-key-2026-neon").encode("utf-8")
DEFAULT_PIN = "1234"
TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30  # 30 días de sesión

class LoginRequest(BaseModel):
    pin: str

class ChangePinRequest(BaseModel):
    current_pin: str
    new_pin: str

def get_current_pin(db: Session) -> str:
    cfg = db.query(Configuracion).filter(Configuracion.clave == "admin_pin").first()
    if cfg and cfg.valor:
        return cfg.valor.strip()
    return DEFAULT_PIN

def generate_admin_token(pin: str) -> str:
    """Genera un token firmado con HMAC-SHA256 vinculado al PIN actual y timestamp."""
    timestamp = str(int(time.time()))
    nonce = secrets.token_hex(8)
    message = f"{timestamp}:{nonce}:{pin}".encode("utf-8")
    sig = hmac.new(SECRET_KEY, message, hashlib.sha256).hexdigest()
    return f"{timestamp}.{nonce}.{sig}"

def is_valid_admin_token(token: str, pin: str) -> bool:
    """Verifica si el token es válido, no expiró y fue firmado para el PIN vigente."""
    if not token or "." not in token:
        return False
    parts = token.split(".")
    if len(parts) != 3:
        return False
    timestamp_str, nonce, sig = parts
    try:
        ts = int(timestamp_str)
        # Verificar expiración
        if time.time() - ts > TOKEN_MAX_AGE_SECONDS:
            return False
    except ValueError:
        return False

    message = f"{timestamp_str}:{nonce}:{pin}".encode("utf-8")
    expected_sig = hmac.new(SECRET_KEY, message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig, expected_sig)

def require_admin(
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Dependencia de FastAPI para proteger rutas mutables (POST/PUT/DELETE)."""
    token = x_admin_token
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization.split("Bearer ", 1)[1].strip()
        else:
            token = authorization.strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Se requiere PIN de administrador para realizar cambios en el sistema."
        )

    current_pin = get_current_pin(db)
    if not is_valid_admin_token(token, current_pin):
        raise HTTPException(
            status_code=401,
            detail="Sesión de administrador inválida o expirada. Ingrese su PIN nuevamente."
        )

@router.post("/login")
def login_with_pin(data: LoginRequest, db: Session = Depends(get_db)):
    pin_ingresado = data.pin.strip()
    current_pin = get_current_pin(db)
    if not hmac.compare_digest(pin_ingresado, current_pin):
        raise HTTPException(status_code=401, detail="PIN incorrecto. Intente nuevamente.")
    token = generate_admin_token(current_pin)
    return {"status": "ok", "token": token, "message": "Acceso concedido"}

@router.get("/verify")
def verify_session(
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    token = x_admin_token
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization.split("Bearer ", 1)[1].strip()
        else:
            token = authorization.strip()

    if not token:
        return {"authenticated": False}

    current_pin = get_current_pin(db)
    is_valid = is_valid_admin_token(token, current_pin)
    return {"authenticated": is_valid}

@router.post("/change-pin")
def change_admin_pin(data: ChangePinRequest, db: Session = Depends(get_db)):
    current_pin = get_current_pin(db)
    if not hmac.compare_digest(data.current_pin.strip(), current_pin):
        raise HTTPException(status_code=401, detail="El PIN actual no es correcto.")

    nuevo_pin = data.new_pin.strip()
    if len(nuevo_pin) < 4:
        raise HTTPException(status_code=400, detail="El nuevo PIN debe tener al menos 4 dígitos o caracteres.")

    cfg = db.query(Configuracion).filter(Configuracion.clave == "admin_pin").first()
    if not cfg:
        cfg = Configuracion(
            clave="admin_pin",
            valor=nuevo_pin,
            descripcion="PIN de seguridad para habilitar edición de recetas e insumos"
        )
        db.add(cfg)
    else:
        cfg.valor = nuevo_pin
    db.commit()

    nuevo_token = generate_admin_token(nuevo_pin)
    return {"status": "ok", "token": nuevo_token, "message": "PIN actualizado exitosamente"}
