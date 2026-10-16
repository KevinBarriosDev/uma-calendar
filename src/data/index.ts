import type { Character, DataMeta, Race } from './types';
import racesJson from './races.json';
import charactersJson from './characters.json';
import metaJson from './meta.json';

export const races = racesJson as Race[];
export const characters = charactersJson as Character[];
export const meta = metaJson as DataMeta;
export const racesById = new Map(races.map((r) => [r.id, r]));
export const charactersById = new Map(characters.map((c) => [c.id, c]));
