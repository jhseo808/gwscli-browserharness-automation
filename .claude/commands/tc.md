# /tc — 자연어 시나리오 → browser-harness 탐색 → TC 문서화 → test.spec.ts 생성

## 입력
사용자가 자연어로 테스트 시나리오를 설명한다.
예: "멜론 웹 진입하여 top100들어가서 순위2의 재생을 클릭하여 재생하도록해"

## 실행 순서 (순서 엄수)

---

### STEP 0. 사전 분석

입력 문장에서 아래 항목을 추출한다:
- **도메인**: URL의 첫 번째 파트 (예: melon, youtube, naver)
- **서비스명**: PascalCase (예: Melon, YouTube)
- **기능명**: 핵심 액션 기반 PascalCase (예: HOT100_Play, BTS_Search) — 반드시 ASCII만 사용
- **단계 목록**: 사용자가 묘사한 액션을 순서대로 나열

TC 번호 채번:
```bash
ls output/ | grep '^TC-' | sort | tail -1
```
없으면 001부터. 마지막 번호 +1.

TC 폴더 생성 (탐색 전 스크린샷 저장 경로 필요):
```bash
mkdir -p output/TC-{NNN}_{Service}_{Feature}/screenshots
mkdir -p output/TC-{NNN}_{Service}_{Feature}/results
```

---

### STEP 1. domain-skills 확인

```bash
cat browser-harness/domain-skills/{domain}/scraping.md 2>/dev/null || echo "신규 도메인"
```

기존 scraping.md가 있으면 검증된 selector, URL, 알려진 오류를 반드시 숙지하고 시작한다.

---

### STEP 2. Chrome CDP 연결 확인

browser-harness 호출 **전에** standalone Python으로 실행한다.

```bash
python - <<'PY'
import os, subprocess, time, socket as sk, tempfile
from pathlib import Path

def ensure_chrome_cdp():
    PROFILE = Path.home() / "AppData/Local/Google/Chrome/User Data"
    port_file = PROFILE / "DevToolsActivePort"
    def port_alive(p):
        try:
            s = sk.socket(sk.AF_INET, sk.SOCK_STREAM); s.settimeout(1)
            s.connect(("127.0.0.1", p)); s.close(); return True
        except OSError: return False
    def clean_stale_daemon():
        for f in Path(tempfile.gettempdir()).glob("bu-*.pid"):
            f.unlink(missing_ok=True)
    if port_file.exists():
        try:
            port = int(port_file.read_text().strip().splitlines()[0])
            if port_alive(port):
                clean_stale_daemon(); print(f"Chrome CDP active (port {port})"); return
        except Exception: pass
        port_file.unlink(missing_ok=True)
    result = subprocess.run(["tasklist", "/FI", "IMAGENAME eq chrome.exe"],
                            capture_output=True, text=True)
    if "chrome.exe" in result.stdout:
        print("Chrome running without CDP - restarting...")
        subprocess.run(["taskkill", "/F", "/IM", "chrome.exe"], capture_output=True)
        time.sleep(2)
    chrome_exe = next((p for p in [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        str(Path.home() / "AppData/Local/Google/Chrome/Application/chrome.exe"),
    ] if os.path.exists(p)), None)
    if not chrome_exe: raise RuntimeError("Chrome not found")
    print("Starting Chrome...")
    subprocess.Popen([chrome_exe, "--remote-debugging-port=0",
                      "--no-first-run", "--no-default-browser-check"],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for i in range(30):
        if port_file.exists():
            try:
                port = int(port_file.read_text().strip().splitlines()[0])
                if port_alive(port):
                    clean_stale_daemon(); time.sleep(1)
                    print(f"Chrome started (port {port}, {i+1}s)"); return
            except Exception: pass
        time.sleep(1)
    raise RuntimeError("CDP port did not open")

ensure_chrome_cdp()
PY
```

> Chrome이 CDP 없이 실행 중이면 기존 탭이 종료되고 재시작된다.
> 상세 → `browser-harness/interaction-skills/chrome-autostart.md`

---

### STEP 3. browser-harness 탐색 실행

**규칙:**
- 첫 진입은 반드시 `new_tab(url)`
- 각 액션 후 `screenshot()` → 즉시 `output/TC-{NNN}_{Service}_{Feature}/screenshots/{단계번호}_{액션}.png`로 복사
- `page_info()`로 URL, 타이틀 확인
- 요소 찾기는 `js()`로 selector/좌표 추출 후 `click(x, y)`

