import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// 테스트 중 발견된 selector들을 기록
const interactions: any[] = [];

// Fixture: selector 자동 기록
test.beforeEach(async ({ page }) => {
  interactions.length = 0;
});

test.afterEach(async ({ page }, testInfo) => {
  // 테스트 후 skill 파일 자동 생성
  if (interactions.length > 0) {
    generateSkillFile(testInfo.title, interactions);
  }
});

test.describe('YouTube BTS Search Tests', () => {
  test('TC-001: Search BTS and play first video', async ({ page }) => {
    // Step 1: YouTube 홈페이지 접속
    await test.step('Navigate to YouTube', async () => {
      await page.goto('https://www.youtube.com');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 검색창이 로드되었는지 확인
      const searchBox = page.locator('input[placeholder="Search"]');
      await expect(searchBox).toBeVisible({ timeout: 10000 });
    });

    // Step 2: 검색창 클릭
    let searchSelector = 'input[placeholder="Search"]';
    await test.step('Click search box', async () => {
      const searchBox = page.locator(searchSelector);
      await searchBox.click();

      recordInteraction('click', searchSelector);

      // 검색창이 활성화되었는지 확인
      await expect(searchBox).toBeFocused();
    });

    // Step 3: "BTS" 입력
    await test.step('Type "BTS" in search box', async () => {
      const searchBox = page.locator(searchSelector);
      await searchBox.fill('BTS');

      recordInteraction('fill', searchSelector, 'BTS');

      // 텍스트가 입력되었는지 확인
      await expect(searchBox).toHaveValue('BTS');
    });

    // Step 4: Enter 키로 검색 실행
    await test.step('Press Enter to search', async () => {
      await page.keyboard.press('Enter');

      recordInteraction('press', 'Enter');

      // 검색 결과 페이지 로드 대기
      await page.waitForLoadState('networkidle');
    });

    // Step 5: 검색 결과 확인
    await test.step('Verify search results', async () => {
      // 검색 결과가 있는지 확인
      const videoLinks = page.locator('a[href*="/watch?v="]');
      const count = await videoLinks.count();

      expect(count).toBeGreaterThan(0);
      console.log(`Found ${count} video results for BTS`);
    });

    // Step 6: 첫 번째 비디오 클릭
    let firstVideoSelector = 'a#video-title, ytd-video-renderer a[href*="/watch"], .yt-simple-endpoint[href*="/watch"]';
    await test.step('Click first video', async () => {
      const firstVideo = page.locator(firstVideoSelector).first();

      // 첫 번째 비디오의 제목 추출
      const videoTitle = await firstVideo.getAttribute('title') ||
                        await firstVideo.innerText();

      console.log(`Clicking video: ${videoTitle}`);

      // 클릭 전 URL 기록
      const videoUrl = await firstVideo.getAttribute('href');
      expect(videoUrl).toContain('/watch?v=');

      await firstVideo.click();
      recordInteraction('click', firstVideoSelector, videoTitle);
    });

    // Step 7: 비디오 재생 페이지 로드
    await test.step('Wait for video player to load', async () => {
      // 비디오 플레이어 로드 대기
      await page.waitForSelector('video, [data-player-type="html5"]', {
        timeout: 15000,
      });

      // 추가 로드 시간
      await page.waitForLoadState('networkidle');
    });

    // Step 8: 비디오 재생 상태 확인
    await test.step('Verify video is playing', async () => {
      // 비디오 제목이 표시되는지 확인
      const videoTitle = page.locator('h1.title');
      await expect(videoTitle).toBeVisible({ timeout: 5000 });

      // 플레이어 UI 요소들 확인
      const playButton = page.locator('button[aria-label*="재생"], button[aria-label*="Play"]');
      const progressBar = page.locator('.ytp-progress-bar, [class*="progress"]');

      expect(playButton).toBeDefined();
      expect(progressBar).toBeDefined();

      // 조회수 정보 확인
      const viewCount = page.locator('[aria-label*="조회"], .view-count');
      const hasViewInfo = await viewCount.count() > 0 ||
                         await page.locator('text=/\\d+,?\\d*조회/').count() > 0;

      expect(hasViewInfo).toBeTruthy();
    });

    // Step 9: 최종 스크린샷
    await test.step('Take final screenshot', async () => {
      await page.screenshot({
        path: 'screenshots/youtube-bts-playing.png',
        fullPage: false
      });
    });
  });

  test('TC-002: Verify video metadata', async ({ page }) => {
    // BTS 검색 후 영상 메타데이터 검증
    await page.goto('https://www.youtube.com');
    await page.waitForLoadState('networkidle');

    await test.step('Search and verify metadata', async () => {
      // 검색
      const searchBox = page.locator('input[placeholder="Search"]');
      await searchBox.fill('BTS');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');

      // 첫 번째 영상의 메타데이터 추출
      const firstVideoCard = page.locator('ytd-video-renderer').first();

      const title = await firstVideoCard.locator('#video-title').innerText();
      const channelName = await firstVideoCard.locator('#channel-name').innerText();

      // 검증
      expect(title).toContain('BTS');
      console.log(`Title: ${title}`);
      console.log(`Channel: ${channelName}`);

      recordInteraction('verify', '#video-title', title);
      recordInteraction('verify', '#channel-name', channelName);
    });
  });

  test('TC-003: Search results pagination', async ({ page }) => {
    // BTS 검색 결과에서 페이지네이션 확인
    await page.goto('https://www.youtube.com');
    await page.waitForLoadState('networkidle');

    await test.step('Search BTS', async () => {
      const searchBox = page.locator('input[placeholder="Search"]');
      await searchBox.fill('BTS');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Check pagination', async () => {
      const videos = page.locator('ytd-video-renderer, a[href*="/watch?v="]');
      const initialCount = await videos.count();

      expect(initialCount).toBeGreaterThan(0);

      // 스크롤해서 더 많은 결과 로드
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight * 3);
      });

      await page.waitForTimeout(2000);

      const finalCount = await videos.count();
      expect(finalCount).toBeGreaterThanOrEqual(initialCount);

      console.log(`Initial videos: ${initialCount}, After scroll: ${finalCount}`);
    });
  });
});

