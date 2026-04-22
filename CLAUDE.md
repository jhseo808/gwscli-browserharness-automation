# browser-har

browser-harness(CDP)로 실제 Chrome 탐색 → TC 문서화 → Playwright TS 회귀 자동화.
**탐색에서 발견한 모든 것과 발생한 모든 오류는 domain-skills/{domain}/scraping.md에 누적한다.**

---

## 디렉터리 구조

```
browser-har/
├── CLAUDE.md
├── .claude/                             # Claude 설정 및 agent 가이드
│   ├── commands/                        # 슬래시 커맨드
│   │   └── tc.md                        # /tc — 자연어 → TC 전체 파이프라인
│   ├── agents/                          # 단계별 작업 가이드
│   │   ├── tc-writer.md
│   │   ├── test-runner.md
│   │   ├── playwright-codegen.md
│   │   └── result-reporter.md
│   └── skills/                          # agent별 세부 스킬
│       ├── tc-writer/
│       │   └── template.md              # testcase.md 템플릿
│       ├── test-runner/
│       │   ├── domain-skill-template.md # domain-skill 작성 양식
│       │   └── error-log-template.md    # 오류 기록 양식
│       ├── playwright-codegen/
│       │   └── patterns.md              # 셀렉터 패턴 및 오류 해결
│       └── result-reporter/
│           └── status-guide.md          # STATUS 판단 기준
├── browser-harness/                     # CDP Python 제어 엔진
│   ├── domain-skills/{domain}/          # 도메인별 탐색 지식 (자동 누적)
│   │   └── scraping.md                  # selector, URL, 동작 패턴, 오류 기록 통합
│   ├── helpers.py                       # CDP 헬퍼 함수 (편집 가능)
│   ├── SKILL.md                         # browser-harness 사용 지침
│   └── interaction-skills/              # 공통 UI 패턴
└── output/
    ├── README.md                        # TC 목록 인덱스
    ├── TC-{NNN}_{Service}_{Feature}/    # TC 단위 폴더
    │   ├── testcase.md
    │   ├── test.spec.ts
    │   ├── screenshots/
    │   └── results/
    │       └── YYYY-MM-DD_{STATUS}.md
    └── TS/                              # Playwright 실행 환경
        ├── playwright.config.ts         # testDir: ../, testMatch: TC-*/test.spec.ts
        └── node_modules/
```

---

## 워크플로우

```
1. Chrome CDP 연결 확인 (자동 시작)
2. browser-harness 탐색 실행 + 스크린샷
3. testcase.md 작성 (탐색 결과 기반)
4. domain-skills 업데이트
5. test.spec.ts 생성
6. Playwright 실행 여부 사용자 확인 후 실행
7. 결과 → results/*.md, output/README.md 갱신
```

상세 지침 → `.claude/commands/tc.md`

---

## TC 네이밍 규칙

- 폴더: `TC-{NNN}_{Service}_{Feature}` (예: `TC-002_Melon_HOT100_Play`)
- NNN: `ls output/ | grep '^TC-' | sort | tail -1` 로 마지막 번호 확인 후 +1
- STATUS: `PASSED` / `FAILED` / `BLOCKED`

---

## domain-skills 자동 누적 규칙

새 도메인 테스트 시 **반드시** 아래 파일을 생성/업데이트한다.

| 파일 | 업데이트 시점 |
|------|-------------|
| `browser-harness/domain-skills/{domain}/scraping.md` | 탐색 완료 후 및 오류 발생 시 |

- domain = 호스트명에서 www. 제거 후 첫 번째 파트 (예: melon, youtube)
- **다음 테스트 전 반드시 해당 domain-skills 먼저 확인**

---

## 오류 재발 방지 원칙

1. **즉시 기록** — 오류 발생 시 그 자리에서 `scraping.md` 오류 기록 섹션 업데이트
2. **재현 조건** — 증상 / 원인 / 해결 / 예방 4항목 필수
3. **Playwright 오류** — `.claude/skills/playwright-codegen/patterns.md`에 패턴 추가
4. **다음 실행 전 확인** — 동일 도메인이면 scraping.md 읽고 시작

---

## 실행 명령어

```bash
# browser-harness 탐색
cd browser-harness
browser-harness <<'PY'
new_tab("https://target.com")
wait_for_load()
print(page_info())
PY

# Playwright 특정 TC 실행
cd output/TS && NODE_PATH=./node_modules npx playwright test ../TC-{NNN}_*/test.spec.ts --headed

# HTML 리포트
cd output/TS && npm run report
```

---

## TC 결과 현황

TC별 결과는 `output/README.md` 참조.
