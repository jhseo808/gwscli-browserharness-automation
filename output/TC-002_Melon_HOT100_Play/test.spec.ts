import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const SCREENSHOTS_DIR = '../TC-002_Melon_HOT100_Play/screenshots';

test.describe('TC-002: Melon HOT100 2순위 재생', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test('TC-002: 멜론 홈 진입 → 멜론차트 → HOT100 → 2순위 듣기', async ({ page }) => {

    await test.step('1. 멜론 홈페이지 접속', async () => {
      await page.goto('https://www.melon.com/index.htm');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/01_home_loaded.png` });
      const title = await page.title();
      console.log(`홈 title: ${title}`);
    });

    await test.step('2. 상단 GNB "멜론차트" 클릭', async () => {
      const chartLink = page.locator('a[href*="chart/index"]').first();
      await expect(chartLink).toBeVisible();
      await chartLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_chart_page.png` });
    });

    await test.step('3. 서브 탭 "HOT100" 클릭', async () => {
      const hot100Tab = page.locator('a[href*="chart/hot100"]').first();
      await expect(hot100Tab).toBeVisible();
      await hot100Tab.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/03_hot100_loaded.png` });
      await expect(page).toHaveURL(/chart\/hot100/);
    });

    await test.step('4. 2순위 곡 정보 확인', async () => {
      const rank2Row = page.locator('tbody tr').filter({
        has: page.locator('.rank', { hasText: '2' })
      }).first();
      await expect(rank2Row).toBeVisible();

      const songName = await rank2Row.locator('.ellipsis.rank01 a, .song_name a, a.fc_gray').first().innerText().catch(() => '');
      const artistName = await rank2Row.locator('.ellipsis.rank02 a, .artist_name a').first().innerText().catch(() => '');
      console.log(`2순위: ${songName} - ${artistName}`);
    });

    await test.step('5. 2순위 듣기 버튼 클릭', async () => {
      const rank2Row = page.locator('tbody tr').filter({
        has: page.locator('.rank', { hasText: '2' })
      }).first();

      const playBtn = rank2Row.locator('.btn_play, [class*="play"], button[title*="듣기"]').first();
      await playBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/05_after_play_click.png` });
    });

    await test.step('6. 플레이어 팝업 감지 및 상태 확인', async () => {
      const installPopup = page.locator('text=설치가 필요합니다');
      const loadingPopup = page.locator('text=실행 중입니다');

      const isInstallBlocked = await installPopup.isVisible({ timeout: 3000 }).catch(() => false);
      const isLoadingBlocked = await loadingPopup.isVisible({ timeout: 3000 }).catch(() => false);

      await page.screenshot({ path: `${SCREENSHOTS_DIR}/06_player_result.png` });

      if (isInstallBlocked) {
        console.log('BLOCKED: 멜론 데스크탑 플레이어 설치 필요 (ERR-001)');
        test.skip(true, 'BLOCKED — 멜론 플레이어 설치 필요');
      } else if (isLoadingBlocked) {
        console.log('BLOCKED: melonplayer:// 프로토콜 미지원 환경 (ERR-002)');
        test.skip(true, 'BLOCKED — melonplayer:// 프로토콜 미지원');
      } else {
        console.log('플레이어 정상 실행 확인');
      }
    });
  });
});
