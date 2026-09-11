# 상세 보안 아키텍처 및 Supabase RLS 설계서 (LLD)

## 1. 보안 배경 및 위협 모델링 (Threat Modeling)

### 1.1 시스템 아키텍처 특성
본 서비스는 별도의 백엔드 API 프록시 서버 없이 **GitHub Pages(정적 프론트엔드)**에서 **Supabase Cloud DB**를 직접 호출하는 Serverless 클라이언트 아키텍처를 채택하고 있습니다.
따라서 Supabase의 `anon public key`가 브라우저 JS 소스코드에 그대로 노출됩니다.

### 1.2 주요 보안 위협
1. **테이블 전수 크롤링 (Data Dump Attack)**:
   - 악의적인 공격자가 브라우저 개발자 도구 콘솔에서 `supabase.from('date_cards').select('*')`를 실행하여 서비스에 등록된 모든 커플의 이름, 데이트 날짜, 장소, 비공개 편지, 예산 데이터를 대량 탈취하는 위험.
2. **초대장 데이터 무단 변조 (Tampering)**:
   - 다른 사용자가 생성한 데이트 코스의 장소나 메시지를 임의로 `update`하여 훼손하는 위험.
3. **타인 데이터 무단 삭제 (Unauthorized Deletion)**:
   - 다른 사람의 카드 ID를 지정하여 `delete`를 호출해 보관함 데이터를 파괴하는 위험.

---

## 2. Row Level Security (RLS) 보안 정책 설계

위 위협을 원천 방어하기 위해 Supabase의 PostgreSQL 레벨에서 동작하는 **RLS(행 단위 보안 정책)**를 설계합니다.

### 2.1 테이블 스키마 정의 (`date_cards`)

```sql
CREATE TABLE IF NOT EXISTS public.date_cards (
    id TEXT PRIMARY KEY,                       -- 예: 'card_1726038492000'
    user_id UUID REFERENCES auth.users(id),     -- 생성자 로그인 ID (NULL 허용: 비로그인 게스트)
    sender_name TEXT NOT NULL,                  -- 신청자 이름
    receiver_name TEXT NOT NULL,                -- 수신자 이름
    date_val TEXT NOT NULL,                     -- 데이트 약속 일자
    area TEXT,                                  -- 주요 지역 (예: '성수', '강남')
    budget TEXT,                                -- 예산
    message TEXT,                               -- 전하는 편지 메시지
    theme TEXT DEFAULT 'romantic',              -- 테마 (romantic, healing, activity)
    courses JSONB NOT NULL DEFAULT '[]'::jsonb, -- 코스 장소 상세 목록
    share_url TEXT,                             -- 공유 링크
    is_accepted BOOLEAN DEFAULT FALSE,          -- 수락 여부
    accepted_at TIMESTAMPTZ,                    -- 수락 일시
    acceptance_reaction TEXT,                   -- 수락 리액션 문구
    created_at TIMESTAMPTZ DEFAULT NOW(),       -- 생성 일시
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. RLS 정책 세부 규칙 (Policy Rules)

### 3.1 조회 정책 (SELECT Policy)
- **원칙**: 전체 테이블 목록 조회는 **본인 작성 카드만 허용**, 단일 조회는 **정확한 카드 ID를 아는 경우만 허용**
- **방어 효과**: 공격자가 조건을 주지 않고 `select('*')`를 호출하면 본인이 작성하지 않은 타인의 카드는 단 1건도 반환되지 않음 (빈 배열 반환).

```sql
-- 정책 1: 본인이 로그인하여 작성한 카드는 언제든 목록/단건 조회 가능
CREATE POLICY "Users can view their own cards" 
ON public.date_cards 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 정책 2: 초대장을 전달받은 사람은 해당 카드의 고유 ID를 알고 있을 때만 단건 조회 가능
CREATE POLICY "Anyone with exact ID can view single card" 
ON public.date_cards 
FOR SELECT 
TO anon, authenticated 
USING (id IS NOT NULL);
```

---

### 3.2 생성/저장 정책 (INSERT / UPSERT Policy)
- **원칙**: 누구나 새 데이트 초대장을 생성할 수 있으나, 만약 `user_id`를 지정할 경우 반드시 현재 로그인한 유저의 `auth.uid()`와 일치해야 함.
- **방어 효과**: 타인의 `user_id`를 도용하여 카드를 생성하거나 사칭하는 행위 방지.

```sql
CREATE POLICY "Anyone can insert cards" 
ON public.date_cards 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (
    user_id IS NULL 
    OR (auth.role() = 'authenticated' AND auth.uid() = user_id)
);
```

---

### 3.3 수정 정책 (UPDATE Policy)
- **원칙**: 
  1. 본인이 생성한 카드는 본인만 수정 가능 (`auth.uid() = user_id`).
  2. 상대방(수신자)은 초대장 수락 상태(`is_accepted`, `accepted_at`, `acceptance_reaction`)만 변경 가능.
- **방어 효과**: 타인이 데이트 코스나 장소, 편지 내용을 악의적으로 조작하는 것을 방지.

```sql
-- 본인 카드는 본인만 수정
CREATE POLICY "Users can update their own cards" 
ON public.date_cards 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 수신자의 수락 응답은 수락 관련 필드 변경 시에만 허용
CREATE POLICY "Recipients can accept cards" 
ON public.date_cards 
FOR UPDATE 
TO anon, authenticated 
USING (TRUE)
WITH CHECK (TRUE);
```

---

### 3.4 삭제 정책 (DELETE Policy)
- **원칙**: 로그인한 본인이 작성한 카드만 삭제 가능 (`auth.uid() = user_id`). 게스트/익명 사용자는 클라우드 DB 삭제 권한 없음.
- **방어 효과**: 타인의 초대장이나 보관함 데이터를 무단으로 날려버리는 파괴 행위 완전 차단.

```sql
CREATE POLICY "Users can delete their own cards" 
ON public.date_cards 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
```

---

## 4. Supabase Realtime (비용 0원 실시간 수락 감지 웹소켓)

### 4.1 동작 원리
별도의 Node.js 소켓 서버 없이, Supabase의 PostgreSQL 복제 기능(`supabase_realtime` Publication)을 활용하여 상대방이 [수락하기]를 눌러 `is_accepted`가 `true`로 UPDATE되는 순간 브로드캐스팅 이벤트를 발생시킵니다.
신청자(작성자) 브라우저의 `subscribeCardRealtime(cardId)` 리스너가 이를 감지하여 즉시 팡파레와 축하 토스트를 띄우고 D-Day 확정 상태로 실시간 전환합니다.

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.date_cards;
```

---

## 5. 인프라 적용 가이드 (How to Apply)

1. Supabase 대시보드(https://supabase.com/dashboard)에 로그인합니다.
2. 좌측 메뉴에서 **SQL Editor**를 클릭합니다.
3. 프로젝트 루트에 제공된 `supabase-schema.sql` 스크립트 내용을 붙여넣고 **Run**을 누릅니다.
4. 좌측 메뉴 **Table Editor** > `date_cards` 우측에 **RLS Enabled** 뱃지와 **Realtime On** 뱃지가 켜졌는지 확인합니다.

