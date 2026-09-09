// ====================================================
// CONFIG.JS — 중앙 설정 관리
// env.js에서 API 키를 로드하고 전역 상수를 정의합니다.
// ====================================================
import { ENV } from './env.js';

export const CONFIG = {
  // Kakao SDK
  KAKAO_JS_KEY: (typeof ENV !== 'undefined' && ENV.KAKAO_JS_KEY) ? ENV.KAKAO_JS_KEY : 'd26b232de6dfcbfa561ff1fd2c6afd54',
  KAKAO_REST_KEY: (typeof ENV !== 'undefined' && ENV.KAKAO_REST_KEY) ? ENV.KAKAO_REST_KEY : 'f943d3d735eddc5934ec0b5363a38532',
  KAKAO_APP_KEY: (typeof ENV !== 'undefined' && ENV.KAKAO_JS_KEY) ? ENV.KAKAO_JS_KEY : 'd26b232de6dfcbfa561ff1fd2c6afd54',

  // Supabase
  SUPABASE_URL: (typeof ENV !== 'undefined' && ENV.SUPABASE_URL) ? ENV.SUPABASE_URL : 'https://cmxcazjrasptkspomyyo.supabase.co',
  SUPABASE_KEY: (typeof ENV !== 'undefined' && ENV.SUPABASE_KEY) ? ENV.SUPABASE_KEY : 'sb_publishable_XSJgAV4bPOhoWbG6DO0M7w_Fibr9uer',

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
