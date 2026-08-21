export const DATA_REFERENCIA = '2026-08-21';

export function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return null;
  // valida se a data é exatamente a informada (evita rollover)
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
  return d;
}

export function diffDays(date1: string, date2: string): number {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  if (!d1 || !d2) return NaN;
  const diff = d2.getTime() - d1.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function isVencido(vencimento: string, referencia: string = DATA_REFERENCIA): boolean {
  const diff = diffDays(vencimento, referencia);
  return diff < 0;
}

export function diasAtraso(vencimento: string, referencia: string = DATA_REFERENCIA): number {
  const diff = diffDays(vencimento, referencia);
  return diff < 0 ? -diff : 0;
}

export function calcularPDD(vencimento: string, valor: number, referencia: string = DATA_REFERENCIA): number {
  const atraso = diasAtraso(vencimento, referencia);
  if (atraso <= 0) return 0;
  if (atraso <= 30) return valor * 0.5;
  return valor;
}