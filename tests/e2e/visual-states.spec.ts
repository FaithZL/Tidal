import { test, expect, type Page } from '../helpers/manualModeTest.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const output = 'artifacts/qa/3d/replay';
async function frame(page: Page, name: string) {
  await page.locator('#worldCanvas').screenshot({ path: `${output}/${name}.png` });
}
async function advance(page: Page, ms: number) { await page.clock.runFor(ms); }
async function holdFor(page: Page, ms: number) {
  // Real KeyboardActionSource samples at most 100 ms apart, within the 200 ms validity gate.
  for (let elapsed = 0; elapsed < ms; elapsed += 100) await page.clock.fastForward(100);
}
async function rep(page: Page, task: 'chop' | 'load', count: number) {
  await page.locator('#actionBtn').click();await advance(page, task === 'chop' ? 480 : 740);
  await expect(page.locator(`#${task}Value`)).toHaveText(`${count}/15`);
}
test('farm actors replay real keyboard stages, committed effects, both NPC scripts and reset', async ({ page }) => {
  test.setTimeout(180000);
  const errors: string[] = [];page.on('pageerror', e => errors.push(e.message));
  await mkdir(output, { recursive: true });
  await page.clock.install({ time: new Date('2026-10-15T00:00:00Z') });
  await page.goto('/');await page.clock.pauseAt(new Date('2026-10-15T00:01:00Z'));
  const world = page.locator('#worldCanvas');
  await expect(world).toHaveAttribute('data-art', 'tidal-farm-3d-v2');
  await page.locator('#cancelPlan').click();await frame(page, '01-home');
  await page.locator('#actionBtn').click();await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();
  await page.clock.fastForward(5050);await advance(page, 20);await expect(page.locator('#statusTag')).toHaveText('训练中');
  await frame(page, '02-ready');
  await page.locator('#actionBtn').click();await advance(page, 220);
  await expect(world).toHaveAttribute('data-particles','8');
  await expect(world).toHaveAttribute('data-action', 'chop-down');await frame(page, '03-chop-down');
  await page.locator('#pauseBtn').click();await advance(page, 40);
  const hashFrame = async () => createHash('sha256').update(await world.screenshot()).digest('hex');
  const paused = await hashFrame();await advance(page, 1500);expect(await hashFrame()).toBe(paused);
  await expect(page.locator('#chopValue')).toHaveText('0/15');
  await page.locator('#pauseBtn').click();await advance(page, 40);await expect(world).toHaveAttribute('data-action', 'ready');
  await page.locator('#actionBtn').click();await advance(page, 370);
  await expect(world).toHaveAttribute('data-action', 'chop-return');await frame(page, '04-chop-return');await advance(page, 120);
  for (let n = 2; n <= 5; n++) await rep(page, 'chop', n);
  await expect(world).toHaveAttribute('data-fallen', '1');await expect(world).toHaveAttribute('data-effects', /tree/);
  await advance(page, 200);await frame(page, '05-tree-fall');
  for (let n = 6; n <= 15; n++) await rep(page, 'chop', n);
  await expect(world).toHaveAttribute('data-npc', 'gather');await page.clock.fastForward(7200);await advance(page, 1200);await frame(page, '06-rest-gather');
  const overlay = await page.locator('#countdown').boundingBox(), bounds = await world.boundingBox();
  expect(overlay!.y + overlay!.height).toBeLessThan(bounds!.y + bounds!.height * .35);
  await expect(world).toHaveAttribute('data-inventory', '15/0/0');
  await page.clock.fastForward(8000);await page.clock.fastForward(5100);await advance(page, 20);await expect(page.locator('#statusTag')).toHaveText('训练中');
  await page.locator('#actionBtn').click();await advance(page, 170);
  await expect(world).toHaveAttribute('data-action', 'squat-down');await frame(page, '07-squat');
  await advance(page, 165);await expect(world).toHaveAttribute('data-action', 'stand-up');await frame(page, '08-stand');
  await advance(page, 160);await expect(world).toHaveAttribute('data-action', 'press-up');await frame(page, '09-press');
  await advance(page, 130);await expect(world).toHaveAttribute('data-action', 'load-return');await frame(page, '10-load-return');
  await advance(page, 200);await expect(world).toHaveAttribute('data-effects', /log/);await frame(page, '11-log-flight');
  for (let n = 2; n <= 15; n++) await rep(page, 'load', n);
  await expect(world).toHaveAttribute('data-npc', 'secure');await page.clock.fastForward(7500);await advance(page, 1200);await frame(page, '12-rest-secure');
  await expect(world).toHaveAttribute('data-inventory', '0/15/0');
  await page.clock.fastForward(7600);await page.clock.fastForward(5100);await advance(page, 20);await page.locator('#actionBtn').focus();await page.keyboard.down('Space');await holdFor(page, 30000);await page.keyboard.up('Space');await advance(page, 50);
  await frame(page, '13-carry');const position = await world.getAttribute('data-cart-position');
  await page.clock.fastForward(4000);await advance(page, 20);await expect(world).toHaveAttribute('data-cart-position', position!);
  await page.keyboard.down('Space');await holdFor(page, 31000);await page.keyboard.up('Space');await advance(page, 20);
  await expect(page.locator('#resultsModal')).toBeVisible();await expect(world).toHaveAttribute('data-inventory', '0/0/15');
  await frame(page, '14-home-arrival');await page.screenshot({ path: `${output}/15-results.png`, fullPage: true });
  await page.locator('#resultsHome').click();await advance(page, 1200);
  await expect(world).toHaveAttribute('data-fallen', '0');await expect(world).toHaveAttribute('data-effects', '');
  await expect(world).toHaveAttribute('data-inventory', '0/0/0');await expect(world).toHaveAttribute('data-action', 'ready');
  expect(errors).toEqual([]);
  await writeFile(`${output}/visual-replay.json`, JSON.stringify({ input: 'real KeyboardActionSource; browser controlled clock; not camera', phases: 7, screenshots: 15, errors, result: 'pass' }, null, 2));
});
