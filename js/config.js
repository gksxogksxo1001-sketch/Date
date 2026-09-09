// ====================================================
// CONFIG.JS — 중앙 설정 관리
// env.js에서 API 키를 로드하고 전역 상수를 정의합니다.
// ====================================================
import { ENV } from './env.js';

export const CONFIG = {
  // Kakao SDK
  KAKAO_JS_KEY: ENV.KAKAO_JS_KEY,
  KAKAO_REST_KEY: ENV.KAKAO_REST_KEY,
  KAKAO_APP_KEY: ENV.KAKAO_JS_KEY,

  // Supabase
  SUPABASE_URL: ENV.SUPABASE_URL,
  SUPABASE_KEY: ENV.SUPABASE_KEY,

  // Service URLs
  BASE_URL: 'https://gksxogksxo1001-sketch.github.io/Date/',
  DEFAULT_OG_IMAGE: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop',
  SECONDARY_OG_IMAGE: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop',

  // Limits
  MAX_ARCHIVE_SIZE: 50,
  MAX_PHOTOS_PER_COURSE: 3,
  IMAGE_MAX_DIM: 420,
  IMAGE_QUALITY: 0.6,

  // Calendar
  CALENDAR_MONTH_RANGE: 2, // ±2개월

  // Storage Keys
  STORAGE_USER: 'dateplanner_user',
  STORAGE_ARCHIVES: 'dateplanner_archives',
  STORAGE_CREATED_IDS: 'dateplanner_my_created_ids',
  STORAGE_ACCEPTED: 'dateplanner_accepted_cards'
};
