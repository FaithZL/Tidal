# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-states.spec.ts >> farm actors replay real keyboard stages, committed effects, both NPC scripts and reset
- Location: tests\e2e\visual-states.spec.ts:18:1

# Error details

```
Error: locator.screenshot: UNKNOWN: unknown error, open 'D:\work\corona\Tidal\artifacts\qa\3d\replay\10-load-return.png'
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner:
    - generic:
      - generic:
        - text: T
        - generic: ✦
      - generic:
        - generic: TIDAL FARM
        - generic: 每一次运动，都让世界生长
    - generic [ref=e2]:
      - generic [ref=e3]: ⌨ 键盘演示 · 非真实动作识别
      - switch "无摄像头测试：关" [ref=e4] [cursor=pointer]
      - button "开启音效" [ref=e5] [cursor=pointer]
      - button "暂停" [ref=e6] [cursor=pointer]
      - button "重新开始" [ref=e7] [cursor=pointer]
  - main [ref=e8]:
    - generic [ref=e9]:
      - generic:
        - generic:
          - generic: YOUR LITTLE WORLD
          - heading "把木材装上手推车" [level=1]
        - generic: 今日劳作 · 体验计划
      - generic [ref=e10]:
        - img "可旋转三维农场。地面15、车上0、到家0。" [ref=e11]:
          - generic "可旋转的三维农场，拖拽旋转、滚轮缩放" [ref=e12]
        - generic:
          - generic: 空格触发“蹲下 → 站起 → 上举 → 复位”，装上一份木材。
          - generic: 0%
      - generic "训练任务阶段":
        - generic:
          - generic: 🪓
          - generic:
            - text: 砍伐杉树
            - generic: 壶铃挥砍
        - generic:
          - generic: 🪵
          - generic:
            - text: 木材装车
            - generic: 深蹲推举
        - generic:
          - generic: 🛒
          - generic:
            - text: 运输木材
            - generic: 持续持姿
    - complementary [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: MISSION CONTROL
        - generic [ref=e16]: 训练中
      - heading "把木材装上手推车" [level=2] [ref=e17]
      - paragraph [ref=e18]: 空格触发“蹲下 → 站起 → 上举 → 复位”，装上一份木材。
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: 🪓 已完成挥砍
          - strong [ref=e22]: 15/15
        - generic [ref=e23]:
          - generic [ref=e24]: 🪵 已装车木材
          - strong [ref=e25]: 0/15
        - generic [ref=e26]:
          - generic [ref=e27]: ⏱ 有效拉车
          - strong [ref=e28]: 0.0/60s
        - generic [ref=e29]:
          - generic [ref=e30]: 🌲 砍倒树木
          - strong [ref=e31]: 3/3
      - generic [ref=e32]:
        - generic [ref=e33]: ✧
        - generic [ref=e34]:
          - text: 将运动变成资产
          - generic [ref=e35]: 收集资源 · 升级农场 · 获得正反馈
      - generic [ref=e36]:
        - generic [ref=e37]: 空格触发“蹲下 → 站起 → 上举 → 复位”，装上一份木材。
        - button "🪵 模拟一次装车" [active] [ref=e38] [cursor=pointer]
        - paragraph [ref=e39]: 按 Space 完成一次动作循环（禁用自动重复）
      - group [ref=e40]:
        - generic "输入诊断" [ref=e41] [cursor=pointer]
  - generic "三维视角控制" [ref=e42]:
    - generic [ref=e43]: 拖拽旋转 · 滚轮缩放
    - button "向左旋转视角" [ref=e44] [cursor=pointer]: ↶
    - button "向右旋转视角" [ref=e45] [cursor=pointer]: ↷
    - button "全景视角" [ref=e46] [cursor=pointer]
  - contentinfo:
    - status: 会话 session-1 · 训练中
```

# Test source

