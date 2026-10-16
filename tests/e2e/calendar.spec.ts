import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const races: { turns: number[] }[] = JSON.parse(readFileSync('src/data/races.json', 'utf-8'));
const characters: { id: string; name: string; objectives: { kind: string; turn: number; verified: boolean; alternatives?: { turn: number }[] }[] }[] =
  JSON.parse(readFileSync('src/data/characters.json', 'utf-8'));

// Va a una URL del calendario y espera a que la isla React esté hidratada.
async function gotoCalendar(page: Page, url: string) {
  await page.goto(url);
  await page.waitForSelector('astro-island:not([ssr])', { state: 'attached' });
}

// En celular los años son pestañas; en escritorio se ven los tres a la vez.
async function openYear(page: Page, name: 'Junior' | 'Classic' | 'Senior') {
  const tab = page.getByRole('tab', { name });
  if (await tab.isVisible()) await tab.click();
}

test('sin scroll horizontal en ningún año, con el turno más cargado abierto', async ({ page }) => {
  const years = [
    { name: 'Junior' as const, from: 1, to: 24 },
    { name: 'Classic' as const, from: 25, to: 48 },
    { name: 'Senior' as const, from: 49, to: 72 },
  ];
  await gotoCalendar(page, '/');
  for (const year of years) {
    // Turno con más carreras dentro del año, calculado desde los datos reales
    const counts = new Map<number, number>();
    for (const race of races) {
      for (const t of race.turns) {
        if (t >= year.from && t <= year.to) counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    const [busiest] = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
    await openYear(page, year.name);
    await page.locator(`[data-turn="${busiest}"]`).click();
    await expect(page.getByTestId('turn-detail')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${year.name} turno ${busiest}`).toBeLessThanOrEqual(0);
  }
});

test('tocar un turno muestra sus carreras y Umas', async ({ page }) => {
  await gotoCalendar(page, '/');
  await openYear(page, 'Senior');
  await page.locator('[data-turn="54"]').click();
  const detail = page.getByTestId('turn-detail');
  await expect(detail).toBeVisible();
  await expect(detail.getByRole('heading', { name: 'Senior · Late March' })).toBeVisible();
  await expect(page.getByTestId('free-list').locator('a').first()).toBeVisible();
  await expect(page).toHaveURL(/turn=54/);
});

test('elegir una Uma marca sus turnos', async ({ page }) => {
  await gotoCalendar(page, '/');
  await page.getByLabel('Uma', { exact: true }).fill('Special Week');
  await expect(page).toHaveURL(/uma=special-week/);
  await expect(page.locator('[data-turn="12"]')).toHaveClass(/is-objective/);
});

test('un link compartido restaura el estado', async ({ page }) => {
  await gotoCalendar(page, '/?uma=special-week&turn=48');
  await expect(page.getByTestId('turn-detail').getByRole('heading', { name: 'Classic · Late December' })).toBeVisible();
  await expect(page.getByLabel('Uma', { exact: true })).toHaveValue('Special Week');
});

test('valores inválidos en el link no rompen nada', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await gotoCalendar(page, '/?uma=foo&turn=99');
  await expect(page.locator('[data-turn="1"]')).toBeVisible();
  await expect(page.getByTestId('turn-detail')).toHaveCount(0);
  await expect(page.getByLabel('Uma', { exact: true })).toHaveValue('');
  await expect(page.locator('[data-turn].is-selected')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('atrás vuelve al turno anterior', async ({ page }) => {
  await gotoCalendar(page, '/');
  await openYear(page, 'Senior');
  await page.locator('[data-turn="54"]').click();
  await page.locator('[data-turn="56"]').click();
  await expect(page).toHaveURL(/turn=56/);
  await page.goBack();
  await expect(page).toHaveURL(/turn=54/);
  await expect(page.locator('[data-turn="54"]')).toHaveClass(/is-selected/);
});

test('páginas de Uma y de carrera', async ({ page }) => {
  await page.goto('/races/arima-kinen/');
  await expect(page.getByRole('link', { name: 'Classic · Late December' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Senior · Late December' })).toBeVisible();
  await page.goto('/characters/special-week/');
  await expect(page.getByRole('heading', { name: 'Special Week', level: 1 })).toBeVisible();
});

test('una Uma con alternativa marca ese turno como posible', async ({ page }) => {
  // La Uma sale de los datos: si ninguna tiene alternativa, el test se saltea (no pasa en vacío).
  const withAlt = characters.find((c) => c.objectives.some((o) => (o.alternatives ?? []).length > 0));
  test.skip(!withAlt, 'Ninguna Uma de los datos tiene objetivos con alternativa');
  const alt = withAlt!.objectives.flatMap((o) => o.alternatives ?? [])[0]!.turn;
  await gotoCalendar(page, `/?uma=${withAlt!.id}`);
  await openYear(page, alt <= 24 ? 'Junior' : alt <= 48 ? 'Classic' : 'Senior');
  const cell = page.locator(`[data-turn="${alt}"]`);
  await expect(cell).toHaveClass(/is-alt/);
  await expect(cell).toHaveAttribute('aria-label', /possible objective/);
  await expect(page.getByTestId('legend')).toContainText('Possible objective');
});

test('un plazo de fans va en "goal", no en "busy"', async ({ page }) => {
  // Uma con un objetivo de fans en un turno donde no tiene objetivo de carrera
  const pick = characters
    .map((c) => ({ c, o: c.objectives.find((o) => o.kind === 'fans' && !c.objectives.some((x) => x.kind === 'race' && (x.turn === o.turn || x.alternatives?.some((a) => a.turn === o.turn)))) }))
    .find((x) => x.o);
  test.skip(!pick, 'Ninguna Uma de los datos tiene un objetivo de fans aislado');
  const turn = pick!.o!.turn;
  await gotoCalendar(page, `/?uma=${pick!.c.id}&turn=${turn}`);
  await expect(page.getByTestId('goal-list')).toContainText(pick!.c.name);
  await expect(page.getByTestId('busy-list')).not.toContainText(pick!.c.name);
  await openYear(page, turn <= 24 ? 'Junior' : turn <= 48 ? 'Classic' : 'Senior');
  await expect(page.locator(`[data-turn="${turn}"]`)).toHaveClass(/is-goal/);
});

test('los objetivos sin verificar llevan marca visible', async ({ page }) => {
  const unverified = characters.find((c) => c.objectives.some((o) => !o.verified));
  test.skip(!unverified, 'Todos los objetivos de los datos están verificados');
  const turn = unverified!.objectives.find((o) => !o.verified)!.turn;
  await gotoCalendar(page, `/?uma=${unverified!.id}&turn=${turn}`);
  await expect(page.getByTestId('turn-detail').locator('.badge-unverified').first()).toHaveText('unverified');
  await page.goto(`/characters/${unverified!.id}/`);
  await expect(page.locator('.objectives .badge-unverified').first()).toBeVisible();
  const all = unverified!.objectives.every((o) => !o.verified);
  await expect(page.getByTestId('unverified-note')).toHaveCount(all ? 1 : 0);
  if (all) await expect(page.getByTestId('unverified-note')).toHaveText('Objectives not yet verified in-game.');
});
