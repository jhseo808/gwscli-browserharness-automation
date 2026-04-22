# Google Domain Skills

**최초 작성**: 2026-04-20
**최근 업데이트**: 2026-04-20 (TC-004 탐색 완료)

## URL 패턴

| 목적 | URL |
|------|-----|
| 홈 | https://www.google.com |
| 검색결과 | https://www.google.com/search?q={query} |

## 검증된 Selector

| 요소 | Selector | 비고 |
|------|----------|------|
| 검색창 | `textarea[name="q"]` | 홈/결과 페이지 공통. 좌표(1718×1222 기준): x=773, y=402 |
| 검색 버튼 | Enter 키 | `press_key("Enter")` 사용 |
| 검색결과 첫번째 제목 | `h3` (비google.com href) 첫번째 | 검증됨: "Welcome to Python.org" x=334, y=201 |
| Python.org Downloads | `nav a[href*="downloads"]` 또는 텍스트 "Downloads" | 좌표: x=575, y=188 (1718×1222 기준) |

## 페이지 구조

- 홈 검색창: `<textarea name="q" ...>` (구형 `<input>` 아님)
- 검색결과 제목: `<h3>` 안에 링크텍스트, `closest("a")`로 href 획득
- Google 자체 링크(google.com 포함) 제외 후 첫번째가 실제 검색결과

## Wait 포인트

- 검색 Enter 후: `waitForLoadState('domcontentloaded')` + 2초 대기
- 결과 페이지 이동 후: `waitForLoadState('networkidle')` 권장

## 알려진 동작 패턴

- 검색창 좌표(1718×1222 뷰포트): x=773, y=402
- `type_text()` 전 반드시 `click()` 호출 (포커스 확보)
- 검색 실행: `press_key("Enter")`
- python 검색 결과 1위: "Welcome to Python.org" → https://www.python.org/ (x=334, y=201)
- python.org Downloads 메뉴: x=575, y=188 → https://www.python.org/downloads/
- ERR-001 우회: TestData 프로필에서 1회 수동 검색 후 쿠키 확립 시 CAPTCHA 없음 (검증됨)
- 한글 검색어 정상 동작 (`type_text()` 한글 직접 입력 가능)
- 검색결과 클릭 시 Google 내부 리디렉트로 이동 안 될 수 있음 → `goto(href)` 직접 이동 권장
- "뿌리 깊은 산조 조순애" 검색 → Bugs Music 앨범: https://music.bugs.co.kr/album/215311

## 오류 기록

### ERR-001: 신규 프로필에서 Google reCAPTCHA 차단

- **날짜**: 2026-04-20
- **발생 위치**: TC-003 / browser-harness 탐색
- **상태**: ✅ 우회 확인 (쿠키 확립 후 정상)

**증상**
- TestData 전용 프로필(쿠키 없음)에서 검색 시 `/sorry/index` reCAPTCHA 리다이렉트
- URL 직접 이동(`goto("...search?q=python")`)도 동일하게 차단

**원인**
- 새 프로필에 Google 세션 쿠키 없음
- 짧은 간격 내 반복 요청 → 봇으로 탐지

**해결 방법**
- browser-harness 탐색: Chrome TestData 프로필에서 수동으로 CAPTCHA 해결 후 진행
- Playwright 테스트: `waitForTimeout(1500)` 간격 추가, `userAgent` 설정 고려
- 장기 해결: `storageState`로 인증 쿠키 저장·재사용 (`output/TS/auth.json`)

**예방**
- 처음 TestData 프로필 사용 전 수동으로 Google 검색 1회 수행 (쿠키 확립)
- Playwright 테스트에서 CAPTCHA URL 감지 → `test.skip` BLOCKED 처리

**관련 파일**
- `output/TC-003_Google_Python_Download_Search/screenshots/02a_captcha.png`
