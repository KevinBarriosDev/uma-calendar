import { describe, expect, it } from 'vitest';
import { buildData, categoryFromDistance } from '../../src/data/manual';

const arima = {
  id: 'arima-kinen', name: 'Arima Kinen', grade: 'G1', track: 'Nakayama', surface: 'Turf', distance: 2500, direction: null,
  runs: [{ year: 3, month: 12, half: 'late' }, { year: 2, month: 12, half: 'late' }], source: 'umamusu.wiki', verificar: false,
};
const debut = {
  id: 'junior-make-debut', name: 'Junior Make Debut', grade: 'Debut', track: null, surface: null, distance: null, direction: null,
  runs: [{ year: 1, month: 6, half: 'late' }], source: 'umamusu.wiki', verificar: false,
};
const satsuki = {
  id: 'satsuki-sho', name: 'Satsuki Sho', grade: 'G1', track: 'Nakayama', surface: 'Turf', distance: 2000, direction: null,
  runs: [{ year: 2, month: 4, half: 'early' }], source: 'umamusu.wiki', verificar: true,
};
const jbc = {
  id: 'jbc-classic', name: 'JBC Classic', grade: 'G1', track: null, surface: 'Dirt', distance: null, category: 'Medium', direction: null,
  runs: [{ year: 3, month: 11, half: 'early' }], source: 'umamusu.wiki', verificar: true,
};
const races = [arima, debut, satsuki, jbc];

const uma = (objectives: unknown[], extra: Record<string, unknown> = {}) => ({
  id: 'special-week', name: 'Special Week', releasedGlobal: '2025-06-26', versions: ['[Special Dreamer]'], objectives, ...extra,
});
const raceObj = (extra: Record<string, unknown> = {}) => ({
  kind: 'race', when: { year: 1, month: 6, half: 'late' }, races: ['junior-make-debut'], place: 0, verificar: true, ...extra,
});

const build = (chars: unknown[], rs: unknown[] = races) => buildData({ races: rs, characters: chars, builtAt: '2026-10-16' });

describe('categoryFromDistance', () => {
  it('corta en 1400, 1800 y 2400', () => {
    expect(categoryFromDistance(1200)).toBe('Sprint');
    expect(categoryFromDistance(1400)).toBe('Sprint');
    expect(categoryFromDistance(1600)).toBe('Mile');
    expect(categoryFromDistance(1800)).toBe('Mile');
    expect(categoryFromDistance(2000)).toBe('Medium');
    expect(categoryFromDistance(2400)).toBe('Medium');
    expect(categoryFromDistance(2500)).toBe('Long');
  });
});

describe('buildData: carreras', () => {
  const out = build([]).races;

  it('convierte year/month/half a turno y ordena los turnos', () => {
    expect(out.find((r) => r.id === 'arima-kinen')!.turns).toEqual([48, 72]);
    expect(out.find((r) => r.id === 'junior-make-debut')!.turns).toEqual([12]);
    expect(out.find((r) => r.id === 'satsuki-sho')!.turns).toEqual([31]);
  });

  it('deriva la categoría de la distancia', () => {
    expect(out.find((r) => r.id === 'arima-kinen')!.category).toBe('Long');
    expect(out.find((r) => r.id === 'satsuki-sho')!.category).toBe('Medium');
  });

  it('sin distancia usa la categoría explícita, o null', () => {
    expect(out.find((r) => r.id === 'jbc-classic')!.category).toBe('Medium');
    expect(out.find((r) => r.id === 'junior-make-debut')!.category).toBeNull();
  });

  it('verified es lo contrario de verificar y no quedan campos manuales', () => {
    expect(out.find((r) => r.id === 'arima-kinen')!.verified).toBe(true);
    expect(out.find((r) => r.id === 'satsuki-sho')!.verified).toBe(false);
    expect(Object.keys(out[0]!)).not.toContain('runs');
    expect(Object.keys(out[0]!)).not.toContain('source');
  });

  it('ordena por primer turno y luego por nombre', () => {
    expect(out.map((r) => r.id)).toEqual(['junior-make-debut', 'satsuki-sho', 'arima-kinen', 'jbc-classic']);
  });

  it('rechaza ids repetidos y turnos repetidos con el archivo y el id', () => {
    expect(() => build([], [arima, arima])).toThrow(/races\.json.*arima-kinen/);
    expect(() => build([], [{ ...arima, runs: [arima.runs[0], arima.runs[0]] }])).toThrow(/races\.json.*arima-kinen/);
  });

  it('un campo mal escrito dice archivo, carrera y campo', () => {
    expect(() => build([], [{ ...arima, grade: 'G4' }])).toThrow(/races\.json.*arima-kinen.*grade/);
    expect(() => build([], [{ ...arima, runs: [{ year: 4, month: 1, half: 'late' }] }])).toThrow(/races\.json.*arima-kinen.*runs/);
  });

  it('rechaza una categoría explícita que contradice la distancia', () => {
    expect(() => build([], [{ ...arima, category: 'Sprint' }])).toThrow(/arima-kinen.*category/);
  });
});

