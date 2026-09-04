# 디자인 시스템 스펙 (Design System Spec) - Ver 2.0

## 1. 룩앤필 (Look & Feel)
- **컨셉**: Warm Cozy Minimalist (따뜻하고 포근한 크림 베이지 & 톤다운 소프트 코랄)
- **분위기**: 자극적이거나 튀는 색감을 배제하고, 은은하고 감성적이며 세련된 코지(Cozy) 스타일. 누구나 부담 없이 깔끔하게 사용할 수 있는 프리미엄 감성.

## 2. 디자인 토큰 (Design Tokens)

### 2.1 Color Palette
- **Primary Accent**: `#E07A5F` (Soft Warm Coral Rose - 톤다운 코랄)
- **Primary Hover**: `#C8634B`
- **Secondary Accent**: `#81B29A` (Soft Sage Green - 차분한 세이지)
- **Background**: `linear-gradient(135deg, #FAF7F5 0%, #F5EFE9 50%, #EFE7DE 100%)`
- **Card Background**: `rgba(255, 255, 255, 0.9)` (Warm Glass & Soft Border)
- **Text Main**: `#3D405B` (Soft Slate Deep Gray)
- **Text Muted**: `#8D918B` (Muted Warm Taupe)
- **Border Neutral**: `#E8DFD5`

### 2.2 Typography
- **Primary Font**: `'Pretendard', 'Outfit', sans-serif`
- **Headings & Cards**: 둥글고 정갈한 서체 비율과 편안한 행간 적용.

---

## 3. 핵심 UI 구조 & 모바일 반응형 스펙
1. **다중 데이트 코스 타임라인 (Course Timeline)**:
   - 1차(맛집/식사), 2차(카페/디저트), 3차(산책/야경/전시) 등 사용자가 원하는 만큼 데이트 코스를 추가/삭제할 수 있는 실용적 구조.
   - 각 코스별 장소명, 시작 시간, 해당 가게 외부 링크(네이버지도/카카오맵/인스타 등) 독립적 첨부 지원.
2. **모바일 퍼스트 반응형 (Mobile Responsive)**:
   - 모바일 뷰포트(320px ~ 480px)에서 한 손 조작이 용이한 하단 고정 CTA 및 터치에 최적화된 패딩, 여백 설정.
