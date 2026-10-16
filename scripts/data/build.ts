// data/manual/*.json (a mano) → src/data/*.json validados. Se corre a mano: npm run data:build
// La lógica vive en src/data/manual.ts; acá solo se lee y se escribe.
import { readFile, writeFile } from 'node:fs/promises';
import { buildData, ManualDataError } from '../../src/data/manual';

const IN = new URL('../../data/manual/', import.meta.url);
const OUT = new URL('../../src/data/', import.meta.url);
const read = async (name: string): Promise<unknown> => JSON.parse(await readFile(new URL(name, IN), 'utf8'));
const today = new Date().toISOString().slice(0, 10);

try {
  const { races, characters, meta } = buildData({
    races: await read('races.json'), characters: await read('characters.json'), builtAt: today,
  });
  // Recién con todo validado se escribe.
  const write = (name: string, data: unknown) => writeFile(new URL(name, OUT), JSON.stringify(data, null, 1) + '\n');
  await write('races.json', races);
  await write('characters.json', characters);
  await write('meta.json', meta);
  console.log(`Listo: ${races.length} carreras, ${characters.length} Umas (${today}).`);
} catch (e) {
  if (e instanceof ManualDataError || e instanceof SyntaxError) {
    console.error(`Datos manuales inválidos:\n  ${e.message}`);
    process.exit(1);
  }
  throw e;
}
