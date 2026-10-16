import { describe, expect, it } from 'vitest';
import { parseUrlState, serializeUrlState } from '../../src/lib/url-state';

const umas = new Set(['special-week']);

describe('estado en la URL', () => {
  it('lee valores válidos', () => {
    expect(parseUrlState('?uma=special-week&turn=48', umas)).toEqual({ uma: 'special-week', turn: 48 });
  });

  it('ignora lo inválido sin romper', () => {
    for (const q of ['?uma=foo&turn=99', '?turn=abc', '?turn=0', '?turn=1.5', '?turn=73', '?turn=-3', '?turn=1e3', '', '?uma=']) {
      expect(parseUrlState(q, umas)).toEqual({ uma: null, turn: null });
    }
    expect(parseUrlState('?uma=foo&turn=12', umas)).toEqual({ uma: null, turn: 12 });
  });

  it('no lanza con basura en el query', () => {
    for (const q of ['?%E0%A4%A', '?uma=%ZZ&turn=%', '?&&==&', '?turn=99999999999999999999999', '?uma=__proto__&turn=toString']) {
      expect(() => parseUrlState(q, umas)).not.toThrow();
      expect(parseUrlState(q, umas)).toEqual({ uma: null, turn: null });
    }
  });

  it('escribe solo lo que hay', () => {
    expect(serializeUrlState({ uma: null, turn: null })).toBe('');
    expect(serializeUrlState({ uma: 'special-week', turn: null })).toBe('?uma=special-week');
    expect(serializeUrlState({ uma: 'special-week', turn: 48 })).toBe('?uma=special-week&turn=48');
  });
});
