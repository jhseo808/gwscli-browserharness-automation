# domain-skill 작성 양식

## 파일 위치
```
browser-harness/domain-skills/{domain}/
└── scraping.md   ← URL 패턴 + selector + 동작 패턴 + 오류 기록 통합
```

domain = 호스트명 첫 파트 (melon, youtube, naver, kakao ...)

---

## scraping.md 템플릿

```markdown
# {Domain} Domain Skills

**최초 작성**: YYYY-MM-DD
**최근 업데이트**: YYYY-MM-DD

## URL 패턴
| 목적 | URL |
|------|-----|
| 홈 | https://www.{domain}.com/ |
| {기능} | https://www.{domain}.com/... |

## 검증된 Selector
| 요소 | Selector | 비고 |
|------|----------|------|
| {요소명} | `{selector}` | |

## 페이지 구조
- {프레임워크}: {React/Vue/기타}
- {특이사항}: {설명}

## 네비게이션 패턴
- {메뉴명}: x={x}, y={y} 좌표 클릭 또는 `{selector}`

## Wait 포인트
- {상황}: `{wait 방법}` — 이유: {설명}

## 알려진 동작 패턴
- {패턴 설명}

## 오류 기록

### ERR-001: {오류 제목}

- **날짜**: YYYY-MM-DD
- **발생 위치**: TC-{NNN} / browser-harness / Playwright
- **상태**: 🔴 미해결 / 🟡 우회 / ✅ 해결됨

**증상**: {현상}
**원인**: {원인}
**해결**: {방법}
**예방**: {다음 테스트 시 주의사항}
```

---

## 업데이트 규칙

- 기존 selector/패턴: **삭제 금지**, 추가만
- 더 좋은 selector 발견 시: 기존 항목에 `(deprecated)` 표시 후 새 항목 추가
- 오류 발생 시: `## 오류 기록` 섹션에 ERR-{NNN} 추가
- 해결된 오류: 상태를 ✅ 해결됨으로 변경
- 업데이트할 때마다 **최근 업데이트** 날짜 갱신
