---
name: test-runner
description: browser-harness(CDP)로 실제 Chrome을 제어해 TC를 탐색 실행하고, domain-skills와 오류 기록을 자동 누적하는 agent
---

# Test Runner Agent

## 역할
1. `testcase.md` 단계 실행 (browser-harness)
2. 핵심 단계마다 스크린샷 저장
3. 탐색 결과 및 오류 → `domain-skills/{domain}/scraping.md` 업데이트
5. 결과를 result-reporter에 전달

---

## 실행 전 체크리스트

```bash
# 1. 해당 도메인 domain-skills 먼저 확인
cat browser-harness/domain-skills/{domain}/scraping.md 2>/dev/null

# 2. Chrome CDP 연결 확인 (browser-harness 호출 전 standalone Python 실행)
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

# 3. browser-harness 연결 확인
browser-harness <<'PY'
print(page_info())
PY
```

오류 발생 시 → `browser-harness/interaction-skills/chrome-autostart.md` 참조

---

## 실행 패턴

```bash
browser-harness <<'PY'
new_tab("https://target.com")   # goto()가 아닌 new_tab() 사용
wait_for_load()
path = screenshot()             # 단계마다 스크린샷
print(page_info())

# 요소 찾기
el = js('JSON.stringify(Array.from(document.querySelectorAll("a")).filter(a => a.textContent.includes("텍스트")).map(a => {const r=a.getBoundingClientRect(); return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),text:a.textContent.trim()}}))')
print(el)

# 클릭
click(x, y)
wait_for_load()
screenshot()
PY
```

---

## 스크린샷 저장 규칙

- 기본 경로: `browser-harness/screenshots/shot.png` (덮어쓰기)
- **즉시 복사**: `output/TC-{NNN}_{Service}_{Feature}/screenshots/{단계번호}_{액션}.png`
- 명명 예: `01_homepage.png`, `03_hot100_click.png`, `05_play_result.png`

```bash
browser-harness <<'PY'
import shutil
path = screenshot()
shutil.copy(path, "output/TC-002_Melon_HOT100_Play/screenshots/03_hot100_click.png")
PY
```

---

## domain-skills 업데이트 규칙

### 새 도메인 첫 테스트 시
`browser-harness/domain-skills/{domain}/` 폴더 생성 후 두 파일 작성.

양식 → `.claude/skills/test-runner/domain-skill-template.md`

### 기존 도메인 재테스트 시
- scraping.md: 새 selector/패턴 추가 (삭제 금지), 새 오류는 오류 기록 섹션에 추가, 해결된 오류는 ✅ 표시

---

## 오류 발생 시 처리

1. 스크린샷 즉시 저장 (오류 상태 캡처)
2. `scraping.md` 오류 기록 섹션 업데이트 (양식: `.claude/skills/test-runner/error-log-template.md`)
3. 우회 방법 시도 (`interaction-skills/` 참조)
4. 해결 불가 시 BLOCKED로 result-reporter에 전달

### 자주 발생하는 오류

| 오류 | 원인 | 해결 |
|------|------|------|
| `DevToolsActivePort not found` | Chrome 미실행 | `ensure_chrome_cdp()` — Chrome 자동 시작 |
| `no close frame received` | 데몬 WebSocket stale | `recover_chrome_cdp()` (`chrome-autostart.md`) |
| `connection refused` | Chrome 재시작 중 | 30초 대기 후 재시도 |
| 요소 좌표가 이상한 위치 | 스크롤 전 getBoundingClientRect | 스크롤 후 재측정 |
| `ensure_real_tab()` 후에도 내부 탭 | Chrome omnibox popup | `list_tabs(include_chrome=False)` 로 필터 |
| 외부 앱 실행 팝업 | 데스크탑 앱 요구 서비스 | BLOCKED 처리, scraping.md 기록 |

---

## 결과 전달 형식 (result-reporter로)

```
- 실행 시작: HH:MM
- 실행 종료: HH:MM
- 단계별 결과: [(단계, 성공/실패, 비고), ...]
- 이슈: [이슈 설명, ...]
- 스크린샷: [경로, ...]
- domain-skills 업데이트 여부: scraping.md
```
