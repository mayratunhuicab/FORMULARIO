'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { obtenerRegistros, eliminarRegistro, limpiarRegistros } from '@/lib/storage';
import { Registro } from '@/types/registro';

export default function ListaRegistros() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [confirmarLimpiar, setConfirmarLimpiar] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    setRegistros(obtenerRegistros());
  }, []);

  const registrosFiltrados = registros.filter((r) => {
    const texto = busqueda.toLowerCase();
    return (
      r.nombre.toLowerCase().includes(texto) ||
      r.apellidoPaterno.toLowerCase().includes(texto) ||
      r.apellidoMaterno.toLowerCase().includes(texto)
    );
  });

  const manejarEliminar = (id: string) => {
    eliminarRegistro(id);
    setRegistros(obtenerRegistros());
  };

  const manejarLimpiar = () => {
    limpiarRegistros();
    setRegistros([]);
    setConfirmarLimpiar(false);
  };

  const formatearFecha = (iso: string) => {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-800 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
              title="Volver al formulario"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight">Registros de acceso</h1>
              <p className="text-blue-300 text-xs">
                {registros.length} registro{registros.length !== 1 ? 's' : ''} en total
              </p>
            </div>
          </div>
          {registros.length > 0 && (
            <button
              onClick={() => setConfirmarLimpiar(true)}
              className="text-blue-200 hover:text-red-300 text-sm flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Limpiar todo
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto py-8 px-4">
        {registros.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
            <svg
              className="w-16 h-16 text-slate-300 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-slate-500 text-lg font-medium">No hay registros aún</p>
            <p className="text-slate-400 text-sm mt-1 mb-6">
              Los registros de acceso aparecerán aquí una vez que alguien se registre
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-700 text-white rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-sm"
            >
              Ir al formulario
            </Link>
          </div>
        ) : (
          <>
            {/* Barra de búsqueda */}
            <div className="mb-5 relative">
              <svg
                className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"
                />
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
              <p className="text-center text-slate-500 py-10">No se encontraron resultados para &ldquo;{busqueda}&rdquo;</p>
            ) : (
              <div className="space-y-3">
                {registrosFiltrados.map((registro, index) => (
                  <div
                    key={registro.id}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4 hover:border-blue-200 transition-colors"
                  >
                    {/* Número */}
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {registros.indexOf(registro) + 1}
                    </div>

                    {/* Foto */}
                    <button
                      onClick={() => setFotoAmpliada(registro.fotoCredencial)}
                      className="flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors shadow-sm"
                      title="Ver foto ampliada"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={registro.fotoCredencial}
                        alt="Credencial"
                        className="h-14 w-20 object-cover"
                      />
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {registro.nombre} {registro.apellidoPaterno} {registro.apellidoMaterno}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            registro.tipoCredencial === 'estudiante'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {registro.tipoCredencial === 'estudiante'
                            ? 'Estudiantil'
                            : 'Elector'}
                        </span>
                        <span className="text-slate-400 text-xs capitalize">
                          {formatearFecha(registro.fechaHora)}
                        </span>
                      </div>
                    </div>

                    {/* Eliminar */}
                    <button
                      onClick={() => manejarEliminar(registro.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1.5 flex-shrink-0 rounded-lg hover:bg-red-50"
                      title="Eliminar registro"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal: foto ampliada */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setFotoAmpliada(null)}
        >
          <div
            className="bg-white rounded-2xl p-3 max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoAmpliada}
              alt="Credencial ampliada"
              className="w-full rounded-xl object-contain max-h-[70vh]"
            />
            <button
              onClick={() => setFotoAmpliada(null)}
              className="w-full mt-3 py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal: confirmar limpiar */}
      {confirmarLimpiar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
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
