// Todas las fechas se calculan con el offset de la ciudad (timezone de la API),
// no con el del navegador: se suma el offset y se leen los campos UTC.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Date "corrida" al horario local de la ciudad; usar solo los getters UTC */
export function fechaLocal(unixSec: number, tzOffsetSec: number): Date {
  return new Date((unixSec + tzOffsetSec) * 1000);
}

/** Formatea hora Unix (UTC) ajustada al timezone de la ciudad: "HH:MM" */
export function formatHoraUTC(unixSec: number, tzOffsetSec: number): string {
  const d = fechaLocal(unixSec, tzOffsetSec);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** Fecha y hora actuales de la ciudad: { dia: "lunes 27 de octubre", hora: "19:05" } */
export function fechaHoraLocal(tzOffsetSec: number): { dia: string; hora: string } {
  const nowUTC = Math.floor(Date.now() / 1000);
  const d = fechaLocal(nowUTC, tzOffsetSec);
  return {
    dia: `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`,
    hora: formatHoraUTC(nowUTC, tzOffsetSec),
  };
}

/** Día de la semana y número: { semana: "Mié", numero: 28, completo: "miércoles 28 de octubre" } */
export function diaPronostico(unixSec: number, tzOffsetSec: number) {
  const d = fechaLocal(unixSec, tzOffsetSec);
  const dia = DIAS[d.getUTCDay()]!;
  return {
    semana: dia.charAt(0).toUpperCase() + dia.slice(1, 3),
    numero: d.getUTCDate(),
    completo: `${dia} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`,
  };
}

