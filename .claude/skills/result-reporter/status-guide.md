# STATUS 판단 기준 및 결과 파일 양식

## STATUS 판단 흐름

```
모든 단계 성공?
  └─ YES → 기대 결과 충족?
            └─ YES → ✅ PASSED
            └─ NO  → ❌ FAILED

단계 실패?
  └─ 외부 앱/로그인/결제 필요? → ⚠️ BLOCKED
  └─ 코드/선택자 오류?         → ❌ FAILED
```

---

## 결과 파일 양식

파일명: `YYYY-MM-DD_{STATUS}.md`

```markdown
# TC-{NNN} 테스트 결과

- **날짜**: YYYY-MM-DD
- **시각**: HH:MM KST
- **실행 방법**: browser-harness / Playwright headless / Playwright headed
- **상태**: ✅ PASSED / ❌ FAILED / ⚠️ BLOCKED

## 단계별 결과
| 단계 | 액션 | 결과 | 비고 |
|------|------|------|------|
| 1 | | ✅ | |
| 2 | | ✅ | |
| N | | ❌/⚠️ | {오류 내용} |

## 이슈
<!-- PASSED면 "없음" 기재 -->
- {이슈 설명}

## 소요시간
- 총: {N}초

## 스크린샷
- ![{설명}](../screenshots/{파일명}.png)

## 오류 기록 업데이트
<!-- 이슈 발생 시 domain-skills scraping.md 업데이트 여부 확인 -->
- [ ] `browser-harness/domain-skills/{domain}/scraping.md` 업데이트 완료
```

---

## output/README.md TC 현황 업데이트

```markdown
| TC-{NNN} | {서비스} | {시나리오} | {이모지} {STATUS} (YYYY-MM-DD) |
```

- 이모지: ✅ PASSED, ❌ FAILED, ⚠️ BLOCKED

---

## 날짜 관리

- 같은 날 재실행: 기존 파일 **덮어쓰기**
- 다른 날 실행: 새 파일 추가 (이력 유지)
- `results/` 내 가장 최신 파일이 현재 상태
