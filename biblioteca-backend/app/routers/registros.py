from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/registros", tags=["registros"])


def _parse_iso(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def _to_schema(r: models.Registro) -> schemas.RegistroOut:
    return schemas.RegistroOut(
        id=r.id,
        nombre=r.nombre,
        apellidoPaterno=r.apellido_paterno,
        apellidoMaterno=r.apellido_materno or "",
        tipoCredencial=r.tipo_credencial,
        fotoCredencial=r.foto_credencial,
        fechaHora=r.fecha_hora.isoformat(),
    )


@router.get("/", response_model=List[schemas.RegistroOut])
def listar_registros(db: Session = Depends(get_db)):
    registros = (
        db.query(models.Registro)
        .order_by(models.Registro.fecha_hora.desc())
        .all()
    )
    return [_to_schema(r) for r in registros]


@router.post("/", response_model=schemas.RegistroOut, status_code=201)
def crear_registro(data: schemas.RegistroCreate, db: Session = Depends(get_db)):
    registro = models.Registro(
        id=data.id,
        nombre=data.nombre,
        apellido_paterno=data.apellidoPaterno,
        apellido_materno=data.apellidoMaterno or None,
        tipo_credencial=data.tipoCredencial,
        foto_credencial=data.fotoCredencial,
        fecha_hora=_parse_iso(data.fechaHora),
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return _to_schema(registro)


@router.delete("/limpiar")
def limpiar_registros(db: Session = Depends(get_db)):
    db.query(models.Registro).delete()
    db.commit()
    return {"ok": True}


@router.delete("/{registro_id}")
def eliminar_registro(registro_id: str, db: Session = Depends(get_db)):
    registro = db.query(models.Registro).filter(models.Registro.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    db.delete(registro)
    db.commit()
    return {"ok": True}