// Utility Functions
function recordInteraction(
  action: string,
  selector: string,
  value?: string
) {
  interactions.push({
    action,
    selector,
    value,
    timestamp: new Date().toISOString(),
  });
}

function generateSkillFile(testName: string, interactions: any[]) {
  const domain = 'youtube';
  const skillsDir = path.join(__dirname, '..', '..', '..', '..', 'browser-harness', 'domain-skills', domain);

  // 디렉토리 생성
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  // Markdown 문서 생성
  let content = `# ${testName}\n\n`;
  content += `**Domain**: ${domain}\n`;
  content += `**Generated**: ${new Date().toISOString()}\n\n`;
  content += `## Selectors Used\n\n`;

  const uniqueSelectors = new Map<string, any>();

  for (const interaction of interactions) {
    const key = `${interaction.action}:${interaction.selector}`;
    if (!uniqueSelectors.has(key)) {
      uniqueSelectors.set(key, interaction);
    }
  }

  for (const [, interaction] of uniqueSelectors) {
    content += `### ${interaction.action.toUpperCase()}\n`;
    content += `\`\`\`css\n${interaction.selector}\n\`\`\`\n`;
    if (interaction.value) {
      content += `**Value**: ${interaction.value}\n`;
    }
    content += `\n`;
  }

  // 파일 저장
  const filePath = path.join(skillsDir, `${testName.replace(/\s+/g, '_')}.md`);
  fs.writeFileSync(filePath, content);

  console.log(`✅ Skill file generated: ${filePath}`);
}
