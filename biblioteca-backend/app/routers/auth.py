import bcrypt
import jwt
import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Usuario
from ..schemas import LoginRequest, LoginResponse, CambiarPasswordRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])

_SECRET = os.getenv("SECRET_KEY", "dev-only-change-in-production")
_ALGORITHM = "HS256"


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _create_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=8)
    return jwt.encode({"sub": username, "exp": expire}, _SECRET, algorithm=_ALGORITHM)


@router.post("/login", response_model=LoginResponse)
def login(datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.username == datos.username).first()
    if not usuario or not _verify(datos.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    return LoginResponse(ok=True, mensaje="Login exitoso", token=_create_token(datos.username))


@router.post("/cambiar-password")
def cambiar_password(datos: CambiarPasswordRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.username == datos.username).first()
    if not usuario or not _verify(datos.password_actual, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")
    usuario.password_hash = _hash(datos.nueva_password)
    db.commit()
    return {"ok": True, "mensaje": "Contraseña actualizada"}
