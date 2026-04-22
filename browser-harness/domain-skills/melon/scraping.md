# Melon Domain Skills

**최초 작성**: 2026-04-20
**최근 업데이트**: 2026-04-21

## URL 패턴

| 목적 | URL |
|------|-----|
| 홈 | https://www.melon.com/index.htm |
| 멜론차트 (TOP100) | https://www.melon.com/chart/index.htm |
| HOT100 | https://www.melon.com/chart/hot100/index.htm |
| 일간 차트 | https://www.melon.com/chart/day/index.htm?classCd=AB0000 |

## 네비게이션 구조

- 상단 GNB: 멜론차트 / 최신음악 / 장르음악 / 멜론DJ / 멜론TV / 스타포스트 / 매거진 / 뮤직어워드 / 뮤직웨이브 / 마이뮤직
- 차트 서브탭: TOP100 / **HOT100** / 일간 / 주간 / 월간 / 시대
- HOT100 탭 좌표 (1718×1222 뷰포트 기준): x=469, y=217

## 검증된 Selector

| 요소 | Selector / 방법 | 비고 |
|------|----------------|------|
| 멜론차트 링크 | `a[href*="chart/index"]` | href 패턴 |
| HOT100 링크 | `a[href*="chart/hot100"]` | href 패턴 |
| 멜론차트 텍스트 링크 | `a` + textContent === '멜론차트' | |
| 순위 N번 행 | `.rank` 텍스트가 'N'인 요소 → `.closest('tr')` | |
| 듣기 버튼 (행 내) | `tr` 내 `.btn_play, [class*="play"], button[title*="듣기"]` | |
| 듣기 버튼 좌표 (2순위) | x=1171, y=606 (1718×1222 기준) | 뷰포트 크기에 따라 변동 |

## 페이지 구조

- 프레임워크: 서버사이드 렌더링 (전통적 HTML)
- GNB는 Shadow DOM 없음 — `document.querySelectorAll` 직접 사용 가능
- 차트 데이터는 `tbody tr` 구조
- "현재 선택된 메뉴-멜론차트" 텍스트로 현재 선택 메뉴 판단 가능

## Wait 포인트

- HOT100 탭 클릭 후: `wait_for_load()` 충분
- 듣기 버튼 클릭 후: 2~5초 대기 필요 (플레이어 팝업 등장)

## 알려진 동작 패턴

- HOT100 기준 시각: 매 정시 업데이트 (예: 2026-04-20 14:00)
- 듣기 버튼 클릭 → `melonplayer://` 프로토콜로 데스크탑 앱 실행 시도
- 앱 미설치 시: "멜론 플레이어를 실행 중입니다." → "플레이어 설치 필요" 순서로 팝업
- 로그인 없이도 듣기 버튼 클릭 및 팝업 확인까지는 가능

## TC-006 탐색 추가 발견 (2026-04-21)

- 1377×1271 뷰포트 기준 멜론차트 GNB 좌표: x=931, y=602
- 1377×1271 뷰포트 기준 순위1 앨범 이미지 rect: {x:304, y:491, w:60, h:60} → click(334, 521)
- 앨범 상세 페이지 타이틀: "앨범 정보>멜론"
- 앨범명 selector: `.album_name span` (텍스트 포함), artistName: `.artist_name a`
- TC-006 기준 1위 앨범: "개화" / AKMU (악뮤) / albumId=13312398
- 멜론차트 진입 시 `chart/index.htm` 자체가 TOP100 기본 (별도 탭 클릭 불필요) — TC-005에서도 확인, TC-006 재확인

## TC-005 탐색 추가 발견 (2026-04-20)

- TOP100 페이지는 `chart/index.htm` 진입 시 이미 TOP100 선택 상태
- 순위1 앨범 이미지 좌표 (1018×1799 뷰포트): x=177, y=521
- 앨범 상세 링크: `a[href*="album"]` → `https://www.melon.com/album/detail.htm?albumId=13312398`
- 멜론차트 GNB 링크 좌표 (1018×1799 기준): x=748, y=593

## 오류 기록

### ERR-001: 데스크탑 플레이어 앱 요구로 재생 BLOCKED

- **날짜**: 2026-04-20
- **발생 위치**: TC-002 / browser-harness
- **상태**: 🟡 우회 (BLOCKED 처리)

**증상**
듣기 버튼(x=1171, y=606) 클릭 후:
1. "멜론 플레이어를 실행 중입니다." 로딩 팝업
2. "해당 서비스를 이용하기 위해서는 멜론 플레이어 설치가 필요합니다." 안내 팝업
3. "플레이어 다운로드" 버튼만 제공 — 웹 재생 불가

**원인**
멜론 웹의 음악 재생은 `melonplayer://` 커스텀 프로토콜을 통해 데스크탑 앱으로 위임.
브라우저 내 HTML5 오디오 직접 재생 미지원 (DRM 정책).

**해결 방법**
- 우회: 멜론 데스크탑 플레이어 앱 설치 후 재테스트
- 대안 탐색: 네트워크 탭에서 `melonplayer://` 호출 전 XHR 요청 분석

**예방**
- 멜론 재생 TC는 전제조건에 "멜론 플레이어 앱 설치 필요" 명시
- 앱 미설치 환경(CI 포함)에서는 BLOCKED 처리
- Playwright 코드에서 팝업 감지 로직 필수 포함 (PAT-004 참조)

**관련 파일**
- `output/TC-002_Melon_HOT100_Play/screenshots/player-blocked.png`
- `output/TC-002_Melon_HOT100_Play/results/2026-04-20_BLOCKED.md`

### ERR-002: Playwright Chromium에서 melonplayer:// 프로토콜 미지원

- **날짜**: 2026-04-20
- **발생 위치**: TC-002 / Playwright
- **상태**: 🟡 우회 (test.skip BLOCKED 처리)

**증상**
듣기 버튼 클릭 후 "멜론 플레이어를 실행 중입니다." 팝업에서 멈춤.
실제 Chrome(ERR-001)과 달리 "설치 필요" 팝업으로 넘어가지 않음.

**원인**
Playwright의 Chromium은 `melonplayer://` 커스텀 프로토콜 핸들러가 등록되지 않아
프로토콜 요청이 무시되고 로딩 상태에서 정지.

**해결**
- test.spec.ts에서 "실행 중입니다" 텍스트도 BLOCKED 조건으로 감지
- 두 조건 중 하나라도 해당되면 `test.skip` 처리

**예방**
- 멜론 재생 Playwright 테스트는 항상 두 팝업 텍스트 모두 감지:
  1. `text=설치가 필요합니다` (실제 Chrome)
  2. `text=실행 중입니다` (Playwright Chromium)
