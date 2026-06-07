from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/prestamos", tags=["prestamos"])


def _parse_iso(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def _to_schema(p: models.Prestamo) -> schemas.PrestamoOut:
    return schemas.PrestamoOut(
        id=p.id,
        visitanteId=p.visitante_id,
        nombreCompleto=p.nombre_completo,
        tipoCredencial=p.tipo_credencial,
        fotoCredencial=p.foto_credencial,
        libro=p.libro,
        fechaPrestamo=p.fecha_prestamo.isoformat(),
        fechaDevolucionEsperada=p.fecha_devolucion_esperada.isoformat(),
        fechaDevolucionReal=p.fecha_devolucion_real.isoformat() if p.fecha_devolucion_real else None,
        estado=p.estado,
    )


@router.get("/", response_model=List[schemas.PrestamoOut])
def listar_prestamos(db: Session = Depends(get_db)):
    prestamos = (
        db.query(models.Prestamo)
        .order_by(models.Prestamo.fecha_prestamo.desc())
        .all()
    )
    return [_to_schema(p) for p in prestamos]


@router.post("/", response_model=schemas.PrestamoOut, status_code=201)
def crear_prestamo(data: schemas.PrestamoCreate, db: Session = Depends(get_db)):
    prestamo = models.Prestamo(
        id=data.id,
        visitante_id=data.visitanteId,
        nombre_completo=data.nombreCompleto,
        tipo_credencial=data.tipoCredencial,
        foto_credencial=data.fotoCredencial,
        libro=data.libro,
        fecha_prestamo=_parse_iso(data.fechaPrestamo),
        fecha_devolucion_esperada=_parse_iso(data.fechaDevolucionEsperada),
        estado=data.estado,
    )
    db.add(prestamo)
    db.commit()
    db.refresh(prestamo)
    return _to_schema(prestamo)


@router.patch("/{prestamo_id}/devolver", response_model=schemas.PrestamoOut)
def devolver_prestamo(prestamo_id: str, db: Session = Depends(get_db)):
    prestamo = db.query(models.Prestamo).filter(models.Prestamo.id == prestamo_id).first()
    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    prestamo.estado = "devuelto"
    prestamo.fecha_devolucion_real = datetime.now(timezone.utc)
    db.commit()
    db.refresh(prestamo)
    return _to_schema(prestamo)


@router.delete("/{prestamo_id}")
def eliminar_prestamo(prestamo_id: str, db: Session = Depends(get_db)):
    prestamo = db.query(models.Prestamo).filter(models.Prestamo.id == prestamo_id).first()
    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    db.delete(prestamo)
    db.commit()
    return {"ok": True}
