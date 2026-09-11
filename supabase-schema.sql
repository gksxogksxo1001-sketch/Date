-- ==============================================================================
-- DatePlanner: Supabase Database Schema & Row Level Security (RLS) Policies
-- 실행 방법: Supabase Dashboard > SQL Editor에 복사하여 붙여넣은 후 [Run] 클릭
-- ==============================================================================

-- 1. 테이블 생성 (date_cards)
CREATE TABLE IF NOT EXISTS public.date_cards (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_name TEXT NOT NULL,
    receiver_name TEXT NOT NULL,
    date_val TEXT NOT NULL,
    area TEXT,
    budget TEXT,
    message TEXT,
    theme TEXT DEFAULT 'romantic',
    courses JSONB NOT NULL DEFAULT '[]'::jsonb,
    share_url TEXT,
    is_accepted BOOLEAN DEFAULT FALSE,
    accepted_at TIMESTAMPTZ,
    acceptance_reaction TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 성능 최적화 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_date_cards_user_id ON public.date_cards (user_id);
CREATE INDEX IF NOT EXISTS idx_date_cards_created_at ON public.date_cards (created_at DESC);

-- 3. Row Level Security (RLS) 활성화 (무단 크롤링 차단 필수)
ALTER TABLE public.date_cards ENABLE ROW LEVEL SECURITY;

-- 4. 기존 정책 초기화 (중복 방지)
DROP POLICY IF EXISTS "Users can view their own cards" ON public.date_cards;
DROP POLICY IF EXISTS "Anyone with exact ID can view single card" ON public.date_cards;
DROP POLICY IF EXISTS "Anyone can insert cards" ON public.date_cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON public.date_cards;
DROP POLICY IF EXISTS "Recipients can accept cards" ON public.date_cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON public.date_cards;

-- ==============================================================================
-- 5. RLS 정책 정의 (Policy Definitions)
-- ==============================================================================

-- [조회 1]: 로그인한 유저는 본인이 생성한 카드를 보관함에서 언제든 조회 가능
CREATE POLICY "Users can view their own cards"
ON public.date_cards
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- [조회 2]: 카드 고유 ID를 알고 접속한 사람은 해당 카드 단건 조회 가능
CREATE POLICY "Anyone with exact ID can view single card"
ON public.date_cards
FOR SELECT
TO anon, authenticated
USING (id IS NOT NULL);

-- [생성]: 누구나 새 데이트 초대장을 생성할 수 있음 (user_id가 있으면 본인 확인)
CREATE POLICY "Anyone can insert cards"
ON public.date_cards
FOR INSERT
TO anon, authenticated
WITH CHECK (
    user_id IS NULL 
    OR (auth.role() = 'authenticated' AND auth.uid() = user_id)
);

-- [수정 1]: 본인이 작성한 카드는 본인만 수정 가능
CREATE POLICY "Users can update their own cards"
ON public.date_cards
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- [수정 2]: 초대장을 받은 상대방(수신자)은 수락 응답(accepted) 업데이트 가능
CREATE POLICY "Recipients can accept cards"
ON public.date_cards
FOR UPDATE
TO anon, authenticated
USING (TRUE)
WITH CHECK (TRUE);

-- [삭제]: 로그인한 작성자 본인만 카드 삭제 가능
CREATE POLICY "Users can delete their own cards"
ON public.date_cards
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
