import { GRADES, type Character, type Grade, type Objective, type Race } from '../data/types';

// Mismo orden que GRADES: G1 primero, Maiden al final.
export const GRADE_ORDER: readonly Grade[] = GRADES;

// Por grado y, a igual grado, por nombre.
export function compareRaces(a: Race, b: Race): number {
  return GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade) || a.name.localeCompare(b.name);
}

export function racesInTurn(races: Race[], turn: number): Race[] {
  return races.filter((r) => r.turns.includes(turn)).sort(compareRaces);
}

export interface TurnStatus { character: Character; objectives: Objective[] }
export interface TurnCharacters { busy: TurnStatus[]; maybe: TurnStatus[]; goal: TurnStatus[]; free: Character[] }

// Reparte las Umas en cuatro grupos disjuntos con prioridad busy > maybe > goal > free.
// "goal" = plazo de fans o de cantidad de carreras: no obliga a correr una carrera ese turno.
export function charactersInTurn(characters: Character[], turn: number): TurnCharacters {
  const out: TurnCharacters = { busy: [], maybe: [], goal: [], free: [] };
  for (const character of characters) {
    const here = character.objectives.filter((o) => o.turn === turn);
    const races = here.filter((o) => o.kind === 'race');
    const goals = here.filter((o) => o.kind !== 'race');
    const alt = character.objectives.filter((o) => o.kind === 'race' && o.alternatives.some((a) => a.turn === turn));
    if (races.length) out.busy.push({ character, objectives: races });
    else if (alt.length) out.maybe.push({ character, objectives: alt });
    else if (goals.length) out.goal.push({ character, objectives: goals });
    else out.free.push(character);
  }
  return out;
}

// Mismo orden de prioridad que charactersInTurn: main > alt > goal.
export function objectiveTurns(character: Character): { main: Set<number>; alt: Set<number>; goal: Set<number> } {
  const main = new Set<number>();
  for (const o of character.objectives) if (o.kind === 'race') main.add(o.turn);
  const alt = new Set<number>();
  for (const o of character.objectives) if (o.kind === 'race') for (const a of o.alternatives) if (!main.has(a.turn)) alt.add(a.turn);
  const goal = new Set<number>();
  for (const o of character.objectives) if (o.kind !== 'race' && !main.has(o.turn) && !alt.has(o.turn)) goal.add(o.turn);
  return { main, alt, goal };
}

export function charactersWithRace(characters: Character[], raceId: string): { character: Character; objective: Objective }[] {
  const out: { character: Character; objective: Objective }[] = [];
  for (const character of characters) for (const objective of character.objectives) {
    if (objective.kind !== 'race') continue;
    if (objective.raceIds.includes(raceId) || objective.alternatives.some((a) => a.raceIds.includes(raceId))) out.push({ character, objective });
  }
  return out;
}
