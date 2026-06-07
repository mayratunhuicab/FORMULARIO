import uuid
import bcrypt
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, SessionLocal
from .models import Usuario
from .routers import registros, prestamos, auth

Base.metadata.create_all(bind=engine)

# Crea el usuario admin por defecto si no existe
def _seed_admin():
    db = SessionLocal()
    try:
        if not db.query(Usuario).filter(Usuario.username == "admin").first():
            db.add(Usuario(
                id=str(uuid.uuid4()),
                username="admin",
                password_hash=bcrypt.hashpw(b"biblioteca2024", bcrypt.gensalt()).decode(),
            ))
            db.commit()
    finally:
        db.close()

_seed_admin()

app = FastAPI(
    title="Biblioteca API",
    description="Backend para el sistema de control de acceso y préstamos de la biblioteca",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(registros.router)
app.include_router(prestamos.router)


@app.get("/")
def root():
    return {"status": "ok", "mensaje": "Biblioteca API funcionando"}
