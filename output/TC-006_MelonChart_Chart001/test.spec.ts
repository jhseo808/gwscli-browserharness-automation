import { test, expect } from '@playwright/test';
import path from 'path';

const SS = path.resolve(__dirname, 'screenshots');

test('Chart-001: 멜론차트 TOP100 순위1 앨범 정보 확인', async ({ page }) => {
  await test.step('1. 멜론 홈 페이지 진입', async () => {
    await page.goto('https://www.melon.com/index.htm');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SS}/01_home.png` });
    await expect(page).toHaveURL(/melon\.com/);
  });

  await test.step('2. 멜론차트 클릭', async () => {
    const chartLink = page.locator('a[href*="chart/index"]').first();
    await chartLink.waitFor({ state: 'visible', timeout: 10000 });
    await chartLink.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SS}/02_melonchart.png` });
    await expect(page).toHaveURL(/chart\/index\.htm/);
  });

  await test.step('3. TOP100 차트 리스트 확인', async () => {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SS}/03_top100.png` });
    // TOP100이 기본 선택 상태 — 별도 탭 클릭 불필요
    const rank1Row = page.locator('tr').filter({ has: page.locator('.rank', { hasText: '1' }) }).first();
    await expect(rank1Row).toBeVisible({ timeout: 10000 });
  });

  await test.step('4. 순위 1위 앨범 이미지 클릭', async () => {
    const rank1Row = page.locator('tr').filter({ has: page.locator('.rank', { hasText: '1' }) }).first();
    const albumImg = rank1Row.locator('img').first();
    await albumImg.waitFor({ state: 'visible', timeout: 10000 });
    await albumImg.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SS}/04_album_detail.png` });
    await expect(page).toHaveURL(/album\/detail\.htm\?albumId=/);
  });

  await test.step('5. 앨범 정보 정상 출력 확인', async () => {
    await expect(page).toHaveTitle(/앨범 정보/);
    const artistName = page.locator('.artist_name a').first();
    await expect(artistName).toBeVisible({ timeout: 10000 });
    const artistText = await artistName.textContent();
    expect(artistText?.trim().length).toBeGreaterThan(0);
    await page.screenshot({ path: `${SS}/05_album_info.png` });
  });
});
