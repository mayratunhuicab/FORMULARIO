export interface Registro {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  tipoCredencial: 'estudiante' | 'elector';
  fotoCredencial: string; // base64 data URL
  fechaHora: string; // ISO 8601
}
