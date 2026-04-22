# Test Case: YouTube BTS Search and Play

## TC-001: YouTube에서 BTS 검색 및 첫 번째 영상 재생

### 전제조건 (Preconditions)
- Chrome 브라우저가 정상 작동 중
- 인터넷 연결 정상
- YouTube 접근 가능

### 테스트 단계 (Test Steps)

| 단계 | 액션 | 기대 결과 |
|---|---|---|
| 1 | YouTube 홈페이지 접속 | YouTube 홈페이지 로드 완료 |
| 2 | 상단 검색창 클릭 | 검색창 활성화 (포커스) |
| 3 | "BTS" 입력 | 검색창에 "BTS" 텍스트 입력됨 |
| 4 | Enter 키 입력 | BTS 검색 결과 페이지 로드 |
| 5 | 첫 번째 비디오 클릭 | 비디오 재생 페이지 이동 |
| 6 | 비디오 로드 대기 | 비디오 플레이어 렌더링 완료 |
| 7 | 재생 여부 확인 | 비디오가 재생 중 상태 |

### 기대 결과 (Expected Result)
- ✅ YouTube 검색 결과에서 BTS 관련 영상 표시
- ✅ 첫 번째 영상이 정상 재생
- ✅ 플레이어 UI 표시 (재생/일시정지, 진행률 등)
- ✅ 영상 정보 표시 (제목, 채널명, 조회수)

### 실패 조건 (Failure Conditions)
- ❌ 검색창이 활성화되지 않음
- ❌ 텍스트가 입력되지 않음
- ❌ 검색 결과 페이지 로드 안됨
- ❌ 첫 번째 비디오 링크 없음
- ❌ 비디오 재생 실패

### 스크린샷/증거 (Evidence)
1. YouTube 홈페이지
2. BTS 검색 결과 목록
3. BTS 2'0' Official MV 재생 화면