```ts
  1  | import { test, expect, type Page } from '../helpers/manualModeTest.js';
  2  | import { mkdir, writeFile } from 'node:fs/promises';
  3  | import { createHash } from 'node:crypto';
  4  | 
  5  | const output = 'artifacts/qa/3d/replay';
  6  | async function frame(page: Page, name: string) {
> 7  |   await page.locator('#worldCanvas').screenshot({ path: `${output}/${name}.png` });
     |                                      ^ Error: locator.screenshot: UNKNOWN: unknown error, open 'D:\work\corona\Tidal\artifacts\qa\3d\replay\10-load-return.png'
  8  | }
  9  | async function advance(page: Page, ms: number) { await page.clock.runFor(ms); }
  10 | async function holdFor(page: Page, ms: number) {
  11 |   // Real KeyboardActionSource samples at most 100 ms apart, within the 200 ms validity gate.
  12 |   for (let elapsed = 0; elapsed < ms; elapsed += 100) await page.clock.fastForward(100);
  13 | }
  14 | async function rep(page: Page, task: 'chop' | 'load', count: number) {
  15 |   await page.locator('#actionBtn').click();await advance(page, task === 'chop' ? 480 : 740);
  16 |   await expect(page.locator(`#${task}Value`)).toHaveText(`${count}/15`);
  17 | }
  18 | test('farm actors replay real keyboard stages, committed effects, both NPC scripts and reset', async ({ page }) => {
  19 |   test.setTimeout(180000);
  20 |   const errors: string[] = [];page.on('pageerror', e => errors.push(e.message));
  21 |   await mkdir(output, { recursive: true });
  22 |   await page.clock.install({ time: new Date('2026-10-15T00:00:00Z') });
  23 |   await page.goto('/');await page.clock.pauseAt(new Date('2026-10-15T00:01:00Z'));
  24 |   const world = page.locator('#worldCanvas');
  25 |   await expect(world).toHaveAttribute('data-art', 'tidal-farm-3d-v2');
  26 |   await page.locator('#cancelPlan').click();await frame(page, '01-home');
  27 |   await page.locator('#actionBtn').click();await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();
  28 |   await page.clock.fastForward(5050);await advance(page, 20);await expect(page.locator('#statusTag')).toHaveText('训练中');
  29 |   await frame(page, '02-ready');
  30 |   await page.locator('#actionBtn').click();await advance(page, 220);
  31 |   await expect(world).toHaveAttribute('data-particles','8');
  32 |   await expect(world).toHaveAttribute('data-action', 'chop-down');await frame(page, '03-chop-down');
  33 |   await page.locator('#pauseBtn').click();await advance(page, 40);
  34 |   const hashFrame = async () => createHash('sha256').update(await world.screenshot()).digest('hex');
  35 |   const paused = await hashFrame();await advance(page, 1500);expect(await hashFrame()).toBe(paused);
  36 |   await expect(page.locator('#chopValue')).toHaveText('0/15');
  37 |   await page.locator('#pauseBtn').click();await advance(page, 40);await expect(world).toHaveAttribute('data-action', 'ready');
  38 |   await page.locator('#actionBtn').click();await advance(page, 370);
  39 |   await expect(world).toHaveAttribute('data-action', 'chop-return');await frame(page, '04-chop-return');await advance(page, 120);
  40 |   for (let n = 2; n <= 5; n++) await rep(page, 'chop', n);
  41 |   await expect(world).toHaveAttribute('data-fallen', '1');await expect(world).toHaveAttribute('data-effects', /tree/);
  42 |   await advance(page, 200);await frame(page, '05-tree-fall');
  43 |   for (let n = 6; n <= 15; n++) await rep(page, 'chop', n);
  44 |   await expect(world).toHaveAttribute('data-npc', 'gather');await page.clock.fastForward(7200);await advance(page, 1200);await frame(page, '06-rest-gather');
  45 |   const overlay = await page.locator('#countdown').boundingBox(), bounds = await world.boundingBox();
  46 |   expect(overlay!.y + overlay!.height).toBeLessThan(bounds!.y + bounds!.height * .35);
  47 |   await expect(world).toHaveAttribute('data-inventory', '15/0/0');
  48 |   await page.clock.fastForward(8000);await page.clock.fastForward(5100);await advance(page, 20);await expect(page.locator('#statusTag')).toHaveText('训练中');
  49 |   await page.locator('#actionBtn').click();await advance(page, 170);
  50 |   await expect(world).toHaveAttribute('data-action', 'squat-down');await frame(page, '07-squat');
  51 |   await advance(page, 165);await expect(world).toHaveAttribute('data-action', 'stand-up');await frame(page, '08-stand');
  52 |   await advance(page, 160);await expect(world).toHaveAttribute('data-action', 'press-up');await frame(page, '09-press');
  53 |   await advance(page, 130);await expect(world).toHaveAttribute('data-action', 'load-return');await frame(page, '10-load-return');
  54 |   await advance(page, 200);await expect(world).toHaveAttribute('data-effects', /log/);await frame(page, '11-log-flight');
  55 |   for (let n = 2; n <= 15; n++) await rep(page, 'load', n);
  56 |   await expect(world).toHaveAttribute('data-npc', 'secure');await page.clock.fastForward(7500);await advance(page, 1200);await frame(page, '12-rest-secure');
  57 |   await expect(world).toHaveAttribute('data-inventory', '0/15/0');
  58 |   await page.clock.fastForward(7600);await page.clock.fastForward(5100);await advance(page, 20);await page.locator('#actionBtn').focus();await page.keyboard.down('Space');await holdFor(page, 30000);await page.keyboard.up('Space');await advance(page, 50);
  59 |   await frame(page, '13-carry');const position = await world.getAttribute('data-cart-position');
  60 |   await page.clock.fastForward(4000);await advance(page, 20);await expect(world).toHaveAttribute('data-cart-position', position!);
  61 |   await page.keyboard.down('Space');await holdFor(page, 31000);await page.keyboard.up('Space');await advance(page, 20);
  62 |   await expect(page.locator('#resultsModal')).toBeVisible();await expect(world).toHaveAttribute('data-inventory', '0/0/15');
  63 |   await frame(page, '14-home-arrival');await page.screenshot({ path: `${output}/15-results.png`, fullPage: true });
  64 |   await page.locator('#resultsHome').click();await advance(page, 1200);
  65 |   await expect(world).toHaveAttribute('data-fallen', '0');await expect(world).toHaveAttribute('data-effects', '');
  66 |   await expect(world).toHaveAttribute('data-inventory', '0/0/0');await expect(world).toHaveAttribute('data-action', 'ready');
  67 |   expect(errors).toEqual([]);
  68 |   await writeFile(`${output}/visual-replay.json`, JSON.stringify({ input: 'real KeyboardActionSource; browser controlled clock; not camera', phases: 7, screenshots: 15, errors, result: 'pass' }, null, 2));
  69 | });
  70 | 
```