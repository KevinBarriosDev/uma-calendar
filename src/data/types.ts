export const GRADES = ['G1', 'G2', 'G3', 'OP', 'Pre-OP', 'Debut', 'Maiden'] as const;
export type Grade = (typeof GRADES)[number];
export type Surface = 'Turf' | 'Dirt';
export type DistanceCategory = 'Sprint' | 'Mile' | 'Medium' | 'Long';
export type Direction = 'Right' | 'Left' | 'Straight';

export interface Race {
  id: string;            // slug: "arima-kinen"
  name: string;
  grade: Grade;
  track: string | null;  // null = depende de la Uma (debut, maiden)
  surface: Surface | null;
  distance: number | null;
  category: DistanceCategory | null;
  direction: Direction | null;
  turns: number[];       // ordenados, 1–72
  verified: boolean;     // false = dato cargado pero sin confirmar contra el juego
}

export interface RaceObjective {
  kind: 'race'; order: number; turn: number; verified: boolean;
  raceIds: string[];     // más de una = "una de estas"
  place: number;         // 0 = correrla, 1 = ganarla, N = top N
  alternatives: { turn: number; raceIds: string[] }[];
}
export interface FansObjective { kind: 'fans'; order: number; turn: number; verified: boolean; fans: number }
export interface RaceCountObjective {
  kind: 'race-count'; order: number; turn: number; verified: boolean;
  minGrade: Grade; place: number; count: number;
}
export type Objective = RaceObjective | FansObjective | RaceCountObjective;

export interface Character {
  id: string;            // "special-week"
  name: string;
  releasedGlobal: string; // ISO, la primera versión en Global
  versions: string[];    // títulos: "[Special Dreamer]"
  objectives: Objective[]; // por order
  verified: boolean;     // true solo si hay objetivos y todos están verificados
}

export interface DataMeta { builtAt: string; sources: string[] }
