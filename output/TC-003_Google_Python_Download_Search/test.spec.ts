import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const SCREENSHOTS_DIR = '../TC-003_Google_Python_Download_Search/screenshots';

test.describe('TC-003: Google Python 검색 후 Downloads 페이지 진입', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test('TC-003: Google 홈 → python 검색 → 첫번째 링크 → Downloads', async ({ page }) => {

    await test.step('1. Google 홈페이지 접속', async () => {
      await page.goto('https://www.google.com');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/01_google_home.png` });
      const title = await page.title();
      console.log(`홈 title: ${title}`);
    });

    await test.step('2. 검색창에 "python" 입력 후 검색', async () => {
      const searchBox = page.locator('textarea[name="q"]').first();
      await expect(searchBox).toBeVisible({ timeout: 10000 });
      await searchBox.click();
      await searchBox.fill('python');
      await page.waitForTimeout(500);
      await searchBox.press('Enter');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_search_results.png` });
    });

    await test.step('2.5. CAPTCHA 감지', async () => {
      const isCaptcha = page.url().includes('/sorry/');
      if (isCaptcha) {
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/02b_captcha_blocked.png` });
        console.log('BLOCKED: Google reCAPTCHA 차단 (ERR-001) — 새 프로필 쿠키 없음');
        test.skip(true, 'BLOCKED — Google reCAPTCHA 차단. TestData 프로필에서 수동 CAPTCHA 해결 필요 (ERR-001)');
      }
      await expect(page).toHaveURL(/google\.com\/search/);
    });

    await test.step('3. 첫번째 검색 결과 링크 클릭', async () => {
      // h3 제목이 있는 링크 중 google.com이 아닌 첫번째
      const firstResult = page.locator('h3').filter({ hasNot: page.locator('[href*="google.com"]') }).first();
      const firstLink = firstResult.locator('xpath=ancestor::a').first();
      await expect(firstLink).toBeVisible({ timeout: 10000 });

      const href = await firstLink.getAttribute('href');
      const text = await firstResult.innerText();
      console.log(`첫번째 결과: ${text} → ${href}`);

      await firstLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/03_first_result_page.png` });
      console.log(`이동 후 URL: ${page.url()}`);
    });

    await test.step('4. "Downloads" 카테고리 메뉴 클릭', async () => {
      // python.org 기준: 상단 네비게이션 "Downloads" 링크
      const downloadsLink = page.locator('a', { hasText: /^Downloads$/i }).first();
      const fallbackLink = page.locator('a[href*="download"]').first();

      const isDownloadsVisible = await downloadsLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (isDownloadsVisible) {
        await downloadsLink.click();
      } else {
        await expect(fallbackLink).toBeVisible({ timeout: 5000 });
        await fallbackLink.click();
      }

      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/04_downloads_page.png` });

      const url = page.url();
      console.log(`Downloads 페이지 URL: ${url}`);
      expect(url).toMatch(/download/i);
    });

  });
});
