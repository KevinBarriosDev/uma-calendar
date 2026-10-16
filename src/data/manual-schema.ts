// Formato de los archivos escritos a mano en data/manual/. Se valida acá y
// manual.ts lo convierte al modelo público (types.ts / schema.ts).
import { z } from 'zod';
import { GRADES } from './types';
import { categoryFromDistance } from './category';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'tiene que ser un slug (minúsculas, números y guiones)');

// Momento de la carrera: año (1 Junior, 2 Classic, 3 Senior), mes y mitad.
export const whenSchema = z.strictObject({
  year: z.number().int().min(1).max(3),
  month: z.number().int().min(1).max(12),
  half: z.enum(['early', 'late']),
});
export type When = z.output<typeof whenSchema>;

const verificar = z.boolean({ error: 'falta "verificar" (true hasta confirmarlo con capturas del juego)' });

export const manualRaceSchema = z.strictObject({
  id: slug,
  name: z.string().min(1),
  grade: z.enum(GRADES),
  track: z.string().min(1).nullable(),
  surface: z.enum(['Turf', 'Dirt']).nullable(),
  distance: z.number().int().positive().nullable(),
  // Solo cuando no hay distancia (JBC): la wiki da la categoría. Con distancia se deriva.
  category: z.enum(['Sprint', 'Mile', 'Medium', 'Long']).optional(),
  direction: z.enum(['Right', 'Left', 'Straight']).nullable(),
  runs: z.array(whenSchema).min(1, 'tiene que correrse al menos una vez'),
  source: z.string().min(1),
  verificar,
}).superRefine((r, ctx) => {
  if (r.distance !== null && r.category !== undefined && r.category !== categoryFromDistance(r.distance)) {
    ctx.addIssue({
      code: 'custom', path: ['category'],
      message: `contradice la distancia ${r.distance} (daría ${categoryFromDistance(r.distance)}); borrá "category", se deriva sola`,
    });
  }
});
export type ManualRace = z.output<typeof manualRaceSchema>;

const alternative = z.strictObject({ when: whenSchema, races: z.array(slug).min(1) });

export const manualObjectiveSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('race'), when: whenSchema, races: z.array(slug).min(1),
    place: z.number().int().nonnegative(),
    alternatives: z.array(alternative).optional(),
    verificar,
  }),
  z.strictObject({
    kind: z.literal('fans'), when: whenSchema, fans: z.number().int().positive(), verificar,
  }),
  z.strictObject({
    kind: z.literal('race-count'), when: whenSchema, minGrade: z.enum(GRADES),
    place: z.number().int().positive(), count: z.number().int().positive(), verificar,
  }),
]);
export type ManualObjective = z.output<typeof manualObjectiveSchema>;

export const manualCharacterSchema = z.strictObject({
  id: slug,
  name: z.string().min(1),
  releasedGlobal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'tiene que ser una fecha ISO AAAA-MM-DD'),
  versions: z.array(z.string().min(1)),
  objectives: z.array(manualObjectiveSchema),
});
export type ManualCharacter = z.output<typeof manualCharacterSchema>;

export const manualRacesFileSchema = z.array(manualRaceSchema);
export const manualCharactersFileSchema = z.array(manualCharacterSchema);
