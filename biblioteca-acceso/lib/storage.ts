import { Registro } from '@/types/registro';
import { Prestamo } from '@/types/prestamo';

// ── Registros ────────────────────────────────────────────────────────────────

const REGISTROS_KEY = 'biblioteca_registros';

export function obtenerRegistros(): Registro[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(REGISTROS_KEY);
    return data ? (JSON.parse(data) as Registro[]) : [];
  } catch {
    return [];
  }
}

export function guardarRegistro(registro: Registro): void {
  const registros = obtenerRegistros();
  registros.unshift(registro);
  localStorage.setItem(REGISTROS_KEY, JSON.stringify(registros));
}

export function eliminarRegistro(id: string): void {
  const registros = obtenerRegistros().filter((r) => r.id !== id);
  localStorage.setItem(REGISTROS_KEY, JSON.stringify(registros));
}

export function limpiarRegistros(): void {
  localStorage.removeItem(REGISTROS_KEY);
}

// ── Préstamos ─────────────────────────────────────────────────────────────────

const PRESTAMOS_KEY = 'biblioteca_prestamos';

export function obtenerPrestamos(): Prestamo[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(PRESTAMOS_KEY);
    return data ? (JSON.parse(data) as Prestamo[]) : [];
  } catch {
    return [];
  }
}

export function guardarPrestamo(prestamo: Prestamo): void {
  const prestamos = obtenerPrestamos();
  prestamos.unshift(prestamo);
  localStorage.setItem(PRESTAMOS_KEY, JSON.stringify(prestamos));
}

export function marcarDevuelto(id: string): void {
  const prestamos = obtenerPrestamos().map((p) =>
    p.id === id
      ? { ...p, estado: 'devuelto' as const, fechaDevolucionReal: new Date().toISOString() }
      : p
  );
  localStorage.setItem(PRESTAMOS_KEY, JSON.stringify(prestamos));
}

export function eliminarPrestamo(id: string): void {
  const prestamos = obtenerPrestamos().filter((p) => p.id !== id);
  localStorage.setItem(PRESTAMOS_KEY, JSON.stringify(prestamos));
}

export function limpiarPrestamos(): void {
  localStorage.removeItem(PRESTAMOS_KEY);
}
