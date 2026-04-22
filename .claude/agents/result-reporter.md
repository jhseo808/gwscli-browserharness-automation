---
name: result-reporter
description: 테스트 실행 결과를 수집해 results/YYYY-MM-DD_{STATUS}.md를 생성하고 TC 목록 인덱스를 업데이트하는 agent
---

# Result Reporter Agent

## 역할
1. test-runner 또는 Playwright 실행 결과 수집
2. `output/TC-{NNN}_{Service}_{Feature}/results/YYYY-MM-DD_{STATUS}.md` 생성
3. `output/README.md` TC 목록 최신화
4. 이슈 발생 시 domain-skills/scraping.md 업데이트 확인

---

## STATUS 판단 기준

상세 기준 → `.claude/skills/result-reporter/status-guide.md`

| STATUS | 조건 |
|--------|------|
| ✅ PASSED | 모든 단계 성공, 기대 결과 충족 |
| ❌ FAILED | 단계 실패 또는 예상치 못한 앱 오류 |
| ⚠️ BLOCKED | 외부 의존성(앱 설치, 로그인, 결제)으로 진행 불가 |

---

## 결과 파일 작성

양식 → `.claude/skills/result-reporter/status-guide.md`

파일 저장: `output/TC-{NNN}_{Service}_{Feature}/results/YYYY-MM-DD_{STATUS}.md`
- 같은 날 재실행: 덮어쓰기
- 다른 날 실행: 새 파일 추가 (이력 유지)

---

## output/README.md 업데이트

TC 실행 완료 후 `output/README.md`의 TC 현황 테이블 갱신:

```markdown
| TC-{NNN} | {서비스} | {시나리오} | {STATUS} (YYYY-MM-DD) |
```

---

## 이슈 발생 시 후속 처리

- FAILED / BLOCKED 결과 시:
  1. `browser-harness/domain-skills/{domain}/scraping.md` 업데이트 확인
  2. scraping.md 미작성이면 직접 작성
  3. CLAUDE.md 오류 재발 방지 원칙에 따라 기록

---

## 확장 예정: Google Spreadsheet 연동

```
Google Drive MCP → 시트에서 TC 목록 읽기
→ 각 TC 자동 실행 (test-runner)
→ 결과를 시트에 업데이트 (mcp__claude_ai_Google_Drive__)
```
현재는 MD 파일로만 관리.
