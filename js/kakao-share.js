// ====================================================
// KAKAO-SHARE.JS — 카카오톡 SDK 초기화 및 공유 헬퍼
// ====================================================
import { CONFIG } from './config.js';
import { showToast, copyToClipboard } from './utils.js';

// Kakao SDK 초기화
export function initKakao() {
  if (window.Kakao && !window.Kakao.isInitialized()) {
    try {
      window.Kakao.init(CONFIG.KAKAO_APP_KEY);
    } catch (e) {
      console.error('Kakao init error:', e);
    }
  }
}

// 카카오톡 피드 공유 통합 함수
export function sendKakaoFeed({ title, description, imageUrl, webUrl, buttonTitle, fallbackText, toastMsg, isAuto = false }) {
  if (window.Kakao && !window.Kakao.isInitialized()) {
    try { window.Kakao.init(CONFIG.KAKAO_APP_KEY); } catch (e) {}
  }

  let finalUrl = webUrl || window.location.href;
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = CONFIG.BASE_URL + (finalUrl.includes('?') ? finalUrl.substring(finalUrl.indexOf('?')) : '');
  }

  if (window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()) {
    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title,
          description,
          imageUrl: imageUrl || CONFIG.DEFAULT_OG_IMAGE,
          link: { mobileWebUrl: finalUrl, webUrl: finalUrl }
        },
        buttons: [
          { title: buttonTitle || '초대장 확인하기 💖', link: { mobileWebUrl: finalUrl, webUrl: finalUrl } }
        ]
      });
      if (!isAuto) showToast(toastMsg || '카카오톡 공유창이 열렸습니다! 💬');
      return true;
    } catch (e) {
      console.warn('Kakao share notice:', e);
    }
  }

  if (fallbackText) {
    copyToClipboard(fallbackText, '카카오톡 공유 문구가 복사되었습니다! 카톡에 붙여넣어 보세요 💬');
  }
  return false;
}
