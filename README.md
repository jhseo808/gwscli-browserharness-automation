# browser-har

> **Chrome CDP 기반 웹 자동화 테스트 프레임워크**  
> 실제 Chrome을 직접 제어해 탐색 → TC 문서화 → Playwright 회귀 자동화 → Google Sheets 결과 기록까지 전 과정을 Claude Code AI 에이전트가 수행한다.

---

## 목차

- [개요](#개요)
- [아키텍처](#아키텍처)
- [디렉터리 구조](#디렉터리-구조)
- [핵심 컴포넌트](#핵심-컴포넌트)
- [워크플로우](#워크플로우)
- [슬래시 커맨드](#슬래시-커맨드)
- [에이전트 시스템](#에이전트-시스템)
- [Domain Skills](#domain-skills)
- [실행 방법](#실행-방법)
- [설치 및 환경 구성](#설치-및-환경-구성)

---

## 개요

**browser-har**는 Claude Code(AI)가 실제 Chrome 브라우저를 CDP(Chrome DevTools Protocol)로 직접 제어하며 웹 서비스를 탐색하고, 그 결과를 바탕으로 테스트 케이스 문서와 Playwright 회귀 테스트 코드를 자동 생성하는 통합 테스트 자동화 프레임워크다.

### 주요 특징

| 특징 | 설명 |
|------|------|
| **실제 Chrome 제어** | CDP를 통해 사용자의 실제 Chrome 브라우저를 직접 조작 — headless/샌드박스 없음 |
| **AI 기반 탐색** | Claude Code가 페이지 구조를 분석하고 selector를 추출해 클릭·입력 수행 |
| **자동 TC 생성** | 탐색 결과로부터 `testcase.md` 및 `test.spec.ts` 자동 생성 |
| **누적 지식베이스** | 탐색에서 발견한 모든 정보를 `domain-skills/`에 자동 축적 |
| **Google Sheets 연동** | `/tc-sheet` 커맨드로 스프레드시트 TC → 탐색 → 결과 기록 전 자동화 |

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                     Claude Code (AI)                    │
│  슬래시 커맨드(/tc, /tc-sheet) + 에이전트 오케스트레이션  │
└───────────────────────┬─────────────────────────────────┘
                        │
          ┌─────────────▼──────────────┐
          │      browser-harness       │
          │  (Python CDP 제어 엔진)     │
          │  run.py → daemon.py → CDP  │
          └─────────────┬──────────────┘
                        │ WebSocket (CDP)
          ┌─────────────▼──────────────┐
          │     Chrome Browser         │
          │  (실제 사용자 브라우저)     │
          │  DevToolsActivePort 자동감지 │
          └────────────────────────────┘

결과 산출물:
  output/TC-{NNN}_{Service}_{Feature}/
    ├── testcase.md        (TC 문서)
    ├── test.spec.ts       (Playwright 회귀 자동화)
    ├── screenshots/       (탐색 증거 스크린샷)
    └── results/           (실행 결과)

부가 연동:
  Google Sheets (tools/gws) ←→ /tc-sheet 커맨드
```

---

## 디렉터리 구조

```
browser-har/
│
├── CLAUDE.md                          # AI 에이전트 핵심 지침 (워크플로우, 규칙)
├── README.md                          # 이 파일
│
├── .claude/                           # Claude Code 설정 및 에이전트 가이드
│   ├── commands/                      # 슬래시 커맨드 정의
│   │   ├── tc.md                      # /tc — 자연어 → TC 전체 파이프라인
│   │   └── tc-sheet.md                # /tc-sheet — Google Sheets TC → 탐색 → 시트 기록
│   ├── agents/                        # 단계별 전문 에이전트 가이드
│   │   ├── tc-writer.md               # TC 문서 생성 에이전트
│   │   ├── test-runner.md             # browser-harness 탐색 실행 에이전트
│   │   ├── playwright-codegen.md      # test.spec.ts 생성 에이전트
│   │   └── result-reporter.md        # 결과 기록 에이전트
│   └── skills/                        # 에이전트별 세부 스킬 문서
│       ├── tc-writer/
│       │   └── template.md            # testcase.md 표준 템플릿
│       ├── test-runner/
│       │   ├── domain-skill-template.md  # domain-skills 작성 양식
│       │   └── error-log-template.md     # 오류 기록 양식
│       ├── playwright-codegen/
│       │   └── patterns.md            # selector 패턴 및 오류 해결 레시피 (PAT-001~007)
│       └── result-reporter/
│           └── status-guide.md        # PASSED/FAILED/BLOCKED 판단 기준
│
├── browser-harness/                   # CDP Python 제어 엔진
│   ├── helpers.py                     # 핵심 CDP 헬퍼 함수 모음
│   ├── SKILL.md                       # browser-harness 사용 전체 지침
│   ├── domain-skills/                 # 도메인별 탐색 지식베이스 (70개 이상)
│   │   ├── melon/
│   │   │   └── scraping.md            # 멜론 URL/selector/오류 기록 (자동 누적)
│   │   ├── youtube/                   # YouTube domain-skills
│   │   ├── google/                    # Google domain-skills
│   │   ├── amazon/, github/, spotify/ # 기타 pre-built domain-skills
│   │   └── ... (70개+ 도메인)
│   └── interaction-skills/            # 공통 UI 패턴 가이드
│       ├── chrome-autostart.md        # Chrome CDP 자동 시작/복구
│       ├── connection.md              # 탭 연결 및 가시성 처리
│       ├── cookies.md                 # 쿠키 관리
│       ├── cross-origin-iframes.md    # 크로스 오리진 iframe 처리
│       ├── dialogs.md                 # alert/confirm/prompt 처리
│       ├── downloads.md               # 파일 다운로드
│       ├── shadow-dom.md              # Shadow DOM 접근
│       ├── scrolling.md               # 스크롤 제어
│       ├── tabs.md                    # 탭 관리
│       ├── uploads.md                 # 파일 업로드
│       ├── viewport.md                # 뷰포트 설정
│       └── ... (15개+ 패턴)
│
├── output/                            # TC 결과 저장소
│   ├── README.md                      # TC 목록 인덱스 (현황 테이블)
│   ├── TC-{NNN}_{Service}_{Feature}/  # TC 단위 폴더 (자동 생성)
│   │   ├── testcase.md
│   │   ├── test.spec.ts
│   │   ├── screenshots/
│   │   └── results/
│   └── TS/                            # Playwright 실행 환경
│       ├── playwright.config.ts       # testDir: ../, testMatch: TC-*/test.spec.ts
│       ├── package.json               # @playwright/test ^1.40.0, typescript ^5.0.0
│       └── node_modules/
│
└── tools/                             # 외부 도구 연동
    └── gws/                           # Google Workspace CLI (gws)
        ├── package.json               # npx gws 실행환경
        └── client_secret.json         # Google OAuth 인증 정보
```

---

## 핵심 컴포넌트

### 1. browser-harness (`browser-harness/helpers.py`)

실제 Chrome을 CDP WebSocket으로 직접 제어하는 Python 라이브러리.  
`browser-harness <<'PY' ... PY` 형태로 호출하며 모든 헬퍼 함수가 사전 import된다.

| 함수 | 역할 |
|------|------|
| `new_tab(url)` | 새 탭을 열고 URL 이동 (goto와 달리 기존 탭 보호) |
| `goto(url)` | 현재 탭에서 URL 이동 |
| `wait_for_load(timeout=15)` | `document.readyState == 'complete'` 폴링 대기 |
| `page_info()` | 현재 URL, 타이틀, 뷰포트, 스크롤 위치 반환 |
| `screenshot(path=None)` | PNG 스크린샷 촬영 후 경로 반환 |
| `click(x, y)` | CDP `Input.dispatchMouseEvent`로 좌표 클릭 (iframe/Shadow DOM 투과) |
| `type_text(text)` | `Input.insertText`로 텍스트 입력 |
| `press_key(key)` | Enter, Tab, Escape 등 특수키 입력 |
| `scroll(x, y, dy)` | 마우스 휠 스크롤 |
| `js(expression)` | `Runtime.evaluate`로 JS 실행 및 결과 반환 |
| `cdp(method, **params)` | Raw CDP 명령 직접 전송 |
| `http_get(url)` | 브라우저 없이 순수 HTTP 요청 (고속 스크래핑용) |
| `list_tabs()` | 열린 탭 목록 반환 |
| `switch_tab(target_id)` | 특정 탭으로 전환 |
| `ensure_real_tab()` | chrome:// 내부 탭에서 실제 탭으로 전환 |
| `upload_file(selector, path)` | CDP로 파일 입력 설정 |

**아키텍처:**
```
Chrome / Browser Use Cloud → CDP WebSocket → daemon.py → /tmp/bu-<NAME>.sock → run.py
```
- 프로토콜: JSON 1줄 요청/응답
- `BU_NAME` 환경변수로 다중 브라우저 세션 네임스페이스 지원

### 2. Chrome CDP 자동 시작

browser-harness 호출 전 standalone Python 스크립트로 Chrome CDP 연결을 보장한다.

- `DevToolsActivePort` 파일로 포트 감지
- Chrome 미실행 시 자동 시작 (`--remote-debugging-port=0`)
- CDP 없이 실행 중인 Chrome은 재시작
- 30초 폴링으로 포트 개방 대기

### 3. Playwright 실행 환경 (`output/TS/`)

```typescript
// playwright.config.ts 핵심 설정
{
  testDir: '../',                        // output/ 전체를 testDir로
  testMatch: ['TC-*/test.spec.ts'],      // TC 폴더 내 spec 파일 자동 감지
  fullyParallel: true,
  workers: 4,
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }]
}
```

**실행 시 NODE_PATH 필수:**  
`output/TC-*/` 위치에서 `output/TS/node_modules`를 탐색하려면 `NODE_PATH=./node_modules` 명시 필요.  
`package.json` scripts에 이미 설정되어 있음.

### 4. Google Sheets 연동 (`tools/gws/`)

`gws` CLI(Google Workspace SDK)를 사용해 스프레드시트 읽기/쓰기.  
DEMO_TestCase 시트(ID: `1nKX_YOLg8-F5KE_7Vw-sQJ7qoevB8iUOEfG5pS1gI5M`)와 연동.

```bash
# 시트 읽기
cd tools/gws && npx gws sheets spreadsheets values get \
  --params '{"spreadsheetId": "...", "range": "시트1!A1:J100"}'

# J열에 결과 기록
cd tools/gws && npx gws sheets spreadsheets values update \
  --params '{"spreadsheetId": "...", "range": "시트1!J2", "valueInputOption": "RAW"}' \
  --json '{"values": [["PASS"]]}'
```

---

## 워크플로우

### /tc 워크플로우 (자연어 → 전체 자동화)

```
STEP 0. 사전 분석
  └─ 도메인·서비스명·기능명 추출, TC 번호 채번, 폴더 생성

STEP 1. domain-skills 확인
  └─ browser-harness/domain-skills/{domain}/scraping.md 로드
     기존 selector, URL 패턴, 알려진 오류 사전 숙지

STEP 2. Chrome CDP 연결 확인
  └─ DevToolsActivePort 감지 → 필요 시 Chrome 자동 시작

STEP 3. browser-harness 탐색 실행
  └─ new_tab(url) → 단계별 액션 → 각 단계마다 screenshot() 저장
     js()로 selector 추출, click(x, y)로 클릭

STEP 4. testcase.md 작성
  └─ 탐색 결과 기반, 사용자 관점 액션 기술
     template.md 양식 적용

STEP 5. domain-skills 업데이트
  └─ 발견한 selector/URL/오류 → scraping.md에 누적
     기존 내용 삭제 금지, 추가만

STEP 6. test.spec.ts 생성
  └─ testcase.md + scraping.md 기반 Playwright 코드 생성
     각 단계 → test.step() 1:1 매핑
     외부 앱 요구 시 test.skip BLOCKED 처리 포함

STEP 7. Playwright 실행 여부 사용자 확인
  └─ 승인 시 → STEP 8 실행 / 거부 시 → STEP 9

STEP 8. Playwright 테스트 실행 (사용자 승인 시)
  └─ cd output/TS && npx playwright test ../TC-{NNN}_*/test.spec.ts --headed
     최대 2회 재시도

STEP 9. 결과 보고
  └─ output/TC-{NNN}_{Service}_{Feature}/results/YYYY-MM-DD_{STATUS}.md 생성
```

### /tc-sheet 워크플로우 (Google Sheets 연동)

```
STEP 0. 시트에서 TC 읽기
  └─ TC-ID(B열) 매칭 → H열(테스트 스텝), I열(기대결과), G열(선행조건) 추출

STEP 1. TC 정보 출력 및 확인

STEP 2. /tc 파이프라인 전체 실행
  └─ 폴더명: TC-{NNN}_{Service}_{Feature} (Depth1 기반 PascalCase)

STEP 3. 결과를 시트 J열에 기록
  └─ browser-harness 결과 기준: PASS / FAIL / BLOCKED

STEP 4. 완료 보고
```

---

## 슬래시 커맨드

### `/tc` — 자연어 시나리오 → TC 전체 파이프라인

```bash
# 사용 예
/tc 멜론 웹 진입하여 top100 들어가서 순위1의 앨범 이미지를 클릭해줘
```

STEP 0~9 전체를 순서대로 수행. TC 폴더, testcase.md, test.spec.ts, results 파일을 모두 생성.

### `/tc-sheet` — Google Sheets TC-ID 기반 실행

```bash
# 사용 예
/tc-sheet Chart-001 TC를 테스트 해줘
```

DEMO_TestCase 시트에서 해당 TC-ID 행을 읽고 `/tc` 파이프라인을 실행한 후 J열에 결과를 기록.

**스프레드시트 컬럼 구조:**

| 열 | 항목 |
|----|------|
| A | NO |
| B | TC-ID |
| C | Depth1 |
| D | Depth2 |
| E | Depth3 |
| F | 우선순위 |
| G | 선행조건 |
| H | 테스트수행내역 (테스트 스텝) |
| I | 테스트기대결과 |
| J | 테스트결과 (PASS/FAIL/BLOCKED) |

---

## 에이전트 시스템

Claude Code 내 4개의 전문 에이전트가 파이프라인을 분담한다.

| 에이전트 | 역할 | 주요 산출물 |
|----------|------|------------|
| **tc-writer** | TC 번호 채번, 폴더 생성, testcase.md 작성 | `testcase.md` |
| **test-runner** | browser-harness 탐색 실행, 스크린샷 저장, domain-skills 업데이트 | `screenshots/*.png`, `scraping.md` |
| **playwright-codegen** | test.spec.ts 생성, Playwright 오류 패턴 관리 | `test.spec.ts` |
| **result-reporter** | 결과 파일 생성, output/README.md 갱신 | `results/*.md` |

### Playwright 오류 패턴 (`.claude/skills/playwright-codegen/patterns.md`)

누적된 오류 해결 패턴 레시피:

| PAT | 증상 | 해결 |
|-----|------|------|
| PAT-001 | `networkidle` 타임아웃 | `domcontentloaded` + 고정 대기로 대체 |
| PAT-002 | 검색창 selector 불일치 | 복수 selector 조합 (`input[name], input[type]`) |
| PAT-003 | 동적 요소 클릭 실패 | `scrollIntoViewIfNeeded()` + `click({force: true})` |
| PAT-004 | 외부 앱 팝업 | 팝업 텍스트 감지 후 `test.skip` BLOCKED 처리 |
| PAT-005 | YouTube selector 변경 | `a[href*="/watch?v="]` 범용 패턴 사용 |
| PAT-006 | 스크린샷 경로 오류 | `mkdirSync({recursive: true})` 선행 |
| PAT-007 | headless 재생 불가 | `--autoplay-policy=no-user-gesture-required` 또는 `--headed` |

---

## Domain Skills

`browser-harness/domain-skills/` 하위에 **70개 이상의 도메인 지식베이스**가 사전 내장되어 있다.  
새 도메인 탐색 시 `scraping.md`가 자동 생성/업데이트된다.

### Pre-built domain-skills (70개+)

amazon, arxiv, booking-com, capterra, coingecko, coinmarketcap, coursera, duckduckgo, ebay, etsy, fred, g2, genius, github, glassdoor, google, hackernews, letterboxd, linkedin, medium, metacritic, musicbrainz, nasa, stackoverflow, steam, tiktok, tradingview, trustpilot, walmart, youtube 등

---

## 실행 방법

### TC 생성 및 탐색 실행

```bash
# 자연어 시나리오로 TC 전체 파이프라인 실행
/tc 유튜브에서 BTS 검색하고 첫 번째 영상을 재생해줘

# Google Sheets TC-ID로 실행
/tc-sheet Chart-001 TC를 테스트 해줘
```

### browser-harness 직접 호출

```bash
cd browser-harness

# 기본 사용
browser-harness <<'PY'
new_tab("https://www.melon.com/chart/index.htm")
wait_for_load()
print(page_info())
path = screenshot()
print(path)
PY

# JS로 요소 탐색
browser-harness <<'PY'
result = js('JSON.stringify(Array.from(document.querySelectorAll("a")).filter(a=>a.textContent.trim()==="멜론차트").map(a=>({text:a.textContent.trim(),href:a.href,rect:JSON.stringify(a.getBoundingClientRect())})))')
print(result)
PY
```

### Playwright 테스트 실행

```bash
# 특정 TC 실행
cd output/TS
NODE_PATH=./node_modules npx playwright test ../TC-{NNN}_*/test.spec.ts --headed

# 전체 TC 실행
npm run test          # headless
npm run test:headed   # 브라우저 표시
npm run test:debug    # 디버그 모드

# HTML 리포트
npm run report
```

---

## 설치 및 환경 구성

### 사전 요구사항

| 항목 | 버전 / 내용 |
|------|------------|
| Python | 3.13+ |
| Node.js | 18+ |
| Chrome | 최신 버전 (CDP 지원) |
| Claude Code | CLI 설치 필요 |

### Python 환경 설정

```bash
# 가상환경 생성 (이미 .venv 존재)
python -m venv .venv
.venv/Scripts/activate       # Windows
source .venv/bin/activate    # macOS/Linux

# 의존성 설치
pip install -r requirements.txt
```

### Playwright 설치

```bash
cd output/TS
npm install
npx playwright install chromium
```

### Google Sheets 연동 설정

```bash
cd tools/gws
npm install

# Google OAuth 인증 (최초 1회)
# client_secret.json이 준비된 상태에서
npx gws auth
```

### Chrome CDP 연결

Chrome이 실행 중이지 않아도 된다. browser-harness 호출 시 자동으로:
1. `DevToolsActivePort` 파일로 CDP 포트 감지
2. Chrome 미실행 시 `--remote-debugging-port=0` 옵션으로 자동 시작
3. CDP 없이 실행 중인 Chrome은 재시작 후 CDP 활성화

---

## TC 폴더 내부 구조

각 `output/TC-{NNN}_{Service}_{Feature}/` 폴더는 다음으로 구성된다.

```
TC-{NNN}_{Service}_{Feature}/
├── testcase.md              # TC 문서 (사용자 관점 시나리오)
│   ├── 전제조건
│   ├── 테스트 단계 (단계 | 액션 | 기대결과)
│   ├── 기대 결과
│   ├── 실패 조건
│   └── 알려진 제약사항
├── test.spec.ts             # Playwright 회귀 테스트
│   └── test.step() 블록으로 각 단계 1:1 매핑
├── screenshots/             # 탐색 중 저장된 증거 스크린샷
│   ├── 01_home.png
│   ├── 02_{action}.png
│   └── ...
└── results/
    └── YYYY-MM-DD_{STATUS}.md  # 실행 결과 (PASSED/FAILED/BLOCKED)
```

---

## 오류 재발 방지 원칙

1. **즉시 기록** — 오류 발생 시 그 자리에서 `scraping.md` 오류 기록 섹션 업데이트
2. **재현 조건** — 증상 / 원인 / 해결 / 예방 4항목 필수 기술
3. **Playwright 오류** — `.claude/skills/playwright-codegen/patterns.md`에 PAT 패턴 추가
4. **다음 실행 전 확인** — 동일 도메인이면 `scraping.md` 읽고 시작

---

## TC 네이밍 규칙

```bash
# 마지막 TC 번호 확인
ls output/ | grep '^TC-' | sort | tail -1

# 폴더명 규칙
TC-{NNN}_{Service}_{Feature}
# 예: TC-006_MelonChart_Chart001

# NNN: 3자리 제로패딩 (001, 002, ...)
# Service: Depth1 기반 PascalCase (Melon, YouTube, Google)
# Feature: TC-ID 또는 기능명 기반 PascalCase, ASCII only
```
