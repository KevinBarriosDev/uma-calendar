import { describe, expect, it } from 'vitest';
import type { Race } from '../../src/data/types';
import { gradeClass, objectiveText, placeText, raceMeta } from '../../src/lib/format';

const takamatsu: Race = { id: 'takamatsunomiya-kinen', verified: true, name: 'Takamatsunomiya Kinen', grade: 'G1',
  track: 'Chukyo', surface: 'Turf', distance: 1200, category: 'Sprint', direction: 'Left', turns: [54] };
const debut: Race = { id: 'junior-make-debut', verified: true, name: 'Junior Make Debut', grade: 'Debut',
  track: null, surface: null, distance: null, category: null, direction: null, turns: [12] };
const byId = new Map([[takamatsu.id, takamatsu], [debut.id, debut]]);

describe('textos', () => {
  it('ficha de carrera', () => {
    expect(raceMeta(takamatsu)).toBe('Chukyo · Turf 1200m · Sprint · Left');
    expect(raceMeta(debut)).toBe('Track and distance vary by Uma');
  });

  it('puesto', () => {
    expect([0, 1, 3].map(placeText)).toEqual(['Enter', 'Win', 'Top 3']);
  });

  it('objetivos', () => {
    expect(objectiveText({ kind: 'race', order: 1, turn: 12, verified: true, raceIds: ['junior-make-debut'], place: 0, alternatives: [] }, byId)).toBe('Enter Junior Make Debut');
    expect(objectiveText({ kind: 'race', order: 2, turn: 54, verified: true, raceIds: ['takamatsunomiya-kinen', 'junior-make-debut'], place: 1, alternatives: [] }, byId))
      .toBe('Win one of: Takamatsunomiya Kinen, Junior Make Debut');
    expect(objectiveText({ kind: 'fans', order: 3, turn: 24, verified: true, fans: 5000 }, byId)).toBe('Reach 5,000 fans');
    expect(objectiveText({ kind: 'race-count', order: 4, turn: 60, verified: true, minGrade: 'G1', place: 3, count: 2 }, byId)).toBe('Top 3 in 2 G1 races');
    expect(objectiveText({ kind: 'race-count', order: 5, turn: 49, verified: true, minGrade: 'G3', place: 1, count: 1 }, byId)).toBe('Win 1 G3 or higher race');
  });

  it('clase CSS del grado (Pre-OP queda en pre-op)', () => {
    expect(gradeClass('G1')).toBe('grade grade--g1');
    expect(gradeClass('Pre-OP')).toBe('grade grade--pre-op');
  });
});
