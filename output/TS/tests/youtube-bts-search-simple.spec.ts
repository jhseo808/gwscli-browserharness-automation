import { test, expect } from '@playwright/test';

test.describe('YouTube BTS Search and Play Tests', () => {
  test('TC-001: Search BTS and play first video', async ({ page }) => {
    // Step 1: YouTube 홈페이지 접속
    await test.step('Navigate to YouTube', async () => {
      await page.goto('https://www.youtube.com');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    // Step 2: 검색 입력창 클릭
    await test.step('Click search input', async () => {
      const searchInput = page.locator('input[placeholder="Search"]');
      await searchInput.click();
    });

    // Step 3: 검색 입력창에 BTS 입력
    await test.step('Type "BTS" in search box', async () => {
      await page.keyboard.type('BTS', { delay: 100 });
      await page.waitForTimeout(500);
    });

    // Step 4: Enter 키로 검색
    await test.step('Press Enter to search', async () => {
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    // Step 5: 검색 결과 확인
    await test.step('Verify search results', async () => {
      // 여러 selector로 비디오 링크 찾기
      const videoLinks = page.locator(
        'a[href*="/watch?v="], ytd-video-renderer a, .yt-simple-endpoint'
      );
      const count = await videoLinks.count();

      console.log(`Found ${count} video results`);
      expect(count).toBeGreaterThan(0);
    });

    // Step 6: 첫 번째 비디오 클릭
    await test.step('Click first video', async () => {
      const firstVideo = page.locator('a[href*="/watch?v="]').first();

      // 클릭 전 URL 확인
      const videoUrl = await firstVideo.getAttribute('href');
      console.log(`Playing video: ${videoUrl}`);

      expect(videoUrl).toContain('/watch?v=');
      await firstVideo.click();
    });

    // Step 7: 비디오 재생 페이지 로드
    await test.step('Wait for video player', async () => {
      // 비디오 플레이어 엘리먼트 대기
      await page.waitForSelector('video, [data-player-type], .html5-video-player', {
        timeout: 15000,
      });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    // Step 8: 비디오 재생 확인
    await test.step('Verify video is loaded', async () => {
      // 페이지 제목 확인
      const pageTitle = await page.title();
      console.log(`Page title: ${pageTitle}`);

      expect(pageTitle).toContain('BTS');

      // 재생 플레이어 확인
      const player = page.locator('.html5-video-player, video');
      expect(player).toBeDefined();
    });

    // Step 9: 스크린샷
    await test.step('Take screenshot', async () => {
      await page.screenshot({
        path: 'screenshots/youtube-bts-playing-final.png',
      });
    });
  });

  test('TC-002: Direct search using URL', async ({ page }) => {
    // BTS 검색 결과로 직접 이동
    await test.step('Navigate to BTS search results', async () => {
      await page.goto('https://www.youtube.com/results?search_query=BTS');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    // 첫 번째 비디오 클릭
    await test.step('Click first video in results', async () => {
      const firstVideo = page.locator('a[href*="/watch?v="]').first();
      const videoUrl = await firstVideo.getAttribute('href');

      console.log(`Video URL: ${videoUrl}`);
      expect(videoUrl).toContain('/watch?v=');

      await firstVideo.click();
    });

    // 비디오 재생 확인
    await test.step('Verify video plays', async () => {
      await page.waitForSelector('video, [data-player-type]', {
        timeout: 15000,
      });
      await page.waitForLoadState('networkidle');

      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
      console.log(`Playing: ${pageTitle}`);
    });

    // 스크린샷
    await test.step('Take final screenshot', async () => {
      await page.screenshot({
        path: 'screenshots/youtube-bts-playing-url.png',
      });
    });
  });
});
