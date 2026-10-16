import { isTurn } from './turn';

export interface UrlState { uma: string | null; turn: number | null }

// Valores inválidos se descartan: nunca lanza, aunque el query sea basura.
export function parseUrlState(search: string, knownUmas: Set<string>): UrlState {
  const p = new URLSearchParams(search);
  const uma = p.get('uma');
  const rawTurn = p.get('turn');
  const turn = rawTurn !== null && /^\d+$/.test(rawTurn) ? Number(rawTurn) : NaN;
  return { uma: uma && knownUmas.has(uma) ? uma : null, turn: isTurn(turn) ? turn : null };
}

export function serializeUrlState(s: UrlState): string {
  const p = new URLSearchParams();
  if (s.uma) p.set('uma', s.uma);
  if (s.turn !== null) p.set('turn', String(s.turn));
  const q = p.toString();
  return q ? `?${q}` : '';
}
