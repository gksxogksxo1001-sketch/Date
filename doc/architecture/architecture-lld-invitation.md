# 상세 아키텍처 및 데이터 스키마 설계서 (LLD: Low-Level Design)

## 1. 초대장 데이터 스키마 (Invitation Card Data Schema)

데이트 신청 방(초대장) 생성 시 사용되는 JSON 데이터 구조입니다.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DateInvitationSchema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "초대장 고유 아이디 (UUID v4 또는 timestamp 기반)"
    },
    "senderName": {
      "type": "string",
      "description": "신청자 이름/별명"
    },
    "receiverName": {
      "type": "string",
      "description": "받는 사람 이름/별명"
    },
    "location": {
      "type": "string",
      "description": "만날 만남 장소/지역 (예: 성수동, 강남역 11번 출구)"
    },
    "dateTime": {
      "type": "string",
      "format": "date-time",
      "description": "데이트 약속 날짜 및 시작 시간 (ISO 8601 string)"
    },
    "budget": {
      "type": "string",
      "description": "예상 데이트 예산 (예: 5만원 이하, 5~10만원 등)"
    },
    "placeUrl": {
      "type": "string",
      "format": "uri",
      "description": "데이트 추천 가게/장소 관련 외부 웹사이트/지도 링크"
    },
    "message": {
      "type": "string",
      "description": "상대방에게 전하는 신청 메시지"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": ["senderName", "location", "dateTime", "budget", "message"]
}
```

---

## 2. URL 인코딩 및 디코딩 프로세스 (URL Pipeline Logic)

### 2.1 인코딩 과정 (Encoding Flow)
1. 사용자가 방 만들기 폼에 `senderName`, `receiverName`, `location`, `dateTime`, `budget`, `placeUrl`, `message`를 입력함.
2. 유효성 검사 (Place URL 시작 문자열 `http://` 또는 `https://` 자동 체크 및 보정).
3. `JSON.stringify(formData)` 수행 후 `encodeURIComponent` 및 `btoa` (Base64) 인코딩 처리.
4. 클라이언트 URL 생성: `https://[domain]/#card=[encoded_token]` 또는 `?card=[encoded_token]`.

### 2.2 디코딩 및 랜더링 과정 (Decoding Flow)
1. 페이지 진입 시 URL 파라미터 또는 Hash값 탐색 (`card` 키 확인).
2. `card` 파라미터 존재 시:
   - `atob` 및 `decodeURIComponent` 디코딩 ➔ JSON 객체 변환.
   - 랜딩 모드를 '방 작성' 모드에서 **'데이트 초대장 수신 카드 View'**로 즉시 전환.
3. 가게 링크(`placeUrl`) 존재 시, 시각적인 외부 아웃링크 버튼 렌더링. 클릭 시 `window.open(placeUrl, '_blank')` 실행.

---

## 3. UI 컴포넌트 모듈 인터페이스 (Component Specifications)

1. **`RoomFormController`**:
   - `init()`: 이벤트 리스너 할당 (예산 칩 버튼, 가게 URL 유효성 검사).
   - `handleSubmit()`: 입력 데이터 수집 ➔ 인코딩 ➔ 공유 모달 팝업.
2. **`CardViewerController`**:
   - `renderCard(data)`: 수신된 데이트 신청 카드의 장소, 일시, 예산, 가게 링크 렌더링.
   - `handleAccept()`: 수락 버튼 클릭 팝업 및 하트 애니메이션 연출.
3. **`ShareController`**:
   - `copyLink(url)`: 클립보드에 초대장 URL 복사 및 Toast 알림 표시.
