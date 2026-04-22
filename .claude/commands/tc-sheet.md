# /tc-sheet — Google Sheets TC-ID → browser-harness 탐색 → test.spec.ts → 결과 시트 기록

## 입력
TC-ID (예: `Chart-001`, `New-01`, `DJ-01`)

## 스프레드시트 정보
- **파일명**: DEMO_TestCase
- **ID**: `1nKX_YOLg8-F5KE_7Vw-sQJ7qoevB8iUOEfG5pS1gI5M`
- **시트명**: 시트1
- **컬럼 구조**:
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
  | I | 테스트기대결과 (기대 결과) |
  | J | 테스트결과 (PASS/FAIL/BLOCKED 기록) |

---

## 실행 순서

### STEP 0. 시트에서 TC 읽기

```bash
cd tools/gws && npx gws sheets spreadsheets values get \
  --params '{"spreadsheetId": "1nKX_YOLg8-F5KE_7Vw-sQJ7qoevB8iUOEfG5pS1gI5M", "range": "시트1!A1:J100"}' \
  2>/dev/null
```

응답 JSON에서 TC-ID(B열)가 입력값과 일치하는 행을 찾는다.
- **행 번호** = 헤더(1행) + 데이터 인덱스 + 1 (1-based)
- **H열** = 테스트수행내역 → `/tc` 시나리오 입력으로 사용
- **I열** = 테스트기대결과 → testcase.md 기대결과 항목으로 사용
- **G열** = 선행조건 → testcase.md 선행조건으로 사용

---

### STEP 1. TC 정보 출력 및 확인

읽은 내용을 사용자에게 표시한다:
```
TC-ID: {TC-ID}
Depth: {Depth1} > {Depth2} > {Depth3}
우선순위: {우선순위}
선행조건: {선행조건}
테스트 스텝:
  {H열 내용}
기대결과: {I열 내용}
```

---

### STEP 2. /tc 파이프라인 실행

H열의 테스트수행내역을 시나리오 입력으로 `/tc` 파이프라인 전체를 실행한다.
(`tc.md` 의 STEP 0 ~ STEP 9 순서 엄수)

- TC 폴더명: `TC-{NNN}_{Service}_{Feature}` (ASCII only)
- Service: Depth1 기반 PascalCase
- Feature: TC-ID 기반 PascalCase (예: `Chart001`, `New01`)

---

### STEP 3. 결과를 시트 J열에 기록

**browser-harness 탐색 결과**를 기준으로 J열에 기록한다.
Playwright는 test.spec.ts 생성 및 코드 검증용이며 결과 판정에 사용하지 않는다.

**값 규칙:**
| 결과 | J열 기록값 |
|------|-----------|
| browser-harness 모든 단계 성공 | `PASS` |
| browser-harness 단계 실패 / 오류 | `FAIL` |
| 외부 앱/로그인 등 환경 제약 | `BLOCKED` |

```bash
cd tools/gws && npx gws sheets spreadsheets values update \
  --params "{\"spreadsheetId\": \"1nKX_YOLg8-F5KE_7Vw-sQJ7qoevB8iUOEfG5pS1gI5M\", \"range\": \"시트1!J{행번호}\", \"valueInputOption\": \"RAW\"}" \
  --json "{\"values\": [[\"{결과}\"]]}" \
  2>/dev/null
```

---

### STEP 4. 완료 보고

```
✅ TC-Sheet 완료
- TC-ID: {TC-ID}
- 시트 행: {행번호}
- browser-harness: 성공 / 오류
- browser-harness: 성공(PASS) / 실패(FAIL) / BLOCKED
- 시트 J열 기록: PASS / FAIL / BLOCKED
- Playwright: test.spec.ts 생성 완료 (결과 판정 미사용)
- 생성 파일:
  - output/TC-{NNN}_{Service}_{Feature}/testcase.md
  - output/TC-{NNN}_{Service}_{Feature}/test.spec.ts
  - output/TC-{NNN}_{Service}_{Feature}/results/YYYY-MM-DD_{STATUS}.md
```
