import { test, expect, type Page } from '@playwright/test';

async function waitForSelectPhase(page: Page) {
  await page.waitForSelector('button:has-text("确认出牌")', { timeout: 10_000 });
  await page.waitForTimeout(500);
}

async function startGame(page: Page, players = 4) {
  await page.goto('/');
  await page.waitForSelector('h1:has-text("分轮倍增赛")');
  if (players !== 4) {
    await page.click(`button:has-text("${players}")`);
  }
  await page.click('button:has-text("开始游戏")');
  await waitForSelectPhase(page);
}

async function playFullGame(page: Page) {
  await startGame(page, 2);
  for (let round = 0; round < 4; round++) {
    await waitForSelectPhase(page);
    const cards = page.locator('[data-card-slot]');
    await cards.nth(0).click();
    await cards.nth(1).click();
    await page.click('button:has-text("确认出牌")');
    await page.waitForSelector('button:has-text("下一轮")', { timeout: 5_000 });
    await page.click('button:has-text("下一轮")');
    await page.waitForTimeout(round === 2 ? 8000 : 3000);
  }
  // Round 4 auto-plays, result shows "查看结算" (not "下一轮")
  await page.waitForSelector('button:has-text("查看结算")', { timeout: 15_000 });
  await page.click('button:has-text("查看结算")');
  await page.waitForSelector('button:has-text("再来一局")', { timeout: 10_000 });
}

test.describe('菜单页面', () => {
  test('渲染标题和设置选项', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('分轮倍增赛');
    await expect(page.locator('button:has-text("开始游戏")')).toBeVisible();
  });

  test('玩家人数选择 2-8', async ({ page }) => {
    await page.goto('/');
    for (const n of [2, 3, 5, 6, 7, 8]) {
      await page.click(`button:has-text("${n}")`);
      const btn = page.locator(`button:has-text("${n}")`).first();
      const bg = await btn.evaluate((el) => getComputedStyle(el).backgroundImage);
      expect(bg).toContain('gradient');
    }
  });

  test('输家名次随玩家人数变化', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("6")');
    const loserButtons = page.locator('button:has-text("第")');
    const count = await loserButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('底注可以增减', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[type="number"]');
    await expect(input).toHaveValue('1');
    await page.click('button:has-text("+")');
    await expect(input).toHaveValue('2');
    await page.click('button:has-text("−")');
    await expect(input).toHaveValue('1');
  });
});

test.describe('游戏流程', () => {
  test('点击开始进入游戏画面', async ({ page }) => {
    await startGame(page);
    await expect(page.locator('button:has-text("确认出牌")')).toBeVisible();
  });

  test('选中2张牌后确认出牌按钮可用', async ({ page }) => {
    await startGame(page);
    const confirmBtn = page.locator('button:has-text("确认出牌")');
    await expect(confirmBtn).toBeDisabled();

    const cards = page.locator('[data-card-slot]');
    const cardCount = await cards.count();
    expect(cardCount).toBe(5);

    await cards.nth(0).click();
    await cards.nth(1).click();
    await expect(confirmBtn).toBeEnabled();
  });

  test('可以取消选中牌', async ({ page }) => {
    await startGame(page);
    const cards = page.locator('[data-card-slot]');
    const confirmBtn = page.locator('button:has-text("确认出牌")');

    await cards.nth(0).click();
    await cards.nth(1).click();
    await expect(confirmBtn).toBeEnabled();

    await cards.nth(0).click();
    await expect(confirmBtn).toBeDisabled();
  });

  test('确认出牌后进入结果阶段', async ({ page }) => {
    await startGame(page);
    const cards = page.locator('[data-card-slot]');
    await cards.nth(0).click();
    await cards.nth(1).click();
    await page.click('button:has-text("确认出牌")');

    await page.waitForSelector('button:has-text("下一轮")', { timeout: 5_000 });
    await expect(page.locator('button:has-text("下一轮")')).toBeVisible();
  });

  test('下一轮后进入第二轮', async ({ page }) => {
    await startGame(page);
    const cards = page.locator('[data-card-slot]');
    await cards.nth(0).click();
    await cards.nth(1).click();
    await page.click('button:has-text("确认出牌")');
    await page.waitForSelector('button:has-text("下一轮")', { timeout: 5_000 });
    await page.click('button:has-text("下一轮")');
    await waitForSelectPhase(page);

    const newCards = page.locator('[data-card-slot]');
    const count = await newCards.count();
    expect(count).toBe(5);
  });

  test('完整5轮比赛后到达游戏结束', async ({ page }) => {
    test.setTimeout(90_000);
    await startGame(page, 2);

    // Rounds 0-3: each requires select + confirm + next
    for (let round = 0; round < 4; round++) {
      await waitForSelectPhase(page);
      const cards = page.locator('[data-card-slot]');
      await cards.nth(0).click();
      await cards.nth(1).click();
      await page.click('button:has-text("确认出牌")');
      await page.waitForSelector('button:has-text("下一轮")', { timeout: 5_000 });
      await page.click('button:has-text("下一轮")');
      // After round 2, there's flip-reveal (~4s), then dealing + splash (~3s)
      await page.waitForTimeout(round === 2 ? 8000 : 3000);
    }

    // Round 4 auto-plays, result shows "查看结算" (not "下一轮")
    await page.waitForSelector('button:has-text("查看结算")', { timeout: 15_000 });
    await page.click('button:has-text("查看结算")');

    await expect(
      page.locator('button:has-text("再来一局")'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('最多只能选2张牌', async ({ page }) => {
    await startGame(page);
    const cards = page.locator('[data-card-slot]');
    await cards.nth(0).click();
    await cards.nth(1).click();
    await cards.nth(2).click();

    const confirmBtn = page.locator('button:has-text("确认出牌")');
    await expect(confirmBtn).toBeEnabled();
  });
});

test.describe('不同人数游戏', () => {
  for (const np of [2, 6, 8]) {
    test(`${np}人局可以正常开始和出牌`, async ({ page }) => {
      await startGame(page, np);

      const cards = page.locator('[data-card-slot]');
      const count = await cards.count();
      expect(count).toBe(5);

      await cards.nth(0).click();
      await cards.nth(1).click();
      await page.click('button:has-text("确认出牌")');
      await page.waitForSelector('button:has-text("下一轮")', { timeout: 8_000 });
      await expect(page.locator('button:has-text("下一轮")')).toBeVisible();
    });
  }
});

test.describe('游戏结束画面', () => {
  test('再来一局重新开始游戏', async ({ page }) => {
    test.setTimeout(90_000);
    await playFullGame(page);

    await page.click('button:has-text("再来一局")');
    await waitForSelectPhase(page);
    await expect(page.locator('button:has-text("确认出牌")')).toBeVisible();
  });

  test('返回菜单回到主屏幕', async ({ page }) => {
    test.setTimeout(90_000);
    await playFullGame(page);

    await page.click('button:has-text("返回菜单")');
    await expect(page.locator('h1:has-text("分轮倍增赛")')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('响应式布局', () => {
  test('移动端视图正常工作', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await startGame(page);
    await expect(page.locator('button:has-text("确认出牌")')).toBeVisible();
  });

  test('桌面端视图正常工作', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await startGame(page);
    await expect(page.locator('button:has-text("确认出牌")')).toBeVisible();
  });
});
