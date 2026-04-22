import { test, expect } from '@playwright/test';

test.describe('TC-001: YouTube BTS 검색 및 재생', () => {
  test('TC-001: Search BTS and play first video', async ({ page }) => {
    await test.step('1. YouTube 홈페이지 접속', async () => {
      await page.goto('https://www.youtube.com');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    await test.step('2. 검색창 클릭', async () => {
      const searchInput = page.locator('input[placeholder="Search"]');
      await searchInput.click();
      await expect(searchInput).toBeFocused();
    });

    await test.step('3. BTS 입력', async () => {
      await page.keyboard.type('BTS', { delay: 100 });
      await page.waitForTimeout(500);
    });

    await test.step('4. Enter로 검색', async () => {
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    await test.step('5. 검색 결과 확인', async () => {
      const videoLinks = page.locator('a[href*="/watch?v="]');
      const count = await videoLinks.count();
      console.log(`Found ${count} video results`);
      expect(count).toBeGreaterThan(0);
    });

    await test.step('6. 첫 번째 비디오 클릭', async () => {
      const firstVideo = page.locator('a[href*="/watch?v="]').first();
      const videoUrl = await firstVideo.getAttribute('href');
      console.log(`Playing: ${videoUrl}`);
      expect(videoUrl).toContain('/watch?v=');
      await firstVideo.click();
    });

    await test.step('7. 플레이어 로드 및 재생 확인', async () => {
      await page.waitForSelector('video, [data-player-type], .html5-video-player', {
        timeout: 15000,
      });
      await page.waitForLoadState('networkidle');
      const pageTitle = await page.title();
      console.log(`Page title: ${pageTitle}`);
      expect(pageTitle).toContain('BTS');
    });

    await test.step('Screenshot', async () => {
      await page.screenshot({
        path: '../TC-001_YouTube_BTS_Search/screenshots/final.png',
      });
    });
  });

  test('TC-001b: Direct URL search', async ({ page }) => {
    await test.step('BTS 검색 결과 URL 직접 이동', async () => {
      await page.goto('https://www.youtube.com/results?search_query=BTS');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    await test.step('첫 번째 비디오 클릭', async () => {
      const firstVideo = page.locator('a[href*="/watch?v="]').first();
      const videoUrl = await firstVideo.getAttribute('href');
      expect(videoUrl).toContain('/watch?v=');
      await firstVideo.click();
    });

    await test.step('재생 확인', async () => {
      await page.waitForSelector('video, [data-player-type]', { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
      console.log(`Playing: ${pageTitle}`);
    });

    await test.step('Screenshot', async () => {
      await page.screenshot({
        path: '../TC-001_YouTube_BTS_Search/screenshots/direct-url-final.png',
      });
    });
  });
});
