import { describe, expect, it } from 'vitest';
import { TURN_COUNT, fromTurn, isTurn, toTurn, turnLabel, turnsOfYear } from '../../src/lib/turn';

describe('turnos', () => {
  it('ida y vuelta en los 72 turnos', () => {
    for (let t = 1; t <= TURN_COUNT; t++) expect(toTurn(fromTurn(t))).toBe(t);
  });

  it('valores conocidos', () => {
    expect(toTurn({ year: 1, month: 6, half: 2 })).toBe(12); // debut
    expect(toTurn({ year: 2, month: 12, half: 2 })).toBe(48); // Arima Kinen, Classic
    expect(toTurn({ year: 3, month: 12, half: 2 })).toBe(72); // Arima Kinen, Senior
    expect(fromTurn(1)).toEqual({ year: 1, month: 1, half: 1 });
    expect(fromTurn(54)).toEqual({ year: 3, month: 3, half: 2 });
  });

  it('etiquetas en inglés', () => {
    expect(turnLabel(54)).toBe('Senior · Late March');
    expect(turnLabel(1)).toBe('Junior · Early January');
  });

  it('turnos de un año', () => {
    expect(turnsOfYear(2)).toEqual(Array.from({ length: 24 }, (_, i) => 25 + i));
  });

  it('rechaza valores fuera de rango', () => {
    for (const bad of [0, 73, 1.5, NaN, '12', null]) expect(isTurn(bad)).toBe(false);
    expect(() => fromTurn(73)).toThrow(RangeError);
    expect(() => toTurn({ year: 1, month: 13, half: 1 } as never)).toThrow(RangeError);
  });
});
