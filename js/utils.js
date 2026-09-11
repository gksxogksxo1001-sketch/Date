// ====================================================
// UTILS.JS — 공통 유틸리티 함수
// ====================================================

// Toast Notification
export function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.style.background = isError ? '#E53935' : '#2B2D42';
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Clipboard Helpers
export function copyToClipboard(text, successMsg = '링크가 복사되었습니다! 🌿') {
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showToast(successMsg))
      .catch(() => fallbackCopy(text, successMsg));
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const tempInput = document.createElement('textarea');
  tempInput.value = text;
  tempInput.style.position = 'fixed';
  tempInput.style.opacity = '0';
  document.body.appendChild(tempInput);
  tempInput.select();
  try {
    document.execCommand('copy');
    showToast(successMsg);
  } catch (e) {
    showToast('복사에 실패했습니다. 직접 복사해 주세요.', true);
  }
  document.body.removeChild(tempInput);
}

// Date Format Helper
export function formatDateString(dStr) {
  const dateObj = new Date(dStr);
  if (isNaN(dateObj.getTime())) return dStr;
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const date = dateObj.getDate();
  const day = days[dateObj.getDay()];
  return `${year}년 ${month}월 ${date}일 (${day})`;
}

// URL Hash Parameter Extractor
export function getHashParam(key) {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get(key);
}

// Base64 URL-safe Encoder/Decoder
export function encodePayload(obj) {
  const jsonStr = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(jsonStr);
  let binStr = '';
  bytes.forEach(b => binStr += String.fromCharCode(b));
  return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodePayload(token) {
  try {
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binStr = atob(base64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr);
  } catch (e1) {
    try {
      const jsonStr = decodeURIComponent(atob(token));
      return JSON.parse(jsonStr);
    } catch (e2) {
      const jsonStr = atob(token);
      return JSON.parse(jsonStr);
    }
  }
}

// Romantic Confetti Animation
export function triggerRomanticConfetti() {
  if (typeof confetti !== 'function') return;

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#E07A5F', '#F4F1DE', '#81B29A', '#F2CC8F', '#E8A598', '#FFB7C5'],
    scalar: 1.2
  });

  setTimeout(() => {
    confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#E07A5F', '#FFB7C5', '#F2CC8F'] });
    confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#E07A5F', '#81B29A', '#F4F1DE'] });
  }, 250);

  setTimeout(() => {
    confetti({ particleCount: 40, spread: 100, origin: { y: 0.4 }, colors: ['#E07A5F', '#FF6B81', '#FFB7C5'], shapes: ['circle'], scalar: 1.5 });
  }, 600);
}

// HTML2Canvas Card Image Download
export function downloadCardImage(recipientData) {
  const cardTarget = document.getElementById('storyPageWrapper');
  if (!cardTarget) return;

  const activeModals = Array.from(document.querySelectorAll('.modal-overlay:not(.hidden), .accept-overlay:not(.hidden)'));
  const toastEl = document.getElementById('toast');

  activeModals.forEach(m => { m.style.opacity = '0'; m.style.visibility = 'hidden'; });
  if (toastEl) { toastEl.style.opacity = '0'; toastEl.style.visibility = 'hidden'; }

  showToast('📸 초대장 카드를 이미지로 변환 중입니다...');

  if (typeof html2canvas !== 'function') {
    activeModals.forEach(m => { m.style.opacity = ''; m.style.visibility = ''; });
    if (toastEl) { toastEl.style.opacity = ''; toastEl.style.visibility = ''; }
    showToast('이미지 변환 모듈을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.', true);
    return;
  }

  setTimeout(() => {
    html2canvas(cardTarget, {
      scale: 2, useCORS: true, backgroundColor: '#FFFFFF', logging: false, scrollX: 0, scrollY: 0
    }).then(canvas => {
      activeModals.forEach(m => { m.style.opacity = ''; m.style.visibility = ''; });
      if (toastEl) { toastEl.style.opacity = ''; toastEl.style.visibility = ''; }

      const imageUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const recipientName = recipientData ? (recipientData.r || '데이트') : '데이트';
      link.download = `DateCard_${recipientName}_초대장.png`;
      link.href = imageUri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('💖 데이트 카드 이미지가 저장되었습니다!');
    }).catch(err => {
      activeModals.forEach(m => { m.style.opacity = ''; m.style.visibility = ''; });
      if (toastEl) { toastEl.style.opacity = ''; toastEl.style.visibility = ''; }
      console.error('Card capture error:', err);
      showToast('이미지 저장 중 오류가 발생했습니다.', true);
    });
  }, 120);
}

// ====================================================
// In-App Browser & Deep Link Utilities
// ====================================================

export function isKakaoTalkBrowser() {
  return /KAKAOTALK/i.test(navigator.userAgent);
}

export function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

export function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 카카오톡 인앱 브라우저 탈출 (외부 기본 브라우저인 사파리/크롬으로 열기)
 */
export function openExternalBrowser(targetUrl = window.location.href) {
  if (isKakaoTalkBrowser()) {
    // 카카오톡 공식 외부 브라우저 호출 스킴
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(targetUrl)}`;
    return true;
  }
  
  if (isAndroid()) {
    // 안드로이드 크롬 인텐트 호출
    const cleanUrl = targetUrl.replace(/^https?:\/\//, '');
    window.location.href = `intent://${cleanUrl}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;end`;
    return true;
  }

  // 기본 브라우저에서는 새 창으로 열기
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
  return true;
}

/**
 * 모바일 인앱 브라우저 안전 링크 이동 헬퍼
 * - 카카오톡 인앱 브라우저 등에서 window.open 팝업 차단을 우회
 */
export function safeOpenWindow(url) {
  if (!url) return;
  if (isKakaoTalkBrowser() || isMobileDevice()) {
    // 인앱 브라우저는 _blank가 차단되거나 깨지므로 현재 탭에서 안전하게 이동
    window.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
