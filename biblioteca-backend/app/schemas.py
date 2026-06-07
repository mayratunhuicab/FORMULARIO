from pydantic import BaseModel
from typing import Optional, Literal


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    ok: bool
    mensaje: str


class CambiarPasswordRequest(BaseModel):
    username: str
    password_actual: str
    nueva_password: str


class RegistroCreate(BaseModel):
    id: str
    nombre: str
    apellidoPaterno: str
    apellidoMaterno: str = ""
    tipoCredencial: Literal["estudiante", "elector"]
    fotoCredencial: str
    fechaHora: str  # ISO 8601


class RegistroOut(BaseModel):
    id: str
    nombre: str
    apellidoPaterno: str
    apellidoMaterno: str
    tipoCredencial: str
    fotoCredencial: str
    fechaHora: str

    model_config = {"from_attributes": True}


class PrestamoCreate(BaseModel):
    id: str
    visitanteId: str
    nombreCompleto: str
    tipoCredencial: Literal["estudiante", "elector"]
    fotoCredencial: str
    libro: str
    fechaPrestamo: str
    fechaDevolucionEsperada: str
    estado: str = "activo"


class PrestamoOut(BaseModel):
    id: str
    visitanteId: str
    nombreCompleto: str
    tipoCredencial: str
    fotoCredencial: str
    libro: str
    fechaPrestamo: str
    fechaDevolucionEsperada: str
    fechaDevolucionReal: Optional[str] = None
    estado: str

    model_config = {"from_attributes": True}