```bash
browser-harness <<'PY'
import shutil

# 1. 첫 페이지 진입
new_tab("{시작 URL}")
wait_for_load()
path = screenshot()
shutil.copy(path, "output/TC-{NNN}_{Service}_{Feature}/screenshots/01_home.png")
print(page_info())

# 이후 단계: 사용자 요청 액션 순서대로 실행
# 각 단계마다 screenshot() → shutil.copy()
# 요소 탐색: js('JSON.stringify(Array.from(document.querySelectorAll("...")).map(...))')
# 클릭: click(x, y)
# 로드 대기: wait_for_load()
PY
```

탐색 중 발견한 정보(selector, URL 패턴, 좌표, 동작 특성, 오류)를 모두 기록해둔다.

---

### STEP 4. testcase.md 작성

탐색 완료 후 실제로 확인된 내용을 바탕으로 작성한다.
`.claude/skills/tc-writer/template.md` 양식 사용.

- 단계는 사용자 관점 액션으로 기술 (selector 등 구현 디테일 배제)
- 탐색에서 확인된 URL, 화면 전환, 제약사항 반영
- 알려진 제약사항은 domain-skills에서 가져옴

---

### STEP 5. domain-skills 업데이트

`browser-harness/domain-skills/{domain}/scraping.md`를 생성 또는 업데이트한다.
- 신규 도메인: `.claude/skills/test-runner/domain-skill-template.md` 양식으로 생성
- 기존 도메인: 새로 발견한 selector/패턴 추가 (기존 내용 삭제 금지)
- 오류 발생 시: 오류 기록 섹션에 추가

---

### STEP 6. test.spec.ts 생성

**입력 자료:**
- 탐색에서 직접 확인한 selector/좌표
- `browser-harness/domain-skills/{domain}/scraping.md`
- STEP 4에서 작성한 testcase.md

**생성 규칙:**
- `output/TC-{NNN}_{Service}_{Feature}/test.spec.ts`로 저장
- 각 testcase.md 단계를 `test.step()` 블록으로 1:1 매핑
- 외부 앱 요구(팝업, 프로토콜 핸들러) 감지 시 `test.skip` BLOCKED 처리 포함
- selector 우선순위: scraping.md 검증 selector > aria/data-testid > 의미있는 CSS class > text > href 패턴
- `waitForLoadState('domcontentloaded')` + `waitForTimeout` 조합 사용
- 스크린샷 경로: `../TC-{NNN}_{Service}_{Feature}/screenshots/{단계번호}_{액션}.png`

---

### STEP 7. Playwright 실행 여부 확인

test.spec.ts 생성 후 **반드시 사용자에게 실행 여부를 묻는다.**

```
Playwright 테스트를 실행할까요?
  - output/TC-{NNN}_{Service}_{Feature}/test.spec.ts
```

사용자가 **확인하면** STEP 8 실행. **거부하면** STEP 9로 바로 이동.

---

### STEP 8. Playwright 테스트 실행 (사용자 승인 시)

```bash
cd output/TS && NODE_PATH=./node_modules npx playwright test ../TC-{NNN}_{Service}_{Feature}/test.spec.ts --headed
```

**STATUS 판정:**
- 모든 단계 통과 → **PASSED**
- 단계 실패 → **FAILED** (test.spec.ts 수정 후 재실행, 최대 2회)
- 외부 앱/로그인 등 환경 제약 → **BLOCKED**

---

### STEP 9. 결과 보고

**결과 파일 생성:**
- `output/TC-{NNN}_{Service}_{Feature}/results/YYYY-MM-DD_{STATUS}.md`

> CLAUDE.md와 output/README.md는 갱신하지 않는다.

---

## 완료 보고 형식

```
✅ TC-{NNN} 완료
- 서비스: {Service}
- 시나리오: {Feature}
- browser-harness: 성공 / 오류
- Playwright: PASSED / BLOCKED / 미실행
- 생성 파일:
  - output/TC-{NNN}_{Service}_{Feature}/testcase.md
  - output/TC-{NNN}_{Service}_{Feature}/test.spec.ts
  - output/TC-{NNN}_{Service}_{Feature}/results/YYYY-MM-DD_{STATUS}.md (실행 시)
```
