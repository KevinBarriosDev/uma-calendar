import { describe, expect, it } from 'vitest';
import { characterSchema, raceSchema } from '../../src/data/schema';

const race = {
  id: 'arima-kinen', verified: true, name: 'Arima Kinen', grade: 'G1', track: 'Nakayama',
  surface: 'Turf', distance: 2500, category: 'Long', direction: 'Right', turns: [48, 72],
};

describe('schema', () => {
  it('acepta una carrera válida', () => {
    expect(raceSchema.parse(race)).toEqual(race);
  });

  it('rechaza turnos fuera de 1–72 y grados desconocidos', () => {
    expect(() => raceSchema.parse({ ...race, turns: [73] })).toThrow();
    expect(() => raceSchema.parse({ ...race, grade: 'G4' })).toThrow();
  });

  it('rechaza turnos repetidos o desordenados', () => {
    expect(() => raceSchema.parse({ ...race, turns: [48, 48] })).toThrow();
    expect(() => raceSchema.parse({ ...race, turns: [72, 48] })).toThrow();
  });

  it('acepta los tres tipos de objetivo', () => {
    const c = {
      id: 'oguri-cap', name: 'Oguri Cap', releasedGlobal: '2025-06-26', versions: ['[Starlight Beat]'], verified: true,
      objectives: [
        { verified: true, kind: 'race', order: 1, turn: 12, raceIds: ['junior-make-debut'], place: 0, alternatives: [] },
        { verified: true, kind: 'fans', order: 2, turn: 24, fans: 3000 },
        { verified: true, kind: 'race-count', order: 6, turn: 60, minGrade: 'G1', place: 3, count: 2 },
      ],
    };
    expect(characterSchema.parse(c)).toEqual(c);
  });

  it('rechaza un objetivo de carrera sin carreras', () => {
    const bad = { id: 'x', name: 'X', releasedGlobal: '2025-06-26', versions: [], verified: true,
      objectives: [{ verified: true, kind: 'race', order: 1, turn: 12, raceIds: [], place: 0, alternatives: [] }] };
    expect(() => characterSchema.parse(bad)).toThrow();
  });
});
