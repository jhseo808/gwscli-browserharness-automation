# Playwright 오류 패턴 및 해결책

오류 발생 시 이 파일에서 기존 해결책 먼저 탐색.
새 패턴 발견 시 하단에 추가.

---

## PAT-001: networkidle 타임아웃

- **증상**: `waitForLoadState('networkidle')` 타임아웃 (30초 초과)
- **원인**: 광고/분석 스크립트가 지속적으로 네트워크 요청
- **해결**:
  ```typescript
  // networkidle 대신 domcontentloaded + 고정 대기
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  ```
- **적용 도메인**: YouTube, 광고 많은 국내 서비스

---

## PAT-002: 검색창 selector 불일치

- **증상**: `input[placeholder="Search"]` 요소 없음
- **원인**: 언어/지역 설정에 따라 placeholder 텍스트 변경
- **해결**:
  ```typescript
  // 복수 selector 조합
  const searchInput = page.locator(
    'input[placeholder="Search"], input[name="search_query"], input[type="search"]'
  ).first();
  ```

---

## PAT-003: 동적 렌더링 요소 클릭 실패

- **증상**: `locator.click()` 후 아무 반응 없음
- **원인**: 요소가 viewport 밖 또는 다른 요소에 가려짐
- **해결**:
  ```typescript
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ force: true });
  ```

---

## PAT-004: 외부 앱 팝업 처리

- **증상**: 데스크탑 앱 실행 다이얼로그 또는 팝업 표시
- **원인**: `melonplayer://`, `spotifydesktop://` 등 프로토콜 핸들러
- **해결**:
  ```typescript
  // 팝업 감지 후 BLOCKED 처리
  const isBlocked = await page.locator('text=설치', 'text=앱 실행').isVisible({timeout: 3000})
    .catch(() => false);
  if (isBlocked) {
    test.skip(true, '데스크탑 앱 필요 — BLOCKED');
  }
  ```
- **적용 TC**: TC-002 (Melon)

---

## PAT-005: YouTube 비디오 selector 변경

- **증상**: `ytd-video-renderer a[href*="/watch"]` 요소 수 0
- **원인**: YouTube DOM 구조 업데이트
- **해결**:
  ```typescript
  // 더 범용적인 href 패턴 사용
  const videos = page.locator('a[href*="/watch?v="]');
  ```

---

## PAT-006: 스크린샷 경로 오류

- **증상**: `ENOENT: no such file or directory`
- **원인**: screenshots/ 폴더 미생성
- **해결**:
  ```typescript
  import * as fs from 'fs';
  fs.mkdirSync('../TC-{NNN}/screenshots', { recursive: true });
  await page.screenshot({ path: '../TC-{NNN}/screenshots/final.png' });
  ```

---

## PAT-007: Playwright headless에서 재생 불가

- **증상**: 비디오/오디오 재생이 headless 모드에서 작동 안 함
- **원인**: headless Chrome에서 미디어 코덱 제한
- **해결**:
  ```typescript
  // playwright.config.ts
  use: {
    launchOptions: {
      args: ['--autoplay-policy=no-user-gesture-required']
    }
  }
  ```
  또는 `--headed` 모드로 실행

---

_새 패턴 추가 시 PAT-{NNN} 번호 채번 후 위 형식으로 작성_
