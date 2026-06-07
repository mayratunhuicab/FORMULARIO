'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchRegistros,
  fetchPrestamos,
  crearPrestamoAPI,
  eliminarRegistroAPI,
  limpiarRegistrosAPI,
  devolverPrestamoAPI,
  eliminarPrestamoAPI,
} from '@/lib/api';
import { estaAutenticado, cerrarSesion } from '@/lib/auth';
import { Registro } from '@/types/registro';
import { Prestamo } from '@/types/prestamo';

type Tab = 'registros' | 'prestamos';
type FiltroFecha = 'hoy' | 'ayer' | 'todos' | 'personalizada';
type FiltroPrestamo = 'activos' | 'devueltos' | 'todos';

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function AdminPanel() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [errorConexion, setErrorConexion] = useState('');

  // Datos
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);

  // Tabs y filtros
  const [tab, setTab] = useState<Tab>('registros');
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('hoy');
  const [fechaPersonalizada, setFechaPersonalizada] = useState('');
  const [filtroPrestamo, setFiltroPrestamo] = useState<FiltroPrestamo>('activos');
  const [busqueda, setBusqueda] = useState('');
  const [badgeNuevos, setBadgeNuevos] = useState(0);

  // Modales
  const [registroDetalle, setRegistroDetalle] = useState<Registro | null>(null);
  const [modoFormPrestamo, setModoFormPrestamo] = useState(false);
  const [libroInput, setLibroInput] = useState('');
  const [fechaDevInput, setFechaDevInput] = useState('');
  const [errorLibro, setErrorLibro] = useState('');
  const [confirmarLimpiar, setConfirmarLimpiar] = useState(false);

  // ─── Auth + carga inicial ────────────────────────────────────────────────
  useEffect(() => {
    if (!estaAutenticado()) {
      router.replace('/admin');
      return;
    }
    const cargar = async () => {
      try {
        const [r, p] = await Promise.all([fetchRegistros(), fetchPrestamos()]);
        setRegistros(r);
        setPrestamos(p);
        setErrorConexion('');
      } catch {
        setErrorConexion(
          'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8000'
        );
      } finally {
        setCargando(false);
        setVerificando(false);
      }
    };
    cargar();
  }, [router]);

  // ─── Polling cada 5 s (tiempo real) ─────────────────────────────────────
  useEffect(() => {
    if (verificando) return;
    let activo = true;

    const poll = async () => {
      try {
        const actuales = await fetchRegistros();
        if (!activo) return;
        setRegistros((prev) => {
          if (actuales.length > prev.length) {
            setBadgeNuevos((n) => n + actuales.length - prev.length);
          }
          return actuales;
        });
      } catch { /* silencioso en polling */ }
      if (activo) setTimeout(poll, 5000);
    };

    const timer = setTimeout(poll, 5000);
    return () => { activo = false; clearTimeout(timer); };
  }, [verificando]);

  // ─── Filtros ──────────────────────────────────────────────────────────────
  const registrosFiltrados = (() => {
    const hoy = new Date();
    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);

    let lista = registros;
    if (filtroFecha === 'hoy') {
      lista = registros.filter((r) => isSameDay(new Date(r.fechaHora), hoy));
    } else if (filtroFecha === 'ayer') {
      lista = registros.filter((r) => isSameDay(new Date(r.fechaHora), ayer));
    } else if (filtroFecha === 'personalizada' && fechaPersonalizada) {
      const [y, m, d] = fechaPersonalizada.split('-').map(Number);
      lista = registros.filter((r) => {
        const f = new Date(r.fechaHora);
        return f.getFullYear() === y && f.getMonth() + 1 === m && f.getDate() === d;
      });
    }

    if (busqueda) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(
        (r) =>
          r.nombre.toLowerCase().includes(q) ||
          r.apellidoPaterno.toLowerCase().includes(q) ||
          r.apellidoMaterno.toLowerCase().includes(q)
      );
    }
    return lista;
  })();

  const prestamosFiltrados = prestamos.filter((p) => {
    if (filtroPrestamo === 'activos') return p.estado === 'activo';
    if (filtroPrestamo === 'devueltos') return p.estado === 'devuelto';
    return true;
  });

  const hoyCount = registros.filter((r) => isSameDay(new Date(r.fechaHora), new Date())).length;
  const activosCount = prestamos.filter((p) => p.estado === 'activo').length;

  // ─── Handlers registros ───────────────────────────────────────────────────
  const eliminarReg = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await eliminarRegistroAPI(id);
    setRegistros((prev) => prev.filter((r) => r.id !== id));
    if (registroDetalle?.id === id) setRegistroDetalle(null);
  };

  const limpiarTodos = async () => {
    await limpiarRegistrosAPI();
    setRegistros([]);
    setConfirmarLimpiar(false);
  };

  // ─── Handlers préstamos ───────────────────────────────────────────────────
  const abrirFormPrestamo = () => {
    const dev = new Date(); dev.setDate(dev.getDate() + 7);
    setFechaDevInput(dev.toISOString().split('T')[0]);
    setLibroInput('');
    setErrorLibro('');
    setModoFormPrestamo(true);
  };

  const registrarPrestamo = async () => {
    if (!libroInput.trim()) { setErrorLibro('Escribe el título del libro'); return; }
    if (!registroDetalle || !fechaDevInput) return;

    const p: Prestamo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      visitanteId: registroDetalle.id,
      nombreCompleto: [
        registroDetalle.nombre,
        registroDetalle.apellidoPaterno,
        registroDetalle.apellidoMaterno,
      ].filter(Boolean).join(' '),
      tipoCredencial: registroDetalle.tipoCredencial,
      fotoCredencial: registroDetalle.fotoCredencial,
      libro: libroInput.trim(),
      fechaPrestamo: new Date().toISOString(),
      fechaDevolucionEsperada: new Date(`${fechaDevInput}T23:59:59`).toISOString(),
      estado: 'activo',
    };

    const nuevo = await crearPrestamoAPI(p);
    setPrestamos((prev) => [nuevo, ...prev]);
    setModoFormPrestamo(false);
    setRegistroDetalle(null);
    setTab('prestamos');
    setFiltroPrestamo('activos');
  };

  const devolver = async (id: string) => {
    const actualizado = await devolverPrestamoAPI(id);
    setPrestamos((prev) => prev.map((p) => (p.id === id ? actualizado : p)));
  };

  const eliminarPrest = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await eliminarPrestamoAPI(id);
    setPrestamos((prev) => prev.filter((p) => p.id !== id));
  };

  // ─── Formato ──────────────────────────────────────────────────────────────
  const fmtFecha = (iso: string) =>
    new Date(iso).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const fmtFechaCorta = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

  const estadoVencimiento = (iso: string): 'ok' | 'hoy' | 'vencido' => {
    const hoy = new Date();
    const vence = new Date(iso);
    if (isSameDay(vence, hoy)) return 'hoy';
    if (vence < hoy) return 'vencido';
    return 'ok';
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (verificando || cargando) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center flex-col gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Cargando datos...</p>
      </div>
    );
  }

  if (errorConexion) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md w-full text-center shadow-sm">
          <p className="text-4xl mb-3">⚠️</p>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Error de conexión</h2>
          <p className="text-slate-500 text-sm mb-5">{errorConexion}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">Panel Admin</span>
                <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full font-medium">Biblioteca</span>
              </div>
              <p className="text-slate-400 text-xs hidden sm:block">
                {hoyCount} visita{hoyCount !== 1 ? 's' : ''} hoy · {activosCount} préstamo{activosCount !== 1 ? 's' : ''} activo{activosCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => { cerrarSesion(); router.push('/admin'); }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <LogoutIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex border-t border-slate-800">
          <TabBtn
            active={tab === 'registros'}
            onClick={() => { setTab('registros'); setBadgeNuevos(0); }}
            badge={badgeNuevos > 0 ? `+${badgeNuevos} nuevos` : `${hoyCount} hoy`}
            badgeGreen={badgeNuevos > 0}
          >
            Registros
          </TabBtn>
          <TabBtn
            active={tab === 'prestamos'}
            onClick={() => setTab('prestamos')}
            badge={`${activosCount} activo${activosCount !== 1 ? 's' : ''}`}
            badgeGreen={false}
          >
            Préstamos
          </TabBtn>
        </div>
      </header>

      {/* ══ CONTENIDO ═══════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-5xl w-full mx-auto py-6 px-4">

        {/* ── TAB REGISTROS ─────────────────────────────────────────────── */}
        {tab === 'registros' && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {(['hoy', 'ayer', 'todos'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroFecha(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtroFecha === f
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {f === 'hoy' ? 'Hoy' : f === 'ayer' ? 'Ayer' : 'Todos los días'}
                </button>
              ))}
              <input
                type="date"
                value={filtroFecha === 'personalizada' ? fechaPersonalizada : ''}
                onChange={(e) => { setFechaPersonalizada(e.target.value); setFiltroFecha('personalizada'); }}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  filtroFecha === 'personalizada'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              />
              {registros.length > 0 && (
                <button
                  onClick={() => setConfirmarLimpiar(true)}
                  className="ml-auto text-slate-400 hover:text-red-500 text-sm px-3 py-2 rounded-lg hover:bg-red-50 flex items-center gap-1.5 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Limpiar registros</span>
                </button>
              )}
            </div>

            <div className="relative mb-3">
              <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o apellido..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            <p className="text-slate-500 text-sm mb-4">
              <strong className="text-slate-700">{registrosFiltrados.length}</strong>{' '}
              {filtroFecha === 'hoy' ? 'visita(s) hoy' : filtroFecha === 'ayer' ? 'visita(s) ayer' : 'registro(s)'}
            </p>

            {registrosFiltrados.length === 0 ? (
              <EmptyState icon="📋" text="Sin registros para este período" />
            ) : (
              <div className="space-y-2">
                {registrosFiltrados.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => { setRegistroDetalle(r); setModoFormPrestamo(false); }}
                    className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.fotoCredencial} alt="Credencial"
                      className="h-14 w-20 object-cover rounded-lg border border-slate-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {r.nombre} {r.apellidoPaterno} {r.apellidoMaterno}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.tipoCredencial === 'estudiante' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {r.tipoCredencial === 'estudiante' ? 'Estudiantil' : 'Elector'}
                        </span>
                        <span className="text-slate-400 text-xs capitalize">{fmtFecha(r.fechaHora)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setRegistroDetalle(r); abrirFormPrestamo(); }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <BookIcon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Prestar</span>
                      </button>
                      <button
                        onClick={(e) => eliminarReg(r.id, e)}
                        className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TAB PRÉSTAMOS ─────────────────────────────────────────────── */}
        {tab === 'prestamos' && (
          <>
            <div className="flex gap-2 mb-4 flex-wrap">
              {(['activos', 'devueltos', 'todos'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroPrestamo(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    filtroPrestamo === f
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <p className="text-slate-500 text-sm mb-4">
              <strong className="text-slate-700">{prestamosFiltrados.length}</strong> préstamo(s)
            </p>

            {prestamosFiltrados.length === 0 ? (
              <EmptyState
                icon="📚"
                text={filtroPrestamo === 'activos' ? 'No hay préstamos activos' : 'Sin préstamos en esta categoría'}
              />
            ) : (
              <div className="space-y-2">
                {prestamosFiltrados.map((p) => {
                  const ev = estadoVencimiento(p.fechaDevolucionEsperada);
                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.fotoCredencial} alt="Visitante"
                        className="h-14 w-20 object-cover rounded-lg border border-slate-100 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{p.nombreCompleto}</p>
                        <p className="text-blue-700 text-sm font-medium truncate mt-0.5">📚 {p.libro}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {p.estado === 'activo' ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              ev === 'vencido' ? 'bg-red-100 text-red-700' :
                              ev === 'hoy' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {ev === 'vencido' ? '⚠ Vencido' : ev === 'hoy' ? '⏰ Vence hoy' : '✓ Activo'}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                              Devuelto {p.fechaDevolucionReal ? fmtFechaCorta(p.fechaDevolucionReal) : ''}
                            </span>
                          )}
                          <span className="text-slate-400 text-xs capitalize">
                            Devolver: {fmtFechaCorta(p.fechaDevolucionEsperada)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {p.estado === 'activo' && (
                          <button
                            onClick={() => devolver(p.id)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <CheckIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Devuelto</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => eliminarPrest(p.id, e)}
                          className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* ══ MODAL: DETALLE ═══════════════════════════════════════════════════ */}
      {registroDetalle && !modoFormPrestamo && (
        <ModalWrapper onClose={() => setRegistroDetalle(null)}>
          <ModalHeader title="Detalle del visitante" onClose={() => setRegistroDetalle(null)} />
          <div className="p-6">
            <div className="flex justify-center mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={registroDetalle.fotoCredencial} alt="Credencial"
                className="max-h-48 max-w-full rounded-xl border border-slate-200 shadow-sm object-contain" />
            </div>
            <div className="space-y-2 mb-5">
              <DataRow label="Nombre(s)" value={registroDetalle.nombre} />
              <DataRow label="Apellido paterno" value={registroDetalle.apellidoPaterno} />
              {registroDetalle.apellidoMaterno && <DataRow label="Apellido materno" value={registroDetalle.apellidoMaterno} />}
              <DataRow label="Credencial" value={registroDetalle.tipoCredencial === 'estudiante' ? 'Estudiantil' : 'De elector'} />
              <DataRow label="Fecha de entrada" value={fmtFecha(registroDetalle.fechaHora)} capitalize />
            </div>
            <button onClick={abrirFormPrestamo}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
              <BookIcon className="w-4 h-4" />
              Registrar préstamo de libro
            </button>
          </div>
        </ModalWrapper>
      )}

      {/* ══ MODAL: FORM PRÉSTAMO ═════════════════════════════════════════════ */}
      {registroDetalle && modoFormPrestamo && (
        <ModalWrapper onClose={() => { setModoFormPrestamo(false); setRegistroDetalle(null); }}>
          <ModalHeader title="Registrar préstamo"
            onClose={() => { setModoFormPrestamo(false); setRegistroDetalle(null); }} />
          <div className="p-6">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-5 border border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={registroDetalle.fotoCredencial} alt=""
                className="w-12 h-9 object-cover rounded-lg border border-slate-200 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">
                  {registroDetalle.nombre} {registroDetalle.apellidoPaterno} {registroDetalle.apellidoMaterno}
                </p>
                <p className="text-slate-400 text-xs capitalize">{fmtFecha(registroDetalle.fechaHora)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1.5">
                  Título del libro <span className="text-red-500">*</span>
                </label>
                <input type="text" value={libroInput}
                  onChange={(e) => { setLibroInput(e.target.value); setErrorLibro(''); }}
                  placeholder="Ej. El Principito"
                  className={`w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errorLibro ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {errorLibro && <p className="text-red-500 text-xs mt-1.5">⚠ {errorLibro}</p>}
              </div>
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1.5">
                  Fecha de devolución <span className="text-red-500">*</span>
                </label>
                <input type="date" value={fechaDevInput}
                  onChange={(e) => setFechaDevInput(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModoFormPrestamo(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={registrarPrestamo} disabled={!fechaDevInput}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-400 text-white font-semibold rounded-xl transition-colors">
                Registrar préstamo
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* ══ MODAL: CONFIRMAR LIMPIAR ══════════════════════════════════════════ */}
      {confirmarLimpiar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">¿Limpiar todos los registros?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Se eliminarán {registros.length} registro{registros.length !== 1 ? 's' : ''} de la base de datos. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarLimpiar(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={limpiarTodos}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-medium">
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componentes internos ────────────────────────────────────────────────────

function TabBtn({ active, onClick, children, badge, badgeGreen }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
  badge: string; badgeGreen: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
        active ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
      }`}>
      {children}
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
        badgeGreen ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
      }`}>
        {badge}
      </span>
    </button>
  );
}

function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
      <h2 className="text-white font-bold">{title}</h2>
      <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
        <CloseIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-14 text-center shadow-sm">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-slate-500 font-medium">{text}</p>
    </div>
  );
}

function DataRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-sm flex-shrink-0">{label}</span>
      <span className={`text-slate-800 text-sm font-medium text-right ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>;
}
function LogoutIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>;
}
function TrashIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>;
}
function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
  </svg>;
}
function BookIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>;
}
function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>;
}
function CloseIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>;
}
