const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const SESSION_KEY = 'biblioteca_admin_auth';
const TOKEN_KEY = 'biblioteca_admin_token';

export async function verificarCredenciales(usuario: string, password: string): Promise<boolean> {
  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usuario, password }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (typeof window !== 'undefined' && data.token) {
      sessionStorage.setItem(TOKEN_KEY, data.token);
    }
    return true;
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
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

export function estaAutenticado(): boolean {
  if (typeof window === 'undefined') return false;
  return !!sessionStorage.getItem(SESSION_KEY);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}
