// Conversión pura: data/manual/*.json (a mano) → modelo público validado. Sin disco ni red.
import type { z } from 'zod';
import { charactersFileSchema, metaSchema, racesFileSchema } from './schema';
import {
  manualCharactersFileSchema, manualRacesFileSchema,
  type ManualCharacter, type ManualObjective, type ManualRace, type When,
} from './manual-schema';
import type { Character, DataMeta, Objective, Race } from './types';
import { toTurn, type Year } from '../lib/turn';

export { categoryFromDistance } from './category';
import { categoryFromDistance } from './category';

export const RACES_FILE = 'data/manual/races.json';
export const CHARACTERS_FILE = 'data/manual/characters.json';

export interface ManualInput { races: unknown; characters: unknown; builtAt: string }
export interface BuiltData { races: Race[]; characters: Character[]; meta: DataMeta }

export class ManualDataError extends Error {}

const fail = (file: string, detail: string): never => {
  throw new ManualDataError(`${file}: ${detail}`);
};

// Nombre legible de una entrada cruda, para ubicar el error en el archivo.
function label(entry: unknown, index: number): string {
  const e = (entry ?? {}) as { name?: unknown; id?: unknown };
  const name = typeof e.name === 'string' ? `"${e.name}"` : null;
  const id = typeof e.id === 'string' ? `[${e.id}]` : null;
  const who = [name, id].filter(Boolean).join(' ');
  return who ? `${who} (entrada ${index + 1})` : `entrada ${index + 1}`;
}

function describeIssue(issue: z.core.$ZodIssue, raw: unknown, isCharacters: boolean): string {
  const path = issue.path;
  const root = typeof path[0] === 'number' ? path[0] : null;
  if (root === null) return `${path.join('.') || 'archivo'}: ${issue.message}`;
  const entry = Array.isArray(raw) ? raw[root] : undefined;
  const parts = [label(entry, root)];
  let rest = path.slice(1);
  if (isCharacters && rest[0] === 'objectives' && typeof rest[1] === 'number') {
    parts.push(`objetivo ${rest[1] + 1}`);
    rest = rest.slice(2);
  }
  const field = rest.map((p) => (typeof p === 'number' ? `[${p}]` : `.${String(p)}`)).join('').replace(/^\./, '');
  return `${parts.join(', ')}, campo ${field || '(entrada)'}: ${issue.message}`;
}

function parseFile<T>(file: string, schema: z.ZodType<T>, raw: unknown, isCharacters: boolean): T {
  const res = schema.safeParse(raw);
  if (res.success) return res.data;
  return fail(file, res.error.issues.map((i) => describeIssue(i, raw, isCharacters)).join('\n  '));
}

// El schema ya garantiza year 1-3, por eso el cast.
const turnOf = (w: When): number => toTurn({ year: w.year as Year, month: w.month, half: w.half === 'early' ? 1 : 2 });

function convertRaces(manual: ManualRace[]): { races: Race[]; sources: string[] } {
  const seen = new Set<string>();
  const races: Race[] = manual.map((m, i) => {
    if (seen.has(m.id)) fail(RACES_FILE, `${label(m, i)}: id repetido "${m.id}"`);
    seen.add(m.id);
    const turns = m.runs.map(turnOf).sort((a, b) => a - b);
    const dup = turns.find((t, k) => k > 0 && turns[k - 1] === t);
    if (dup !== undefined) fail(RACES_FILE, `${label(m, i)}, campo runs: el turno ${dup} está repetido`);
    return {
      id: m.id, name: m.name, grade: m.grade, track: m.track, surface: m.surface, distance: m.distance,
      category: m.distance !== null ? categoryFromDistance(m.distance) : (m.category ?? null),
      direction: m.direction, turns, verified: !m.verificar,
    };
  });
  races.sort((a, b) => a.turns[0]! - b.turns[0]! || a.name.localeCompare(b.name));
  return { races, sources: [...new Set(manual.map((m) => m.source))].sort() };
}

function convertObjective(m: ManualObjective, order: number, who: string, racesById: Map<string, Race>): Objective {
  const at = (n: number) => `${who}, objetivo ${n}`;
  const turn = turnOf(m.when);
  const verified = !m.verificar;
  if (m.kind === 'fans') return { kind: 'fans', order, turn, verified, fans: m.fans };
  if (m.kind === 'race-count') return { kind: 'race-count', order, turn, verified, minGrade: m.minGrade, place: m.place, count: m.count };

  const check = (ids: string[], t: number, what: string) => {
    for (const id of ids) {
      if (!racesById.has(id)) fail(CHARACTERS_FILE, `${at(order)}${what}: la carrera "${id}" no existe en races.json`);
    }
    if (!ids.some((id) => racesById.get(id)!.turns.includes(t))) {
      fail(CHARACTERS_FILE, `${at(order)}${what}: el turno ${t} no coincide con ninguna de sus carreras (${ids.join(', ')})`);
    }
  };
  check(m.races, turn, '');
  const alternatives = (m.alternatives ?? []).map((a) => {
    const t = turnOf(a.when);
    check(a.races, t, ' (alternativa)');
    return { turn: t, raceIds: a.races };
  });
  return { kind: 'race', order, turn, verified, raceIds: m.races, place: m.place, alternatives };
}

function convertCharacters(manual: ManualCharacter[], racesById: Map<string, Race>): Character[] {
  const seen = new Set<string>();
  const chars = manual.map((m, i) => {
    if (seen.has(m.id)) fail(CHARACTERS_FILE, `${label(m, i)}: id repetido "${m.id}"`);
    seen.add(m.id);
    const objectives = m.objectives.map((o, k) => convertObjective(o, k + 1, m.name, racesById));
    return {
      id: m.id, name: m.name, releasedGlobal: m.releasedGlobal, versions: m.versions, objectives,
      verified: objectives.length > 0 && objectives.every((o) => o.verified),
    };
  });
  return chars.sort((a, b) => a.name.localeCompare(b.name));
}

export function buildData(input: ManualInput): BuiltData {
  const manualRaces = parseFile(RACES_FILE, manualRacesFileSchema, input.races, false);
  const manualChars = parseFile(CHARACTERS_FILE, manualCharactersFileSchema, input.characters, true);
  const { races, sources } = convertRaces(manualRaces);
  const characters = convertCharacters(manualChars, new Map(races.map((r) => [r.id, r])));
  // Red de seguridad: la salida cumple el schema público de siempre.
  return {
    races: racesFileSchema.parse(races),
    characters: charactersFileSchema.parse(characters),
    meta: metaSchema.parse({ builtAt: input.builtAt, sources }),
  };
}