describe('buildData: Umas', () => {
  it('numera los objetivos por posición y convierte el turno', () => {
    const [c] = build([uma([
      raceObj(),
      { kind: 'fans', when: { year: 2, month: 9, half: 'early' }, fans: 30000, verificar: true },
      { kind: 'race-count', when: { year: 3, month: 6, half: 'late' }, minGrade: 'G1', place: 3, count: 2, verificar: false },
    ])]).characters;
    expect(c!.objectives).toEqual([
      { kind: 'race', order: 1, turn: 12, verified: false, raceIds: ['junior-make-debut'], place: 0, alternatives: [] },
      { kind: 'fans', order: 2, turn: 41, verified: false, fans: 30000 },
      { kind: 'race-count', order: 3, turn: 60, verified: true, minGrade: 'G1', place: 3, count: 2 },
    ]);
    expect(c!.versions).toEqual(['[Special Dreamer]']);
  });

  it('soporta alternativas', () => {
    const [c] = build([uma([raceObj({
      when: { year: 2, month: 4, half: 'early' }, races: ['satsuki-sho'], place: 3,
      alternatives: [{ when: { year: 3, month: 12, half: 'late' }, races: ['arima-kinen'] }],
    })])]).characters;
    expect(c!.objectives[0]).toMatchObject({ turn: 31, alternatives: [{ turn: 72, raceIds: ['arima-kinen'] }] });
  });

  it('la Uma está verificada solo si tiene objetivos y todos lo están', () => {
    const all = build([uma([raceObj({ verificar: false })])]).characters[0]!;
    const some = build([uma([raceObj({ verificar: false }), raceObj({ verificar: true })])]).characters[0]!;
    const none = build([uma([])]).characters[0]!;
    expect(all.verified).toBe(true);
    expect(some.verified).toBe(false);
    expect(none.verified).toBe(false);
  });

  it('ordena las Umas por nombre', () => {
    const a = { ...uma([]), id: 'b-uma', name: 'B Uma' };
    const b = { ...uma([]), id: 'a-uma', name: 'A Uma' };
    expect(build([a, b]).characters.map((c) => c.id)).toEqual(['a-uma', 'b-uma']);
  });

  it('carrera inexistente: corta con la Uma, el número de objetivo y el id', () => {
    expect(() => build([uma([raceObj(), raceObj({ races: ['no-existe'] })])])).toThrow(/Special Week.*objetivo 2.*no-existe/);
  });

  it('alternativa con carrera inexistente: también corta con los datos', () => {
    expect(() => build([uma([raceObj({ alternatives: [{ when: { year: 1, month: 7, half: 'early' }, races: ['nada'] }] })])]))
      .toThrow(/Special Week.*objetivo 1.*alternativa.*nada/);
  });

  it('el turno del objetivo tiene que coincidir con alguna de sus carreras', () => {
    expect(() => build([uma([raceObj({ when: { year: 1, month: 7, half: 'early' } })])])).toThrow(/Special Week.*objetivo 1.*turno 13/);
    expect(() => build([uma([raceObj({ alternatives: [{ when: { year: 1, month: 7, half: 'early' }, races: ['junior-make-debut'] }] })])]))
      .toThrow(/Special Week.*objetivo 1.*alternativa.*turno 13/);
  });

  it('un campo inválido dice archivo, Uma, objetivo y campo', () => {
    expect(() => build([uma([raceObj({ place: -1 })])])).toThrow(/characters\.json.*Special Week.*objetivo 1.*place/);
    expect(() => build([uma([{ kind: 'fans', when: { year: 1, month: 1, half: 'mid' }, fans: 1, verificar: true }])]))
      .toThrow(/characters\.json.*Special Week.*objetivo 1.*half/);
    expect(() => build([uma([raceObj({ verificar: undefined })])])).toThrow(/Special Week.*objetivo 1.*verificar/);
  });

  it('ids de Umas repetidos cortan', () => {
    expect(() => build([uma([]), uma([])])).toThrow(/characters\.json.*special-week/);
  });
});

describe('buildData: meta', () => {
  it('lleva la fecha y las fuentes de las carreras', () => {
    const { meta } = build([]);
    expect(meta.builtAt).toBe('2026-10-16');
    expect(meta.sources).toEqual(['umamusu.wiki']);
  });
});
