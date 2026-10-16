import { describe, expect, it } from 'vitest';
import type { Character, Race } from '../../src/data/types';
import { charactersInTurn, charactersWithRace, compareRaces, objectiveTurns, racesInTurn } from '../../src/lib/calendar';

const race = (id: string, grade: Race['grade'], turns: number[]): Race => ({
  id, verified: true, name: id, grade, track: 'Tokyo', surface: 'Turf', distance: 1600, category: 'Mile', direction: 'Left', turns,
});
const races = [race('op-race', 'OP', [54]), race('b-g1', 'G1', [54]), race('a-g1', 'G1', [54, 30]), race('g3', 'G3', [10])];

const chars: Character[] = [
  { id: 'busy', name: 'Busy', releasedGlobal: '2025-06-26', versions: [], verified: true, objectives: [
    { verified: true, kind: 'race', order: 1, turn: 54, raceIds: ['a-g1'], place: 1, alternatives: [] }] },
  { id: 'alt', name: 'Alt', releasedGlobal: '2025-06-26', versions: [], verified: true, objectives: [
    { verified: true, kind: 'race', order: 1, turn: 53, raceIds: ['op-race'], place: 5, alternatives: [{ turn: 54, raceIds: ['b-g1'] }] }] },
  { id: 'fans', name: 'Fans', releasedGlobal: '2025-06-26', versions: [], verified: true, objectives: [
    { verified: true, kind: 'fans', order: 1, turn: 54, fans: 5000 }] },
  { id: 'mix', name: 'Mix', releasedGlobal: '2025-06-26', versions: [], verified: true, objectives: [
    { verified: true, kind: 'fans', order: 1, turn: 54, fans: 9000 },
    { verified: true, kind: 'race', order: 2, turn: 54, raceIds: ['a-g1'], place: 1, alternatives: [] }] },
  { id: 'mixalt', name: 'MixAlt', releasedGlobal: '2025-06-26', versions: [], verified: true, objectives: [
    { verified: true, kind: 'race-count', order: 1, turn: 54, minGrade: 'G1', place: 1, count: 2 },
    { verified: true, kind: 'race', order: 2, turn: 53, raceIds: ['op-race'], place: 5, alternatives: [{ turn: 54, raceIds: ['b-g1'] }] }] },
  { id: 'free', name: 'Free', releasedGlobal: '2025-06-26', versions: [], verified: true, objectives: [] },
];

describe('calendario', () => {
  it('carreras del turno, G1 primero y por nombre', () => {
    expect(racesInTurn(races, 54).map((r) => r.id)).toEqual(['a-g1', 'b-g1', 'op-race']);
    expect(racesInTurn(races, 1)).toEqual([]);
  });

  it('compareRaces ordena por grado y después por nombre', () => {
    const sorted = [race('z', 'Maiden', []), race('m', 'G2', []), race('y', 'G1', []), race('x', 'G1', [])].sort(compareRaces);
    expect(sorted.map((r) => r.id)).toEqual(['x', 'y', 'm', 'z']);
  });

  it('ocupadas, posibles (alternativa), meta con plazo y libres', () => {
    const t = charactersInTurn(chars, 54);
    expect(t.busy.map((s) => s.character.id)).toEqual(['busy', 'mix']);
    expect(t.maybe.map((s) => s.character.id)).toEqual(['alt', 'mixalt']);
    expect(t.goal.map((s) => s.character.id)).toEqual(['fans']);
    expect(t.free.map((c) => c.id)).toEqual(['free']);
  });

  it('un objetivo de carrera en el mismo turno gana sobre la meta (busy) y la meta no se muestra', () => {
    const t = charactersInTurn(chars, 54);
    expect(t.goal.find((s) => s.character.id === 'mix')).toBeUndefined();
    expect(t.busy.find((s) => s.character.id === 'mix')!.objectives.map((o) => o.kind)).toEqual(['race']);
  });

  it('una alternativa en el turno gana sobre la meta (maybe > goal)', () => {
    const t = charactersInTurn(chars, 54);
    expect(t.goal.find((s) => s.character.id === 'mixalt')).toBeUndefined();
  });

  it('la partición es exhaustiva y disjunta en todos los turnos', () => {
    for (let turn = 1; turn <= 72; turn++) {
      const t = charactersInTurn(chars, turn);
      const ids = [...t.busy, ...t.maybe, ...t.goal].map((s) => s.character.id).concat(t.free.map((c) => c.id));
      expect(ids.sort(), `turno ${turn}`).toEqual(chars.map((c) => c.id).sort());
    }
  });

  it('turnos de una Uma, separando alternativas', () => {
    expect(objectiveTurns(chars[1]!)).toEqual({ main: new Set([53]), alt: new Set([54]), goal: new Set() });
  });

  it('turnos con meta (fans, cantidad de carreras) van aparte, salvo que haya carrera o alternativa', () => {
    expect(objectiveTurns(chars[2]!)).toEqual({ main: new Set(), alt: new Set(), goal: new Set([54]) });
    expect(objectiveTurns(chars[3]!)).toEqual({ main: new Set([54]), alt: new Set(), goal: new Set() });
    expect(objectiveTurns(chars[4]!)).toEqual({ main: new Set([53]), alt: new Set([54]), goal: new Set() });
  });

  it('Umas que tienen una carrera de objetivo (también como alternativa)', () => {
    expect(charactersWithRace(chars, 'b-g1').map((x) => x.character.id)).toEqual(['alt', 'mixalt']);
    expect(charactersWithRace(chars, 'a-g1').map((x) => x.character.id)).toEqual(['busy', 'mix']);
  });
});
