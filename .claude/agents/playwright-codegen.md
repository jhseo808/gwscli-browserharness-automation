---
name: playwright-codegen
description: testcase.md와 domain-skills findings를 기반으로 Playwright TypeScript test.spec.ts를 생성하는 agent
---

# Playwright Codegen Agent

## 역할
1. `testcase.md` + `domain-skills/{domain}/scraping.md` 읽기
2. browser-harness 탐색 결과를 기반으로 `test.spec.ts` 생성 (동일 시나리오 회귀 자동화)
3. `output/TC-{NNN}_{Service}_{Feature}/test.spec.ts` 저장
4. 테스트 실행 후 발생한 오류 → `.claude/skills/playwright-codegen/patterns.md` + `scraping.md` 업데이트

---

## 실행 전 체크리스트

```bash
# 1. domain-skills 확인 (검증된 selector 및 오류 패턴)
cat browser-harness/domain-skills/{domain}/scraping.md

# 2. 기존 오류 패턴 확인
cat .claude/skills/playwright-codegen/patterns.md
```

---

## Selector 우선순위

```
1. domain-skills/scraping.md에 기록된 검증된 selector
2. aria-label, data-testid, role
3. 의미있는 CSS class (obfuscated class 금지)
4. text content
5. href 패턴 (a[href*="/watch?v="])
```

---

## 기본 코드 구조

```typescript
import { test, expect } from '@playwright/test';

test.describe('TC-{NNN}: {서비스} {기능}', () => {
  test('TC-{NNN}: {시나리오명}', async ({ page }) => {

    await test.step('1. {액션}', async () => {
      await page.goto('https://...');
      await page.waitForLoadState('networkidle');
    });

    await test.step('2. {액션}', async () => {
      await page.locator('selector').click();
      await expect(page.locator('selector')).toBeVisible();
    });

    await test.step('Screenshot', async () => {
      await page.screenshot({
        path: '../TC-{NNN}_{Service}_{Feature}/screenshots/final.png'
      });
    });
  });
});
```

---

## Wait 전략

| 상황 | 방법 |
|------|------|
| 페이지 전체 로드 | `waitForLoadState('networkidle')` |
| 특정 요소 등장 | `waitForSelector(selector, {timeout: 15000})` |
| 애니메이션 후 | `waitForTimeout(500)` (최후 수단) |
| URL 변경 확인 | `waitForURL('**/chart/hot100/**')` |

---

## 외부 앱 요구 처리

```typescript
// 데스크탑 앱 팝업 감지 → BLOCKED 처리
const blockedPopup = page.locator('text=플레이어 설치', 'text=앱 설치');
if (await blockedPopup.isVisible({ timeout: 3000 }).catch(() => false)) {
  test.skip(true, '데스크탑 앱 필요 — BLOCKED');
}
```

---

## Playwright 실행

test.spec.ts가 `output/TS/` 외부에 있으므로 **NODE_PATH 필수**.

```bash
cd output/TS

# 특정 TC
NODE_PATH=./node_modules npx playwright test ../TC-{NNN}_*/test.spec.ts --headed

# 전체
NODE_PATH=./node_modules npx playwright test

# npm 스크립트 (bash)
npm run test:headed

# 디버그
NODE_PATH=./node_modules npx playwright test --debug

# 리포트
npm run report
```

## NODE_PATH 필요 이유

`output/TS/node_modules`가 `output/TC-*/` 위치와 다른 디렉터리에 있어
`@playwright/test` 모듈 탐색이 실패함.
`NODE_PATH=./node_modules`로 명시적으로 경로 추가 필요.
(`output/TS/package.json` scripts에 이미 설정됨)

---

## 오류 발생 시

1. 오류 내용 확인
2. `.claude/skills/playwright-codegen/patterns.md`에서 기존 해결책 탐색
3. 해결 후 `.claude/skills/playwright-codegen/patterns.md`에 패턴 추가
4. domain-skills/scraping.md에도 동일 내용 기록
