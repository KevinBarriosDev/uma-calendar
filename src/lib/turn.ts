// Turnos de la carrera: 3 años × 12 meses × 2 mitades = 72.

export const TURN_COUNT = 72;
export const YEAR_NAMES = ['Junior', 'Classic', 'Senior'] as const;
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export type Year = 1 | 2 | 3;
export type Half = 1 | 2;
export interface TurnParts { year: Year; month: number; half: Half }

export function isTurn(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= TURN_COUNT;
}

export function toTurn({ year, month, half }: TurnParts): number {
  const ok = [1, 2, 3].includes(year) && Number.isInteger(month) && month >= 1 && month <= 12 && (half === 1 || half === 2);
  if (!ok) throw new RangeError(`Turno inválido: ${year}/${month}/${half}`);
  return (year - 1) * 24 + (month - 1) * 2 + half;
}

export function fromTurn(turn: number): TurnParts {
  if (!isTurn(turn)) throw new RangeError(`Turno inválido: ${turn}`);
  const i = turn - 1;
  return { year: (Math.floor(i / 24) + 1) as Year, month: Math.floor((i % 24) / 2) + 1, half: ((i % 2) + 1) as Half };
}

export function turnLabel(turn: number): string {
  const { year, month, half } = fromTurn(turn);
  return `${YEAR_NAMES[year - 1]} · ${half === 1 ? 'Early' : 'Late'} ${MONTH_NAMES[month - 1]}`;
}

export function turnsOfYear(year: Year): number[] {
  return Array.from({ length: 24 }, (_, i) => (year - 1) * 24 + i + 1);
}
