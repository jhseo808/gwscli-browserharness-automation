# TC-003: Google에서 Python 검색 후 Downloads 페이지 진입

## 전제조건
- 브라우저: Chrome (browser-harness CDP 제어)
- 네트워크: 인터넷 연결 필요
- 로그인: 불필요

## 테스트 단계
| 단계 | 액션 | 기대 결과 |
|------|------|-----------|
| 1 | https://www.google.com 접속 | Google 홈페이지 로드 완료 |
| 2 | 검색창에 "python" 입력 후 검색 실행 | 검색 결과 페이지 로드 |
| 3 | 첫 번째 검색 결과 링크 클릭 | 해당 페이지(python.org 예상) 로드 |
| 4 | "Downloads" 카테고리 메뉴 선택 | Downloads 페이지 로드 |

## 기대 결과
- ✅ Google 홈페이지 정상 접속
- ✅ python 검색 결과 노출
- ✅ 첫 번째 링크 클릭 시 python.org 등 페이지 진입
- ✅ Downloads 카테고리 페이지 로드 완료

## 실패 조건
- ❌ Google 페이지 로드 실패
- ❌ 검색 결과 없음
- ❌ 첫 번째 링크 클릭 무반응
- ❌ Downloads 메뉴 없음 또는 클릭 무반응

## 알려진 제약사항
- 신규 도메인 — google, python.org 모두 domain-skills 없음
- Google 검색 결과는 동적으로 변하므로 첫 번째 링크 URL이 실행마다 다를 수 있음
