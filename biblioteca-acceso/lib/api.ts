import { Registro } from '@/types/registro';
import { Prestamo } from '@/types/prestamo';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(detail || `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Registros ─────────────────────────────────────────────────────────────────

export const fetchRegistros = () =>
  request<Registro[]>('/api/registros/');

export const crearRegistro = (registro: Registro) =>
  request<Registro>('/api/registros/', {
    method: 'POST',
    body: JSON.stringify(registro),
  });

export const eliminarRegistroAPI = (id: string) =>
  request<{ ok: boolean }>(`/api/registros/${id}`, { method: 'DELETE' });

export const limpiarRegistrosAPI = () =>
  request<{ ok: boolean }>('/api/registros/limpiar', { method: 'DELETE' });

// ── Préstamos ─────────────────────────────────────────────────────────────────

export const fetchPrestamos = () =>
  request<Prestamo[]>('/api/prestamos/');

export const crearPrestamoAPI = (prestamo: Prestamo) =>
  request<Prestamo>('/api/prestamos/', {
    method: 'POST',
    body: JSON.stringify(prestamo),
  });

export const devolverPrestamoAPI = (id: string) =>
  request<Prestamo>(`/api/prestamos/${id}/devolver`, { method: 'PATCH' });

export const eliminarPrestamoAPI = (id: string) =>
  request<{ ok: boolean }>(`/api/prestamos/${id}`, { method: 'DELETE' });
