import { describe, expect, it } from 'vitest';
import { characters, races, racesById } from '../../src/data';
import { charactersFileSchema, racesFileSchema } from '../../src/data/schema';

describe('datos generados', () => {
  it('cumplen el schema', () => {
    expect(() => racesFileSchema.parse(races)).not.toThrow();
    expect(() => charactersFileSchema.parse(characters)).not.toThrow();
  });

  it('ids únicos', () => {
    expect(new Set(races.map((r) => r.id)).size).toBe(races.length);
    expect(new Set(characters.map((c) => c.id)).size).toBe(characters.length);
  });

  it('cada objetivo apunta a carreras que existen', () => {
    for (const c of characters) for (const o of c.objectives) {
      if (o.kind !== 'race') continue;
      for (const id of [...o.raceIds, ...o.alternatives.flatMap((a) => a.raceIds)]) expect(racesById.has(id), `${c.name}: ${id}`).toBe(true);
    }
  });

  it('el turno de cada objetivo y alternativa coincide con los turnos de alguna de sus carreras', () => {
    for (const c of characters) for (const o of c.objectives) {
      if (o.kind !== 'race') continue;
      expect(o.raceIds.some((id) => racesById.get(id)?.turns.includes(o.turn)), `${c.name}: objetivo turno ${o.turn}`).toBe(true);
      for (const a of o.alternatives) {
        expect(a.raceIds.some((id) => racesById.get(id)?.turns.includes(a.turn)), `${c.name}: alternativa turno ${a.turn}`).toBe(true);
      }
    }
  });

  it('los objetivos van numerados 1, 2, 3… sin saltos', () => {
    for (const c of characters) expect(c.objectives.map((o) => o.order), c.name).toEqual(c.objectives.map((_, i) => i + 1));
  });

  it('casos conocidos de carreras', () => {
    expect(racesById.get('arima-kinen')?.turns).toEqual([48, 72]);
    expect(racesById.get('osaka-hai')?.turns).toEqual([54]);
    expect(racesById.get('junior-make-debut')?.turns).toEqual([12]);
    expect(racesById.get('junior-maiden-race')?.turns).toEqual([13]);
    expect(racesById.get('tokyo-yushun-japanese-derby')?.turns).toEqual([34]);
    expect(racesById.get('tenno-sho-spring')?.turns).toEqual([57]);
    expect(racesById.get('hopeful-stakes')?.turns).toEqual([24]);
    expect(racesById.get('jbc-sprint')).toMatchObject({ distance: null, category: 'Sprint', turns: [45, 69] });
  });

  it('la tabla G1 de umamusu.wiki está completa', () => {
    expect(races.filter((r) => r.grade === 'G1')).toHaveLength(34);
  });

  it('casos conocidos de Umas', () => {
    const sw = characters.find((c) => c.id === 'special-week');
    expect(sw?.objectives.find((o) => o.kind === 'race' && o.raceIds.includes('tokyo-yushun-japanese-derby'))).toMatchObject({ turn: 34, place: 1 });
    expect(characters.map((c) => c.id)).toEqual(['fine-motion', 'mejiro-mcqueen', 'special-week', 'symboli-rudolf', 'taiki-shuttle', 'tokai-teio']);
  });

  it('hay datos', () => {
    expect(races.length).toBeGreaterThan(0);
    expect(characters.length).toBeGreaterThan(0);
  });
});
