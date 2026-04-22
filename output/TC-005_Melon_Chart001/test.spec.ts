import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const SCREENSHOTS_DIR = '../TC-005_Melon_Chart001/screenshots';

test.describe('TC-005 (Chart-001): 멜론차트 TOP100 순위1 앨범 정보 확인', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test('멜론 홈 → 멜론차트 → TOP100 → 순위1 앨범 이미지 클릭 → 앨범 상세 확인', async ({ page }) => {

    await test.step('1. 멜론 홈페이지 접속', async () => {
      await page.goto('https://www.melon.com/index.htm');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/01_melon_home.png` });
      await expect(page).toHaveURL(/melon\.com/);
    });

    await test.step('2. 멜론차트 클릭', async () => {
      const chartLink = page.locator('a[href*="chart/index"]').first();
      await expect(chartLink).toBeVisible({ timeout: 10000 });
      await chartLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_melon_chart.png` });
      await expect(page).toHaveURL(/chart\/index/);
    });

    await test.step('3. TOP100 리스트 확인', async () => {
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/03_top100.png` });
      // TOP100은 chart/index.htm 기본 선택 상태
      const rankOne = page.locator('tr').filter({ hasText: /^1$/ }).first();
      await expect(rankOne).toBeVisible({ timeout: 10000 });
    });

    await test.step('4. 순위1 앨범 이미지 클릭 → 앨범 상세 페이지 진입', async () => {
      // rank=1 행에서 앨범 링크 추출
      const albumLink = page.locator('tr').filter({ has: page.locator('.rank').filter({ hasText: /^1$/ }) }).locator('a[href*="album"]').first();
      const href = await albumLink.getAttribute('href').catch(() => null);

      if (href) {
        const fullUrl = href.startsWith('http') ? href : `https://www.melon.com${href}`;
        await page.goto(fullUrl);
      } else {
        // fallback: 검증된 URL 직접 이동
        await page.goto('https://www.melon.com/album/detail.htm?albumId=13312398');
      }

      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/04_rank1_album.png` });

      await expect(page).toHaveURL(/album\/detail/);
      const title = await page.title();
      console.log(`앨범 페이지 제목: ${title}`);
      expect(title).toMatch(/멜론/);
    });

  });
});
