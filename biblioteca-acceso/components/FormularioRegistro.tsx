'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { crearRegistro } from '@/lib/api';
import { Registro } from '@/types/registro';

export default function FormularioRegistro() {
  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [tipoCredencial, setTipoCredencial] = useState<'estudiante' | 'elector'>('estudiante');
  const [fotoCredencial, setFotoCredencial] = useState('');
  const [fotoNombre, setFotoNombre] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [nombreRegistrado, setNombreRegistrado] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const actualizar = () => {
      const ahora = new Date();
      setFechaHora(
        ahora.toLocaleString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    actualizar();
    const intervalo = setInterval(actualizar, 1000);
    return () => clearInterval(intervalo);
  }, []);

  const manejarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (archivo.size > 5 * 1024 * 1024) {
      setErrores((prev) => ({ ...prev, fotoCredencial: 'La imagen no debe superar 5 MB' }));
      return;
    }
    setFotoNombre(archivo.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoCredencial(reader.result as string);
      setErrores((prev) => { const next = { ...prev }; delete next.fotoCredencial; return next; });
    };
    reader.readAsDataURL(archivo);
  };

  const manejarSoltarArchivo = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const archivo = e.dataTransfer.files?.[0];
    if (!archivo || !archivo.type.startsWith('image/')) return;
    const syntheticEvent = { target: { files: [archivo] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    manejarFoto(syntheticEvent);
  };

  const validar = () => {
    const nuevosErrores: Record<string, string> = {};
    if (!nombre.trim()) nuevosErrores.nombre = 'El nombre es requerido';
    if (!apellidoPaterno.trim()) nuevosErrores.apellidoPaterno = 'El apellido paterno es requerido';
    if (!fotoCredencial) nuevosErrores.fotoCredencial = 'La foto de credencial es requerida';
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarEnvio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validar()) return;
    const registro: Registro = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nombre: nombre.trim(),
      apellidoPaterno: apellidoPaterno.trim(),
      apellidoMaterno: apellidoMaterno.trim(),
      tipoCredencial,
      fotoCredencial,
      fechaHora: new Date().toISOString(),
    };
    try {
      setEnviando(true);
      setErrorEnvio('');
      await crearRegistro(registro);
      setNombreRegistrado(`${registro.nombre} ${registro.apellidoPaterno}`);
      setEnviado(true);
    } catch {
      setErrorEnvio('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
    } finally {
      setEnviando(false);
    }
  };

  const reiniciar = () => {
    setNombre('');
    setApellidoPaterno('');
    setApellidoMaterno('');
    setTipoCredencial('estudiante');
    setFotoCredencial('');
    setFotoNombre('');
    setErrores({});
    setEnviado(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <HeaderBar fechaHora={fechaHora} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Registro exitoso!</h2>
            <p className="text-gray-500 mb-1">Bienvenido/a a la biblioteca</p>
            <p className="text-blue-700 font-semibold text-lg mb-8">{nombreRegistrado}</p>
            <button
              onClick={reiniciar}
              className="px-8 py-3 bg-blue-700 text-white rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-sm"
            >
              Nuevo registro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <HeaderBar fechaHora={fechaHora} />

      <main className="flex-1 max-w-2xl w-full mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-blue-700 px-6 py-5 text-white">
            <h2 className="text-xl font-bold">Registro de entrada</h2>
            <p className="text-blue-200 text-sm mt-0.5">Completa el formulario para acceder a la biblioteca</p>
          </div>

          <form onSubmit={manejarEnvio} className="p-6 space-y-7">
            {/* Datos personales */}
            <section>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Datos personales
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nombre(s) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. María Fernanda"
                    className={`w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errores.nombre ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'
                    }`}
                  />
                  {errores.nombre && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <span>⚠</span> {errores.nombre}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Apellido paterno <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={apellidoPaterno}
                      onChange={(e) => setApellidoPaterno(e.target.value)}
                      placeholder="Apellido paterno"
                      className={`w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        errores.apellidoPaterno ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'
                      }`}
                    />
                    {errores.apellidoPaterno && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                        <span>⚠</span> {errores.apellidoPaterno}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Apellido materno
                    </label>
                    <input
                      type="text"
                      value={apellidoMaterno}
                      onChange={(e) => setApellidoMaterno(e.target.value)}
                      placeholder="Apellido materno"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Credencial */}
            <section>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Credencial de identificación
              </p>

              {/* Tipo de credencial */}
              <div className="flex gap-3 mb-5">
                {(['estudiante', 'elector'] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoCredencial(tipo)}
                    className={`flex-1 py-3 px-3 rounded-xl border-2 font-medium text-sm transition-all ${
                      tipoCredencial === tipo
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {tipo === 'estudiante' ? (
                      <span className="flex items-center justify-center gap-2">
                        <GraduationIcon />
                        Credencial estudiantil
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <IdCardIcon />
                        Credencial de elector
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Subir foto */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Foto de credencial <span className="text-red-500">*</span>
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                    errores.fotoCredencial
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={manejarSoltarArchivo}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={manejarFoto}
                    className="hidden"
                  />
                  {fotoCredencial ? (
                    <div className="flex items-center gap-4 p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fotoCredencial}
                        alt="Vista previa de credencial"
                        className="h-28 w-44 object-cover rounded-lg border border-slate-200 shadow-sm"
                      />
                      <div className="flex-1">
                        <p className="text-green-600 font-semibold text-sm flex items-center gap-1">
                          <span>✓</span> Foto cargada correctamente
                        </p>
                        <p className="text-slate-500 text-xs mt-1 truncate max-w-[160px]">{fotoNombre}</p>
                        <button
                          type="button"
                          className="mt-3 text-blue-600 text-xs font-medium hover:underline"
                        >
                          Cambiar foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <UploadIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 text-sm font-medium">
                        Haz clic o arrastra aquí la foto de tu credencial
                      </p>
                      <p className="text-slate-400 text-xs mt-1">PNG, JPG o JPEG — máximo 5 MB</p>
                    </div>
                  )}
                </div>
                {errores.fotoCredencial && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {errores.fotoCredencial}
                  </p>
                )}
              </div>
            </section>

            {errorEnvio && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                ⚠ {errorEnvio}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-4 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-base shadow-sm"
            >
              {enviando ? 'Registrando...' : 'Registrar entrada'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function HeaderBar({ fechaHora }: { fechaHora: string }) {
  return (
    <header className="bg-blue-800 text-white shadow-md">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookIcon className="w-8 h-8 text-blue-200" />
          <div>
            <h1 className="text-lg font-bold leading-tight">Biblioteca</h1>
            <p className="text-blue-300 text-xs">Control de acceso</p>
          </div>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-900/50 hover:bg-blue-900 text-blue-200 hover:text-white text-xs font-medium transition-colors border border-blue-700/50"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Admin
        </Link>
      </div>
      <div className="bg-blue-900/40 text-blue-200 text-center text-xs py-2 capitalize tracking-wide">
        {fechaHora}
      </div>
    </header>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}


function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function GraduationIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
      />
    </svg>
  );
}

function IdCardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
      />
    </svg>
  );
}
