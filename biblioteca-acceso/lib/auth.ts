const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const SESSION_KEY = 'biblioteca_admin_auth';

export async function verificarCredenciales(usuario: string, password: string): Promise<boolean> {
  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usuario, password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function iniciarSesion(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, Date.now().toString());
  }
}

export function cerrarSesion(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function estaAutenticado(): boolean {
  if (typeof window === 'undefined') return false;
  return !!sessionStorage.getItem(SESSION_KEY);
}
