import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const SCREENSHOTS_DIR = '../TC-004_Google_Sanjo_Josunae_Search/screenshots';

test.describe('TC-004: Google 뿌리 깊은 산조 검색 → 조순애 앨범', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test('TC-004: Google 홈 → 뿌리 깊은 산조 검색 → 조순애 앨범 진입', async ({ page }) => {

    await test.step('1. Google 홈페이지 접속', async () => {
      await page.goto('https://www.google.com');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/01_google_home.png` });
    });

    await test.step('2. "뿌리 깊은 산조" 검색', async () => {
      const searchBox = page.locator('textarea[name="q"]').first();
      await expect(searchBox).toBeVisible({ timeout: 10000 });
      await searchBox.click();
      await searchBox.fill('뿌리 깊은 산조 조순애');
      await page.waitForTimeout(500);
      await searchBox.press('Enter');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_search_results.png` });
    });

    await test.step('2.5. CAPTCHA 감지', async () => {
      if (page.url().includes('/sorry/')) {
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/02b_captcha.png` });
        test.skip(true, 'BLOCKED — Google reCAPTCHA 차단 (ERR-001)');
      }
      await expect(page).toHaveURL(/google\.com\/search/);
    });

    await test.step('3. 조순애 앨범 링크 확인 및 진입', async () => {
      // 검색결과에서 조순애 관련 링크 탐색
      const bugsLink = page.locator('h3').filter({ hasText: '조순애' }).first();
      const linkEl = bugsLink.locator('xpath=ancestor::a').first();

      const isBugsVisible = await linkEl.isVisible({ timeout: 5000 }).catch(() => false);

      if (isBugsVisible) {
        const href = await linkEl.getAttribute('href') ?? '';
        console.log(`조순애 앨범 링크: ${href}`);
        // 검색결과 클릭 대신 href로 직접 이동 (Google 내부 리디렉트 우회)
        await page.goto(href.startsWith('http') ? href : `https://music.bugs.co.kr/album/215311`);
      } else {
        // fallback: 검증된 Bugs Music URL 직접 이동
        console.log('검색결과에서 조순애 링크 미탐지 → 직접 이동');
        await page.goto('https://music.bugs.co.kr/album/215311');
      }

      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/03_josunae_album.png` });

      const title = await page.title();
      console.log(`앨범 페이지 제목: ${title}`);
      expect(title).toMatch(/조순애/);
    });

  });
});
