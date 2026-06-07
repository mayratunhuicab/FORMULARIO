'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { obtenerRegistros, eliminarRegistro, limpiarRegistros } from '@/lib/storage';
import { estaAutenticado, cerrarSesion } from '@/lib/auth';
import { Registro } from '@/types/registro';

export default function AdminRegistros() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [verificando, setVerificando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [registroDetalle, setRegistroDetalle] = useState<Registro | null>(null);
  const [confirmarLimpiar, setConfirmarLimpiar] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!estaAutenticado()) {
      router.replace('/admin');
      return;
    }
    setRegistros(obtenerRegistros());
    setVerificando(false);
  }, [router]);

  const registrosFiltrados = registros.filter((r) => {
    const q = busqueda.toLowerCase();
    return (
      r.nombre.toLowerCase().includes(q) ||
      r.apellidoPaterno.toLowerCase().includes(q) ||
      r.apellidoMaterno.toLowerCase().includes(q)
    );
  });

  const manejarEliminar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    eliminarRegistro(id);
    setRegistros(obtenerRegistros());
    if (registroDetalle?.id === id) setRegistroDetalle(null);
  };

  const manejarLimpiar = () => {
    limpiarRegistros();
    setRegistros([]);
    setConfirmarLimpiar(false);
  };

  const manejarCerrarSesion = () => {
    cerrarSesion();
    router.push('/admin');
  };

  const copiarDatos = (registro: Registro) => {
    const texto = [
      `Nombre: ${registro.nombre} ${registro.apellidoPaterno} ${registro.apellidoMaterno}`,
      `Credencial: ${registro.tipoCredencial === 'estudiante' ? 'Estudiantil' : 'De elector'}`,
      `Fecha de entrada: ${formatearFecha(registro.fechaHora)}`,
    ].join('\n');
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const formatearFecha = (iso: string) =>
    new Date(iso).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (verificando) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Verificando sesión...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header admin */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold leading-tight">Registros de acceso</h1>
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                {registros.length} registro{registros.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {registros.length > 0 && (
              <button
                onClick={() => setConfirmarLimpiar(true)}
                className="text-slate-400 hover:text-red-400 text-sm px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
            <button
              onClick={manejarCerrarSesion}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <LogoutIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto py-8 px-4">
        {registros.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-slate-500 text-lg font-medium">Sin registros aún</p>
            <p className="text-slate-400 text-sm mt-1">
              Los visitantes que llenen el formulario aparecerán aquí
            </p>
          </div>
        ) : (
          <>
            {/* Buscador */}
            <div className="mb-5 relative">
              <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o apellido..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            {registrosFiltrados.length === 0 ? (
              <p className="text-center text-slate-500 py-10">
                Sin resultados para &ldquo;{busqueda}&rdquo;
              </p>
            ) : (
              <div className="space-y-2">
                {registrosFiltrados.map((registro) => (
                  <div
                    key={registro.id}
                    onClick={() => setRegistroDetalle(registro)}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    {/* Foto miniatura */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={registro.fotoCredencial}
                      alt="Credencial"
                      className="h-14 w-20 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                    />

                    {/* Datos */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {registro.nombre} {registro.apellidoPaterno} {registro.apellidoMaterno}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          registro.tipoCredencial === 'estudiante'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {registro.tipoCredencial === 'estudiante' ? 'Estudiantil' : 'Elector'}
                        </span>
                        <span className="text-slate-400 text-xs capitalize">
                          {formatearFecha(registro.fechaHora)}
                        </span>
                      </div>
                    </div>

                    {/* Ver detalle hint */}
                    <div className="text-slate-300 flex-shrink-0 hidden sm:block">
                      <ChevronIcon className="w-5 h-5" />
                    </div>

                    {/* Eliminar */}
                    <button
                      onClick={(e) => manejarEliminar(registro.id, e)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 flex-shrink-0"
                      title="Eliminar registro"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal: detalle de registro (jalar datos) */}
      {registroDetalle && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setRegistroDetalle(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold text-base">Detalle del visitante</h2>
              <button
                onClick={() => setRegistroDetalle(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Foto grande */}
              <div className="flex justify-center mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={registroDetalle.fotoCredencial}
                  alt="Credencial"
                  className="max-h-44 max-w-full rounded-xl border border-slate-200 shadow-sm object-contain"
                />
              </div>

              {/* Datos */}
              <div className="space-y-3">
                <DataRow label="Nombre(s)" value={registroDetalle.nombre} />
                <DataRow label="Apellido paterno" value={registroDetalle.apellidoPaterno} />
                {registroDetalle.apellidoMaterno && (
                  <DataRow label="Apellido materno" value={registroDetalle.apellidoMaterno} />
                )}
                <DataRow
                  label="Tipo de credencial"
                  value={registroDetalle.tipoCredencial === 'estudiante' ? 'Estudiantil' : 'De elector'}
                />
                <DataRow
                  label="Fecha y hora de entrada"
                  value={formatearFecha(registroDetalle.fechaHora)}
                  capitalize
                />
              </div>

              {/* Botón copiar datos */}
              <button
                onClick={() => copiarDatos(registroDetalle)}
                className={`w-full mt-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  copiado
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copiado ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Datos copiados
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-4 h-4" />
                    Copiar datos del visitante
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar limpiar */}
      {confirmarLimpiar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">¿Limpiar todos los registros?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Se eliminarán {registros.length} registro{registros.length !== 1 ? 's' : ''}. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarLimpiar(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={manejarLimpiar}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-medium transition-colors"
              >
                Limpiar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DataRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-sm flex-shrink-0">{label}</span>
      <span className={`text-slate-800 text-sm font-medium text-right ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
