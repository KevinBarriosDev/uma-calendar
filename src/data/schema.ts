import { z } from 'zod';
import { GRADES, type Character, type Objective, type Race } from './types';

const turn = z.number().int().min(1).max(72);
const grade = z.enum(GRADES);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const raceSchema = z.object({
  id: slug,
  name: z.string().min(1),
  grade,
  track: z.string().min(1).nullable(),
  surface: z.enum(['Turf', 'Dirt']).nullable(),
  distance: z.number().int().positive().nullable(),
  category: z.enum(['Sprint', 'Mile', 'Medium', 'Long']).nullable(),
  direction: z.enum(['Right', 'Left', 'Straight']).nullable(),
  // Estrictamente ascendentes: sin repetidos ni desorden.
  turns: z.array(turn).min(1).refine(
    (ts) => ts.every((t, i) => i === 0 || ts[i - 1] < t),
    'turns debe ser estrictamente ascendente',
  ),
  verified: z.boolean(),
});

export const objectiveSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('race'), order: z.number().int().positive(), turn, verified: z.boolean(),
    raceIds: z.array(slug).min(1),
    place: z.number().int().nonnegative(),
    alternatives: z.array(z.object({ turn, raceIds: z.array(slug).min(1) })),
  }),
  z.object({ kind: z.literal('fans'), order: z.number().int().positive(), turn, verified: z.boolean(), fans: z.number().int().positive() }),
  z.object({
    kind: z.literal('race-count'), order: z.number().int().positive(), turn, verified: z.boolean(),
    minGrade: grade, place: z.number().int().positive(), count: z.number().int().positive(),
  }),
]);

export const characterSchema = z.object({
  id: slug,
  name: z.string().min(1),
  releasedGlobal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  versions: z.array(z.string()),
  objectives: z.array(objectiveSchema),
  verified: z.boolean(),
});

// Guardas de compilación: el tipo inferido de cada schema debe ser idéntico
// a la interfaz de types.ts. Si divergen, `npm run check` falla.
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type RaceSchemaMatches = Assert<Equals<z.output<typeof raceSchema>, Race>>;
export type ObjectiveSchemaMatches = Assert<Equals<z.output<typeof objectiveSchema>, Objective>>;
export type CharacterSchemaMatches = Assert<Equals<z.output<typeof characterSchema>, Character>>;

export const racesFileSchema = z.array(raceSchema);
export const charactersFileSchema = z.array(characterSchema);
export const metaSchema = z.object({ builtAt: z.string(), sources: z.array(z.string().min(1)).min(1) });
