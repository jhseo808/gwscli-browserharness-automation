# Chrome 자동 실행 (Windows CDP)

browser-harness 사용 전, 또는 `no close frame received` 오류 발생 시 사용.
**사용자의 일반 Chrome 프로필(쿠키 포함)에 연결한다. 별도 프로필 사용 안 함.**

## 동작 원리

daemon.py는 `~/AppData/Local/Google/Chrome/User Data/DevToolsActivePort` 파일로 CDP 포트를 찾는다.

| 상태 | 조건 | 처리 |
|------|------|------|
| 정상 | DevToolsActivePort 존재 + 포트 응답 | 스테일 pid만 정리 후 진행 |
| Chrome 미실행 | DevToolsActivePort 없음 | Chrome 일반 프로필로 자동 시작 |
| Chrome 실행 중 (CDP 없음) | DevToolsActivePort 없음 + chrome.exe 프로세스 있음 | 기존 Chrome 종료 후 CDP로 재시작 |
| 데몬 stale | 포트 응답 + WebSocket 오류 | pid 파일 삭제 후 daemon 재연결 |

## 표준 함수 (browser-harness 호출 전 standalone python으로 실행)

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

    # 1. 정상 상태 확인
    if port_file.exists():
        try:
            port = int(port_file.read_text().strip().splitlines()[0])
            if port_alive(port):
                clean_stale_daemon()
                print(f"Chrome CDP active (port {port})")
                return
        except Exception:
            pass
        port_file.unlink(missing_ok=True)

    # 2. Chrome 실행 중인지 확인 (CDP 없이 실행 중인 경우 종료)
    result = subprocess.run(["tasklist", "/FI", "IMAGENAME eq chrome.exe"],
                            capture_output=True, text=True)
    if "chrome.exe" in result.stdout:
        print("Chrome running without CDP — restarting with CDP...")
        subprocess.run(["taskkill", "/F", "/IM", "chrome.exe"],
                       capture_output=True)
        time.sleep(2)

    # 3. Chrome 시작 (일반 프로필, CDP 활성화)
    chrome_candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        str(Path.home() / "AppData/Local/Google/Chrome/Application/chrome.exe"),
    ]
    chrome_exe = next((p for p in chrome_candidates if os.path.exists(p)), None)
    if not chrome_exe:
        raise RuntimeError("Chrome not found. Set BU_CDP_WS manually.")

    print(f"Starting Chrome: {chrome_exe}")
    subprocess.Popen(
        [chrome_exe, "--remote-debugging-port=0",
         "--no-first-run", "--no-default-browser-check"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )

    # 4. DevToolsActivePort 대기
    for i in range(30):
        if port_file.exists():
            try:
                port = int(port_file.read_text().strip().splitlines()[0])
                if port_alive(port):
                    clean_stale_daemon()
                    time.sleep(1)
                    print(f"Chrome started (port {port}, {i+1}s)")
                    return
            except Exception:
                pass
        time.sleep(1)
    raise RuntimeError("CDP port did not open within 30 seconds.")

ensure_chrome_cdp()
PY
```

## 주의사항

- Chrome이 이미 CDP 없이 실행 중이면 **기존 Chrome 탭이 모두 종료**된다. 중요한 작업이 있으면 저장 후 진행.
- Chrome 재시작 후 일반 프로필(쿠키·로그인 상태)이 그대로 유지된다.
- CAPTCHA 방지: 일반 프로필 사용으로 Google 세션 쿠키가 유지되어 CAPTCHA 미발생.

## 알려진 오류

| 오류 | 원인 | 해결 |
|------|------|------|
| `DevToolsActivePort not found` | Chrome 미실행 또는 CDP 비활성 | 함수 자동 처리 |
| `no close frame received` | 데몬 WebSocket stale | pid 파일 삭제 후 재연결 |
| `connection refused` | Chrome 재시작 중 | 30초 대기 |
