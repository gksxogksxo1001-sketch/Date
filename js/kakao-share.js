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

  // 카카오 sharer.kakao.com은 URL 길이가 일정 수준(약 2,000자 이상)을 초과하면 500 Internal Server Error를 발생시킵니다.
  if (finalUrl.length > 1800) {
    let cardIdMatch = finalUrl.match(/card=([^&]+)/);
    let cardId = cardIdMatch ? cardIdMatch[1] : null;
    if (cardId && cardId.startsWith('card_')) {
      finalUrl = `${CONFIG.BASE_URL}?card=${cardId}`;
    } else {
      try {
        const decoded = decodeURIComponent(finalUrl);
        const idInText = decoded.match(/"id":"(card_[^"]+)"/);
        if (idInText && idInText[1]) {
          finalUrl = `${CONFIG.BASE_URL}?card=${idInText[1]}`;
        }
      } catch (e) {}
    }
  }

  // 카카오톡 인앱 브라우저에서 # 해시 파라미터가 유실되는 현상 방지:
  // 카카오 피드 링크에는 query string(?card=...) 형식을 전달하여 100% 파라미터 보존
  if (finalUrl.includes('#card=')) {
    finalUrl = finalUrl.replace('#card=', '?card=');
  }

  // 안전한 텍스트 필터링 (undefined / null 방지)
  const safeTitle = (title || '너를 위한 특별한 감성 데이트 초대장 💖').trim().substring(0, 100);
  const safeDescription = (description || '설레는 데이트 초대장이 도착했어요!').trim().substring(0, 200);
  const safeButtonTitle = (buttonTitle || '초대장 확인하기 💖').trim().substring(0, 30);
  const safeImageUrl = (imageUrl && imageUrl.startsWith('http')) ? imageUrl : CONFIG.DEFAULT_OG_IMAGE;

  if (window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()) {
    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: safeTitle,
          description: safeDescription,
          imageUrl: safeImageUrl,
          imageWidth: 800,
          imageHeight: 420,
          link: { mobileWebUrl: finalUrl, webUrl: finalUrl }
        },
        buttons: [
          { title: safeButtonTitle, link: { mobileWebUrl: finalUrl, webUrl: finalUrl } }
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
