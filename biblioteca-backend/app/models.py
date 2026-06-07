from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime, timezone
from .database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)


class Registro(Base):
    __tablename__ = "registros"

    id = Column(String, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    apellido_paterno = Column(String, nullable=False)
    apellido_materno = Column(String, nullable=True)
    tipo_credencial = Column(String, nullable=False)   # 'estudiante' | 'elector'
    foto_credencial = Column(Text, nullable=False)     # base64 data URL
    fecha_hora = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))


class Prestamo(Base):
    __tablename__ = "prestamos"

    id = Column(String, primary_key=True, index=True)
    visitante_id = Column(String, nullable=False)
    nombre_completo = Column(String, nullable=False)
    tipo_credencial = Column(String, nullable=False)
    foto_credencial = Column(Text, nullable=False)
    libro = Column(String, nullable=False)
    fecha_prestamo = Column(DateTime(timezone=True), nullable=False)
    fecha_devolucion_esperada = Column(DateTime(timezone=True), nullable=False)
    fecha_devolucion_real = Column(DateTime(timezone=True), nullable=True)
    estado = Column(String, nullable=False, default="activo")  # 'activo' | 'devuelto'
