# output/

테스트 케이스별 폴더. 폴더명만 보고 내용 파악 가능하도록 구성.

## 폴더 구조
```
output/
├── TC-{NNN}_{Service}_{Feature}/   ← 테스트 케이스 단위
│   ├── testcase.md                 ← TC 문서 (tc-writer agent)
│   ├── test.spec.ts                ← Playwright 자동화 (playwright-codegen agent)
│   ├── screenshots/                ← 실행 증거 스크린샷
│   └── results/
│       └── YYYY-MM-DD_{STATUS}.md  ← 실행 결과 (result-reporter agent)
└── TS/                             ← Playwright 실행 환경 (node_modules)
    ├── playwright.config.ts
    └── package.json
```

## 현재 TC 목록
| TC | 서비스 | 시나리오 | 최신 결과 |
|----|--------|----------|-----------|
| TC-001 | YouTube | BTS 검색 및 재생 | ✅ PASSED (2026-04-20) |
| TC-002 | Melon | HOT100 2순위 재생 | ⚠️ BLOCKED (2026-04-20) |
| TC-003 | Google | Python 검색 후 Downloads 진입 | ⚠️ BLOCKED (2026-04-20) |
| TC-004 | Google | 뿌리 깊은 산조 조순애 앨범 검색 | ⚠️ BLOCKED (2026-04-20) |
| TC-005 | Melon | 멜론차트 TOP100 순위1 앨범 정보 확인 (Chart-001) | ✅ PASSED (2026-04-20) |

## Playwright 실행
```bash
cd TS
npx playwright test                          # 전체 TC 실행
npx playwright test ../TC-001_*/test.spec.ts # 특정 TC 실행
npx playwright show-report                   # HTML 리포트
```

## STATUS 기준
- ✅ PASSED: 전체 단계 성공
- ❌ FAILED: 단계 실패 또는 앱 오류
- ⚠️ BLOCKED: 외부 의존성(앱 설치, 로그인 등)으로 진행 불가
