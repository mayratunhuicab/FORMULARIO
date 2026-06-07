export interface Prestamo {
  id: string;
  visitanteId: string;
  nombreCompleto: string;
  tipoCredencial: 'estudiante' | 'elector';
  fotoCredencial: string;
  libro: string;
  fechaPrestamo: string; // ISO
  fechaDevolucionEsperada: string; // ISO
  fechaDevolucionReal?: string; // ISO — set when returned
  estado: 'activo' | 'devuelto';
}
