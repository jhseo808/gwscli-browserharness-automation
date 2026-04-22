# 오류 기록 작성 양식

## 위치
`browser-harness/domain-skills/{domain}/scraping.md` 내 `## 오류 기록` 섹션에 추가.

---

## ERR 항목 템플릿

```markdown
### ERR-{NNN}: {오류 제목}

- **날짜**: YYYY-MM-DD
- **발생 위치**: TC-{NNN} / browser-harness / Playwright
- **상태**: 🔴 미해결 / 🟡 우회 / ✅ 해결됨

**증상**
{오류 메시지 또는 현상 설명}

**원인**
{원인 분석}

**해결**
{해결 또는 우회 방법}

**예방**
{다음 테스트 시 주의할 점}

**관련 파일**
- `output/TC-{NNN}_{Service}_{Feature}/screenshots/{파일명}.png`
```

---

## 번호 채번

`ERR-{NNN}` — scraping.md 내 기존 ERR 번호 마지막 +1

## 상태 변경

오류 해결 시 상태 줄만 업데이트:
```
- **상태**: ✅ 해결됨 (YYYY-MM-DD)
```
