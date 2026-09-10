// ====================================================
// STORY-VIEWER.JS — 감성 데이트 스토리 뷰어 엔진 및 인터랙션
// ====================================================
import { CONFIG } from './config.js';
import { showToast, copyToClipboard, formatDateString, decodePayload, getHashParam, triggerRomanticConfetti } from './utils.js';
import { sendKakaoFeed } from './kakao-share.js';
import { getSupabaseClient } from './supabase-client.js';
import { ArchiveService } from './archive-service.js';
import { AuthService } from './auth-service.js';
import { EnvelopeOpening } from './envelope-opening.js';
import { generateGoogleCalendarUrl, generateNaverCalendarUrl, downloadICalendarFile } from './external-calendar.js';

export let courseData = [];
export let currentStoryIndex = 0;
export let recipientData = null;
let ddayTimerInterval = null;

// Lightbox / Image Zoom Viewer
window.openImageZoom = function(src) {
  if (!src) return;
  const modal = document.getElementById('imageLightboxModal');
  const img = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('closeLightboxBtn');
  if (modal && img) {
    img.src = src;
    modal.classList.remove('hidden');

    const closeHandler = () => modal.classList.add('hidden');
    if (closeBtn) closeBtn.onclick = closeHandler;
    modal.onclick = (e) => {
      if (e.target === modal || e.target === closeBtn || e.target.closest('#closeLightboxBtn')) {
        closeHandler();
      }
    };
    return;
  }

  const w = window.open('');
  if (w) {
    w.document.write(`
      <html>
        <head><title>사진 크게 보기</title></head>
        <body style="margin:0; background:#111; display:flex; justify-content:center; align-items:center; min-height:100vh; cursor:pointer;" onclick="window.close()">
          <img src="${src}" style="max-width:95vw; max-height:95vh; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.5); object-fit:contain;">
        </body>
      </html>
    `);
  }
};

export function openCardFromShareUrl(shareUrl) {
  if (!shareUrl) return;
  const archiveModal = document.getElementById('archiveModal');
  const shareModal = document.getElementById('shareModal');
  const duplicateModal = document.getElementById('duplicateModal');
  if (archiveModal) archiveModal.classList.add('hidden');
  if (shareModal) shareModal.classList.add('hidden');
  if (duplicateModal) duplicateModal.classList.add('hidden');

  let token = '';
  try {
    if (shareUrl.includes('#card=')) {
      token = shareUrl.split('#card=')[1].split('&')[0];
    } else if (shareUrl.includes('?card=')) {
      token = shareUrl.split('?card=')[1].split('&')[0];
    } else if (shareUrl.startsWith('card_')) {
      token = shareUrl;
    }
  } catch (e) {
    console.warn('Token extract error:', e);
  }

  if (token) {
    const targetHash = `#card=${token}`;
    if (window.location.hash !== targetHash) {
      history.pushState(null, '', targetHash);
    }
    loadCardByToken(token);
  } else {
    window.location.href = shareUrl;
  }
}
window.openCardFromShareUrl = openCardFromShareUrl;

export function loadCardByToken(token) {
  if (!token) return false;
  let data = null;

  try {
    data = decodePayload(token);
  } catch (err) {
    console.warn('Payload decode fallback:', err);
  }

  if (!data && token.startsWith('card_')) {
    try {
      const localStr = localStorage.getItem(token);
      if (localStr) data = JSON.parse(localStr);
    } catch (e) {}
  }

  if (!data) {
    const archiveItem = ArchiveService.getAll().find(item =>
      item.id === token || (item.shareUrl && item.shareUrl.includes(token))
    );
    if (archiveItem) {
      data = {
        id: archiveItem.id,
        creatorId: archiveItem.userId,
        s: archiveItem.senderName,
        r: archiveItem.receiverName,
        d: archiveItem.date,
        a: archiveItem.area,
        b: archiveItem.budget,
        m: archiveItem.message,
        tm: archiveItem.theme,
        c: archiveItem.courses || [],
        ts: archiveItem.createdAt
      };
    }
  }

  const landingMode = document.getElementById('landingMode');
  if (data) {
    data = hydrateCardPhotos(data);
    recipientData = data;

    // 봉투 오프닝 표시 여부 체크 (세션당 1회 또는 새로고침 시 자연스럽게)
    const sessionKey = `opened_envelope_${token}`;
    const alreadyOpened = sessionStorage.getItem(sessionKey);

    const onFinishOpen = () => {
      renderStoryViewer(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchCloudPhotosIfMissing(data);
    };

    if (!alreadyOpened && data.s && data.r) {
      sessionStorage.setItem(sessionKey, 'true');
      renderStoryViewer(data); // 백그라운드에 렌더링 준비
      EnvelopeOpening.show({
        sender: data.s,
        receiver: data.r,
        date: formatDateString(data.d),
        theme: data.tm || 'cozy',
        onOpened: () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          fetchCloudPhotosIfMissing(data);
        }
      });
    } else {
      onFinishOpen();
    }

    return true;
  } else {
    showToast('초대장 데이터를 불러올 수 없습니다. 새 초대장을 작성해 주세요.', true);
    if (landingMode) landingMode.classList.remove('hidden');
    return false;
  }
}

export function hydrateCardPhotos(cardData) {
  if (!cardData || !Array.isArray(cardData.c)) return cardData;

  const hasAnyPhoto = cardData.c.some(c => c.p && Array.isArray(c.p) && c.p.length > 0);
  if (hasAnyPhoto) return cardData;

  // 1) 로컬 스토리지 원본에서 복원
  if (cardData.id) {
    try {
      const localRaw = localStorage.getItem(cardData.id);
      if (localRaw) {
        const localParsed = JSON.parse(localRaw);
        if (localParsed && Array.isArray(localParsed.c)) {
          cardData.c.forEach((c, i) => {
            if ((!c.p || c.p.length === 0) && localParsed.c[i] && localParsed.c[i].p) {
              c.p = localParsed.c[i].p;
            }
          });
          return cardData;
        }
      }
    } catch (e) {}
  }

  // 2) 보관함(ArchiveService)에서 복원
  const archiveList = ArchiveService.getAll();
  const archiveMatch = archiveList.find(item =>
    item.id === cardData.id ||
    (item.senderName === cardData.s && item.receiverName === cardData.r && item.date === cardData.d && item.area === cardData.a)
  );
  if (archiveMatch && Array.isArray(archiveMatch.courses)) {
    cardData.c.forEach((c, i) => {
      if ((!c.p || c.p.length === 0) && archiveMatch.courses[i] && archiveMatch.courses[i].p) {
        c.p = archiveMatch.courses[i].p;
      }
    });
  }

  return cardData;
}

export async function fetchCloudPhotosIfMissing(cardData) {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient || !cardData || !cardData.id) return;
  const hasAnyPhoto = cardData.c && cardData.c.some(c => c.p && Array.isArray(c.p) && c.p.length > 0);
  if (hasAnyPhoto) return;

  try {
    const { data, error } = await supabaseClient
      .from('date_cards')
      .select('courses')
      .eq('id', cardData.id)
      .maybeSingle();

    if (!error && data && Array.isArray(data.courses)) {
      let updated = false;
      cardData.c.forEach((c, i) => {
        if ((!c.p || c.p.length === 0) && data.courses[i] && data.courses[i].p && data.courses[i].p.length > 0) {
          c.p = data.courses[i].p;
          updated = true;
        }
      });

      if (updated) {
        courseData = cardData.c;
        updateStoryPage();
      }
    }
  } catch (e) {
    console.warn('Cloud photo fetch notice:', e);
  }
}

export function checkAndLoadCardFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const queryCardToken = urlParams.get('card');
  const hashCardToken = getHashParam('card');
  const cardToken = hashCardToken || queryCardToken;

  if (queryCardToken && !hashCardToken) {
    const cleanBase = window.location.origin + window.location.pathname;
    window.location.replace(`${cleanBase}#card=${queryCardToken}`);
    return;
  }

  if (cardToken) {
    loadCardByToken(cardToken);
  }
}

/**
 * 네이버 / 카카오 / T맵 길찾기 딥링크 및 지능형 검색 URL 생성
 */
export function getMapSearchLinks(courseItem, area) {
  const actualPlace = (courseItem.pl || courseItem.n || '').trim();
  const query = `${area ? area + ' ' : ''}${actualPlace}`.trim();
  const encodedQuery = encodeURIComponent(query);

  let directUrl = courseItem.u || '';
  let naverUrl = `https://map.naver.com/p/search/${encodedQuery}`;
  let kakaoUrl = `https://map.kakao.com/link/search/${encodedQuery}`;
  let tmapUrl = `https://map.naver.com/p/search/${encodedQuery}`;

  // 직접 첨부한 링크가 네이버 지도인 경우
  if (directUrl && (directUrl.includes('naver.me') || directUrl.includes('map.naver.com'))) {
    naverUrl = directUrl;
  }
  // 직접 첨부한 링크가 카카오맵인 경우
  if (directUrl && (directUrl.includes('kko.to') || directUrl.includes('map.kakao.com'))) {
    kakaoUrl = directUrl;
  }

  return {
    query,
    directUrl,
    naver: naverUrl,
    kakao: kakaoUrl,
    tmap: tmapUrl,
    tmapApp: `tmap://search?name=${encodedQuery}`
  };
}

/**
 * 길찾기 바텀시트 모달 열기
 */
window.openMapRouteSheet = function(courseIndex) {
  if (!courseData || !courseData[courseIndex]) return;
  const item = courseData[courseIndex];
  const modal = document.getElementById('mapRouteModal');
  if (!modal) return;

  const titleEl = document.getElementById('mapModalPlaceTitle');
  const subEl = document.getElementById('mapModalPlaceSub');
  const btnDirect = document.getElementById('btnDirectMapUrl');
  const btnNaver = document.getElementById('btnNaverMapRoute');
  const btnKakao = document.getElementById('btnKakaoMapRoute');
  const btnTmap = document.getElementById('btnTmapRoute');

  const links = getMapSearchLinks(item, recipientData ? recipientData.a : '');
  const displayName = item.pl || item.n || '코스 장소';

  if (titleEl) titleEl.textContent = `${displayName} 길찾기`;
  if (subEl) {
    subEl.textContent = item.pl && item.pl !== item.n
      ? `"${item.n}" (상호명: ${item.pl})`
      : `${item.t || '데이트 코스'} · ${recipientData ? recipientData.a : ''}`;
  }

  if (btnDirect) {
    if (links.directUrl) {
      btnDirect.classList.remove('hidden');
      btnDirect.href = links.directUrl;
    } else {
      btnDirect.classList.add('hidden');
    }
  }

  if (btnNaver) btnNaver.href = links.naver;
  if (btnKakao) btnKakao.href = links.kakao;
  if (btnTmap) {
    btnTmap.href = links.naver;
    btnTmap.onclick = () => {
      window.location.href = links.tmapApp;
    };
  }

  modal.classList.remove('hidden');
};

/**
 * D-Day 실시간 카운트다운 타이머 (지난 데이트 시 부자연스러운 D+1 제거)
 */
export function startDdayCountdown(dateStr) {
  if (ddayTimerInterval) {
    clearInterval(ddayTimerInterval);
    ddayTimerInterval = null;
  }

  const ddayBadge = document.getElementById('ddayBadge');
  const ddayText = document.getElementById('ddayText');
  const ddayCalendarBtn = document.getElementById('ddayCalendarBtn');
  if (!ddayBadge || !ddayText) return;

  function update() {
    if (!dateStr) {
      ddayBadge.className = 'dday-badge';
      ddayBadge.textContent = 'D-DAY';
      ddayText.textContent = '설레는 데이트 약속 💖';
      if (ddayCalendarBtn) ddayCalendarBtn.classList.remove('hidden');
      return;
    }

    const now = new Date();
    let startTimeStr = '12:00';
    if (courseData && courseData.length > 0 && courseData[0] && courseData[0].tm) {
      startTimeStr = courseData[0].tm;
    }

    const [h, m] = startTimeStr.split(':').map(Number);
    const targetExact = new Date(dateStr);
    targetExact.setHours(h || 12, m || 0, 0, 0);

    const exactDiffMs = targetExact.getTime() - now.getTime();

    const targetDateOnly = new Date(dateStr);
    targetDateOnly.setHours(0, 0, 0, 0);
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayDiff = Math.round((targetDateOnly.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24));

    if (exactDiffMs > 0) {
      // 미래 일정: 설레는 카운트다운
      const days = Math.floor(exactDiffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((exactDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((exactDiffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((exactDiffMs % (1000 * 60)) / 1000);

      ddayBadge.className = 'dday-badge';
      ddayBadge.textContent = days === 0 ? 'D-DAY' : `D-${days}`;
      const dayPrefix = days > 0 ? `${days}일 ` : '';
      ddayText.textContent = `만날 때까지 ${dayPrefix}${hours}시간 ${mins}분 ${secs}초 💖`;
      if (ddayCalendarBtn) ddayCalendarBtn.classList.remove('hidden');
    } else if (dayDiff === 0) {
      // 당일 일정
      ddayBadge.className = 'dday-badge';
      ddayBadge.textContent = 'D-DAY 🎉';
      ddayText.textContent = '오늘이 바로 설레는 만남의 날이에요! 💕';
      if (ddayCalendarBtn) ddayCalendarBtn.classList.remove('hidden');
    } else {
      // 지난 일정: 어색한 'D+1 함께한 지 1일째' 대신 따뜻한 추억 뱃지로 전환
      ddayBadge.className = 'dday-badge badge-memory';
      ddayBadge.textContent = '추억 🌿';
      ddayText.textContent = '소중한 추억으로 남은 데이트 💖';
      if (ddayCalendarBtn) ddayCalendarBtn.classList.add('hidden');
    }
  }

  update();
  ddayTimerInterval = setInterval(update, 1000);
}

export function renderStoryViewer(data) {
  const landingMode = document.getElementById('landingMode');
  const appHeader = document.getElementById('appHeader');
  const createMode = document.getElementById('createMode');
  const viewMode = document.getElementById('viewMode');
  const storyProgress = document.getElementById('storyProgress');
  const dropdownMenu = document.getElementById('dropdownMenu');

  if (landingMode) landingMode.classList.add('hidden');
  if (appHeader) appHeader.classList.add('hidden');
  if (createMode) createMode.classList.add('hidden');
  if (viewMode) viewMode.classList.remove('hidden');

  if (data.tm) {
    document.body.className = `theme-${data.tm}`;
  }

  courseData = data.c || [];
  currentStoryIndex = 0;

  // D-Day 실시간 타이머 시작
  if (data.d) {
    startDdayCountdown(data.d);
  }

  const totalPages = courseData.length + 1;
  if (storyProgress) {
    storyProgress.innerHTML = '';
    for (let i = 0; i < totalPages; i++) {
      const step = document.createElement('div');
      step.className = `story-step ${i === 0 ? 'active' : ''}`;
      storyProgress.appendChild(step);
    }
  }

  // Populate Custom Dropdown Options for Feedback
  if (dropdownMenu) {
    dropdownMenu.innerHTML = '';
    
    if (courseData.length > 0) {
      courseData.forEach((c, i) => {
        const itemVal = `${i + 1}차 코스 (${c.n})`;
        const itemEl = document.createElement('div');
        itemEl.className = `dropdown-option-item ${i === 0 ? 'selected' : ''}`;
        itemEl.textContent = itemVal;
        itemEl.onclick = () => selectDropdownOption(itemVal);
        dropdownMenu.appendChild(itemEl);
      });

      selectDropdownOption(`${1}차 코스 (${courseData[0].n})`);
    }

    const optAllVal = '전체 코스 변경 요청';
    const optAllEl = document.createElement('div');
    optAllEl.className = 'dropdown-option-item';
    optAllEl.textContent = optAllVal;
    optAllEl.onclick = () => selectDropdownOption(optAllVal);
    dropdownMenu.appendChild(optAllEl);
  }

  updateStoryPage();
  updateViewerActionUI(data);
}

export function selectDropdownOption(val) {
  const selectedCourseText = document.getElementById('selectedCourseText');
  const adjustCourseValue = document.getElementById('adjustCourseValue');
  const customDropdown = document.getElementById('customDropdown');
  const dropdownMenu = document.getElementById('dropdownMenu');

  if (selectedCourseText) selectedCourseText.textContent = val;
  if (adjustCourseValue) adjustCourseValue.value = val;
  if (customDropdown) customDropdown.classList.remove('open');
  if (dropdownMenu) dropdownMenu.classList.add('hidden');
}

export function updateStoryPage() {
  if (!recipientData) return;

  const pageIndicator = document.getElementById('pageIndicator');
  const storyProgress = document.getElementById('storyProgress');
  const prevStoryBtn = document.getElementById('prevStoryBtn');
  const nextStoryBtn = document.getElementById('nextStoryBtn');
  const storyPageWrapper = document.getElementById('storyPageWrapper');

  const totalPages = courseData.length + 1;
  if (pageIndicator) pageIndicator.textContent = `${currentStoryIndex + 1} / ${totalPages}`;

  if (storyProgress) {
    const steps = storyProgress.querySelectorAll('.story-step');
    steps.forEach((step, idx) => {
      if (idx <= currentStoryIndex) step.classList.add('active');
      else step.classList.remove('active');
    });
  }

  if (prevStoryBtn) prevStoryBtn.disabled = (currentStoryIndex === 0);
  if (nextStoryBtn) nextStoryBtn.disabled = (currentStoryIndex === totalPages - 1);

  if (!storyPageWrapper) return;
  storyPageWrapper.innerHTML = '';
  const slide = document.createElement('div');
  slide.className = 'story-card-slide';

  if (currentStoryIndex < courseData.length) {
    const item = courseData[currentStoryIndex];
    const moveBadge = item.m ? `<span><i class="fa-solid fa-person-walking"></i> ${item.m}</span>` : '';
    const tipBox = item.tp ? `
      <div class="story-tip-box">
        <i class="fa-regular fa-note-sticky"></i>
        <div><strong>메모:</strong> ${item.tp}</div>
      </div>
    ` : '';

    let galleryHtml = '';
    if (item.p && Array.isArray(item.p) && item.p.length > 0) {
      const count = item.p.length;
      const photoImgs = item.p.map((src) => `<img src="${src}" class="gallery-photo-item" alt="분위기 사진" title="클릭하여 원본 크게 보기" onclick="window.openImageZoom('${src}')">`).join('');
      galleryHtml = `<div class="story-photo-gallery count-${count}">${photoImgs}</div>`;
    }

    // 미니멀하고 감성적인 길찾기 한 줄 칩 바 (터치 시 바텀시트 오픈)
    const actualPlaceName = item.pl || item.n || '장소 확인';
    const locationSubtitle = item.pl && item.pl !== item.n
      ? `${item.pl} (길찾기 & 지도 안내)`
      : `${item.m ? item.m + ' · ' : ''}길찾기 & 지도 위치 확인`;

    const mapBarHtml = `
      <div class="story-location-chip-bar" onclick="window.openMapRouteSheet(${currentStoryIndex})">
        <div class="location-chip-left">
          <i class="fa-solid fa-location-dot location-pin-icon"></i>
          <div class="location-chip-text">
            <span class="location-name">${actualPlaceName}</span>
            <span class="location-hint">${locationSubtitle}</span>
          </div>
        </div>
        <button type="button" class="btn-open-route">
          <span>길찾기</span> <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    `;

    slide.innerHTML = `
      <span class="story-header-tag">${currentStoryIndex + 1}차 코스 · ${item.t}</span>
      <h2 class="story-place-title">${item.n}</h2>
      <div class="story-meta-row">
        <span><i class="fa-regular fa-clock"></i> ${item.tm} 시작</span>
        ${moveBadge}
      </div>
      ${galleryHtml}
      ${tipBox}
      ${mapBarHtml}
    `;
  } else {
    // Final Summary Slide (전체 데이트 코스 이동 동선 & 총 코스 연결 뷰 포함)
    let courseFlowHtml = '';
    if (courseData && courseData.length > 0) {
      const stopsHtml = courseData.map((c, i) => {
        const placeName = c.pl || c.n || `코스 ${i + 1}`;
        const hasUrl = Boolean(c.u);
        const linkBadge = hasUrl ? `<span class="route-link-badge" title="가게 링크 등록됨"><i class="fa-solid fa-link"></i></span>` : '';
        
        let legRouteHtml = '';
        // 1차 -> 2차, 2차 -> 3차 등 다음 코스로 이동하는 구간 길찾기
        if (i < courseData.length - 1) {
          const nextCourse = courseData[i + 1];
          const startName = (c.pl || c.n || '').trim();
          const endName = (nextCourse.pl || nextCourse.n || '').trim();
          const areaPrefix = recipientData && recipientData.a ? recipientData.a.trim() + ' ' : '';

          const startQuery = encodeURIComponent(`${areaPrefix}${startName}`.trim());
          const endQuery = encodeURIComponent(`${areaPrefix}${endName}`.trim());

          // 1대1 길찾기 URL (출발지, 도착지)
          const naverLegUrl = `https://map.naver.com/p/directions/${startQuery}/,/${endQuery}/-/transit?c=15.00,0,0,0,dh`;
          const kakaoLegUrl = `https://map.kakao.com/link/to/${endQuery}`;

          legRouteHtml = `
            <div class="route-leg-bridge">
              <div class="route-leg-line-wrap">
                <span class="route-leg-line"></span>
                <span class="route-leg-pill">
                  <i class="fa-solid fa-person-walking"></i> ${i + 1}차 ➔ ${i + 2}차 이동
                </span>
                <span class="route-leg-line"></span>
              </div>
              <div class="route-leg-actions">
                <a href="${naverLegUrl}" target="_blank" rel="noopener noreferrer" class="btn-leg-nav naver" title="${startName}에서 ${endName}까지 네이버 길찾기">
                  <i class="fa-solid fa-diamond-turn-right"></i> 네이버 길찾기
                </a>
                <a href="${kakaoLegUrl}" target="_blank" rel="noopener noreferrer" class="btn-leg-nav kakao" title="${endName} 도착 카카오맵 길찾기">
                  <i class="fa-solid fa-location-arrow"></i> 카카오 길찾기
                </a>
              </div>
            </div>
          `;
        }

        return `
          <div class="route-timeline-node" onclick="window.openMapRouteSheet(${i})" title="클릭하여 ${placeName} 지도 및 상세 링크 보기">
            <div class="route-node-badge">${i + 1}차</div>
            <div class="route-node-content">
              <div class="route-node-name">${placeName} ${linkBadge}</div>
              <div class="route-node-meta">${c.tm || ''} · ${c.t || ''}</div>
            </div>
          </div>
          ${legRouteHtml}
        `;
      }).join('');

      courseFlowHtml = `
        <div class="summary-route-card">
          <div class="summary-route-header">
            <div class="route-header-title">
              <i class="fa-solid fa-route"></i>
              <span>전체 데이트 동선 & 코스 요약 (총 ${courseData.length}곳)</span>
            </div>
          </div>
          <div class="summary-route-timeline">
            ${stopsHtml}
          </div>
        </div>
      `;
    }

    slide.innerHTML = `
      <span class="story-header-tag">💌 데이트 약속 최종 요약</span>
      <h2 class="story-place-title">${recipientData.r}아, 나와 데이트할래?</h2>
      <div class="story-meta-row" style="flex-wrap: wrap;">
        <span><i class="fa-regular fa-calendar-check"></i> ${formatDateString(recipientData.d)}</span>
        <span><i class="fa-solid fa-location-dot"></i> ${recipientData.a}</span>
        <span><i class="fa-solid fa-wallet"></i> 예산 ${recipientData.b}</span>
      </div>
      <div class="story-tip-box" style="background: #FFF8F0; border-color: #F0D5C0;">
        <i class="fa-solid fa-quote-left" style="color: #E07A5F;"></i>
        <div style="white-space: pre-wrap; font-size: 1rem; line-height: 1.6;">${recipientData.m}</div>
      </div>
      ${courseFlowHtml}
    `;
  }

  storyPageWrapper.appendChild(slide);
}

export function updateViewerActionUI(data) {
  if (!data) return;

  const creatorNoticeBanner = document.getElementById('creatorNoticeBanner');
  const creatorShareAgainBtn = document.getElementById('creatorShareAgainBtn');
  const acceptBtn = document.getElementById('acceptBtn');
  const feedbackBtn = document.getElementById('feedbackBtn');
  const downloadCardBtn = document.getElementById('downloadCardBtn');
  const saveStoryCardBtn = document.getElementById('saveStoryCardBtn');
  const saveStoryCardTitle = document.getElementById('saveStoryCardTitle');
  const acceptedStatusBanner = document.getElementById('acceptedStatusBanner');
  const actionDropdownWrapper = document.getElementById('actionDropdownWrapper');

  const cardId = data.id || data.cardId;
  let myCreated = [];
  try {
    myCreated = JSON.parse(localStorage.getItem(CONFIG.STORAGE_CREATED_IDS || 'dateplanner_my_created_ids') || '[]');
  } catch (e) {}

  const isCreator = Boolean(
    (cardId && myCreated.includes(cardId)) || 
    (AuthService.currentUser && data.creatorId && AuthService.currentUser.id === data.creatorId)
  );

  let acceptedList = [];
  try {
    acceptedList = JSON.parse(localStorage.getItem(CONFIG.STORAGE_ACCEPTED || 'dateplanner_accepted_cards') || '[]');
  } catch (e) {}

  let isAccepted = Boolean(
    (cardId && acceptedList.includes(cardId)) || 
    data.isAccepted === true
  );

  function updateSaveBtnState() {
    if (!saveStoryCardBtn) return;
    const isSaved = ArchiveService.findDuplicate({
      senderName: data.s,
      receiverName: data.r,
      date: data.d,
      area: data.a,
      courses: data.c
    });
    if (isSaved) {
      saveStoryCardBtn.classList.add('saved');
      if (saveStoryCardTitle) saveStoryCardTitle.textContent = '내 캘린더에 저장 완료 💖';
    } else {
      saveStoryCardBtn.classList.remove('saved');
      if (saveStoryCardTitle) saveStoryCardTitle.textContent = '내 캘린더에 데이트 담기';
    }
  }

  if (actionDropdownWrapper) actionDropdownWrapper.classList.remove('hidden');

  const acceptChoiceContainer = document.getElementById('acceptChoiceContainer');

  if (isCreator) {
    if (creatorNoticeBanner) creatorNoticeBanner.classList.remove('hidden');
    if (creatorShareAgainBtn) creatorShareAgainBtn.classList.remove('hidden');
    if (acceptBtn) acceptBtn.classList.add('hidden');
    if (acceptChoiceContainer) acceptChoiceContainer.classList.add('hidden');
    if (feedbackBtn) feedbackBtn.classList.add('hidden');
    if (downloadCardBtn) downloadCardBtn.classList.remove('hidden');
    if (saveStoryCardBtn) saveStoryCardBtn.classList.remove('hidden');

    updateSaveBtnState();

    if (isAccepted) {
      if (acceptedStatusBanner) {
        acceptedStatusBanner.classList.remove('hidden');
        acceptedStatusBanner.innerHTML = '<i class="fa-solid fa-heart-circle-check"></i> <span>상대방이 데이트 약속을 수락했습니다! 💖</span>';
      }
    } else {
      if (acceptedStatusBanner) acceptedStatusBanner.classList.add('hidden');
    }
    return;
  }

  // Recipient View
  if (creatorNoticeBanner) creatorNoticeBanner.classList.add('hidden');
  if (creatorShareAgainBtn) creatorShareAgainBtn.classList.add('hidden');

  if (isAccepted) {
    if (acceptedStatusBanner) {
      acceptedStatusBanner.classList.remove('hidden');
      acceptedStatusBanner.innerHTML = '<i class="fa-solid fa-heart-circle-check"></i> <span>데이트 약속을 수락하셨습니다! (확정됨 💖)</span>';
    }
    if (acceptBtn) acceptBtn.classList.add('hidden');
    if (acceptChoiceContainer) acceptChoiceContainer.classList.add('hidden');
    if (feedbackBtn) feedbackBtn.classList.add('hidden');
    if (downloadCardBtn) downloadCardBtn.classList.remove('hidden');
    if (saveStoryCardBtn) saveStoryCardBtn.classList.remove('hidden');
  } else {
    if (acceptedStatusBanner) acceptedStatusBanner.classList.add('hidden');
    if (acceptBtn) acceptBtn.classList.add('hidden'); // use choice container instead
    if (acceptChoiceContainer) acceptChoiceContainer.classList.remove('hidden');
    if (feedbackBtn) feedbackBtn.classList.remove('hidden');
    if (downloadCardBtn) downloadCardBtn.classList.remove('hidden');
    if (saveStoryCardBtn) saveStoryCardBtn.classList.remove('hidden');
  }

  updateSaveBtnState();

  // Cloud Verification with Supabase
  const supabaseClient = getSupabaseClient();
  if (supabaseClient && cardId) {
    supabaseClient
      .from('date_cards')
      .select('is_accepted')
      .eq('id', cardId)
      .maybeSingle()
      .then(({ data: dbRow }) => {
        if (dbRow && dbRow.is_accepted && !isAccepted) {
          try {
            acceptedList.push(cardId);
            localStorage.setItem(CONFIG.STORAGE_ACCEPTED || 'dateplanner_accepted_cards', JSON.stringify(acceptedList));
          } catch (e) {}
          updateViewerActionUI(Object.assign({}, data, { isAccepted: true }));
        }
      })
      .catch(() => {});
  }
}

export function sendAcceptKakaoMessage(isAuto = false, choiceTitle = '') {
  const sender = recipientData ? recipientData.s : '신청자';
  const recipient = recipientData ? recipientData.r : '그대';
  const targetDate = recipientData ? formatDateString(recipientData.d) : '특별한 날';
  const currentUrl = window.location.href;
  const reactionText = choiceTitle || '갈게! 너무 마음에 들어 🌿';

  sendKakaoFeed({
    title: `💖 [데이트 수락] ${recipient}님이 데이트 코스를 수락했어요!`,
    description: `${sender}아! "${reactionText}"\n📅 데이트 약속: ${targetDate}\n설레는 마음으로 그날 만나요 ✨`,
    imageUrl: CONFIG.DEFAULT_OG_IMAGE,
    webUrl: currentUrl,
    buttonTitle: '확정된 데이트 코스 보기 💖',
    fallbackText: `[DatePlanner 데이트 수락 💖]\n${sender}아! "${reactionText}"\n\n📅 데이트 날짜: ${targetDate}\n✨ 확정 코스 보기: ${currentUrl}`,
    toastMsg: '카카오톡으로 수락 답장 창이 열렸습니다! 💖',
    isAuto: isAuto
  });
}

export function downloadCardImage() {
  const cardTarget = document.getElementById('storyPageWrapper');
  if (!cardTarget) return;

  const activeModals = Array.from(document.querySelectorAll('.modal-overlay:not(.hidden), .accept-overlay:not(.hidden)'));
  const toastEl = document.getElementById('toast');

  activeModals.forEach(m => {
    m.style.opacity = '0';
    m.style.visibility = 'hidden';
  });
  if (toastEl) {
    toastEl.style.opacity = '0';
    toastEl.style.visibility = 'hidden';
  }

  showToast('📸 초대장 카드를 이미지로 변환 중입니다...');

  if (typeof html2canvas !== 'function') {
    activeModals.forEach(m => {
      m.style.opacity = '';
      m.style.visibility = '';
    });
    if (toastEl) {
      toastEl.style.opacity = '';
      toastEl.style.visibility = '';
    }
    showToast('이미지 변환 모듈을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.', true);
    return;
  }

  setTimeout(() => {
    html2canvas(cardTarget, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      scrollX: 0,
      scrollY: 0
    }).then(canvas => {
      activeModals.forEach(m => {
        m.style.opacity = '';
        m.style.visibility = '';
      });
      if (toastEl) {
        toastEl.style.opacity = '';
        toastEl.style.visibility = '';
      }

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
      activeModals.forEach(m => {
        m.style.opacity = '';
        m.style.visibility = '';
      });
      if (toastEl) {
        toastEl.style.opacity = '';
        toastEl.style.visibility = '';
      }
      console.error('Card capture error:', err);
      showToast('이미지 저장 중 오류가 발생했습니다.', true);
    });
  }, 120);
}

export function bindStoryViewerEvents() {
  const prevStoryBtn = document.getElementById('prevStoryBtn');
  const nextStoryBtn = document.getElementById('nextStoryBtn');
  const storyPageWrapper = document.getElementById('storyPageWrapper');
  const acceptBtn = document.getElementById('acceptBtn');
  const acceptModalTitle = document.getElementById('acceptModalTitle');
  const acceptModalDesc = document.getElementById('acceptModalDesc');
  const acceptOverlay = document.getElementById('acceptOverlay');
  const sendAcceptKakaoBtn = document.getElementById('sendAcceptKakaoBtn');
  const closeAcceptBtn = document.getElementById('closeAcceptBtn');
  const creatorShareAgainBtn = document.getElementById('creatorShareAgainBtn');
  const downloadCardBtn = document.getElementById('downloadCardBtn');
  const downloadModalCardBtn = document.getElementById('downloadModalCardBtn');
  const feedbackBtn = document.getElementById('feedbackBtn');
  const feedbackModal = document.getElementById('feedbackModal');
  const closeFeedbackModalBtn = document.getElementById('closeFeedbackModalBtn');
  const sendFeedbackKakaoBtn = document.getElementById('sendFeedbackKakaoBtn');
  const adjustCourseValue = document.getElementById('adjustCourseValue');
  const adjustMessage = document.getElementById('adjustMessage');
  const makeNewBtn = document.getElementById('makeNewBtn');
  const customDropdown = document.getElementById('customDropdown');
  const dropdownSelected = document.getElementById('dropdownSelected');
  const dropdownMenu = document.getElementById('dropdownMenu');

  // Pager Prev/Next
  if (prevStoryBtn) {
    prevStoryBtn.addEventListener('click', () => {
      if (currentStoryIndex > 0) {
        currentStoryIndex--;
        updateStoryPage();
      }
    });
  }

  if (nextStoryBtn) {
    nextStoryBtn.addEventListener('click', () => {
      const totalPages = courseData.length + 1;
      if (currentStoryIndex < totalPages - 1) {
        currentStoryIndex++;
        updateStoryPage();
      }
    });
  }

  // Touch Swipe
  if (storyPageWrapper) {
    let startX = 0;
    storyPageWrapper.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    storyPageWrapper.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      const totalPages = courseData.length + 1;

      if (diff > 50 && currentStoryIndex < totalPages - 1) {
        currentStoryIndex++;
        updateStoryPage();
      } else if (diff < -50 && currentStoryIndex > 0) {
        currentStoryIndex--;
        updateStoryPage();
      }
    });
  }

  // Feedback Dropdown Toggle
  if (dropdownSelected && customDropdown && dropdownMenu) {
    dropdownSelected.addEventListener('click', (e) => {
      e.stopPropagation();
      customDropdown.classList.toggle('open');
      dropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!customDropdown.contains(e.target)) {
        customDropdown.classList.remove('open');
        dropdownMenu.classList.add('hidden');
      }
    });
  }

  // Dual Accept Choices Handling
  const acceptBtnChoice1 = document.getElementById('acceptBtnChoice1');
  const acceptBtnChoice2 = document.getElementById('acceptBtnChoice2');
  const acceptChoiceContainer = document.getElementById('acceptChoiceContainer');

  const processAccept = async (choiceTitle, isEnthusiastic = false) => {
    const sender = recipientData ? recipientData.s : '신청자';
    const cardId = recipientData ? (recipientData.id || recipientData.cardId) : null;

    if (cardId) {
      try {
        const acceptedList = JSON.parse(localStorage.getItem(CONFIG.STORAGE_ACCEPTED || 'dateplanner_accepted_cards') || '[]');
        if (!acceptedList.includes(cardId)) {
          acceptedList.push(cardId);
          localStorage.setItem(CONFIG.STORAGE_ACCEPTED || 'dateplanner_accepted_cards', JSON.stringify(acceptedList));
        }
      } catch (e) {}
      ArchiveService.markCardAccepted(cardId);
    }

    if (acceptBtn) acceptBtn.classList.add('hidden');
    if (acceptChoiceContainer) acceptChoiceContainer.classList.add('hidden');
    if (feedbackBtn) feedbackBtn.classList.add('hidden');

    const acceptedStatusBanner = document.getElementById('acceptedStatusBanner');
    if (acceptedStatusBanner) {
      acceptedStatusBanner.classList.remove('hidden');
      acceptedStatusBanner.innerHTML = `<i class="fa-solid fa-heart-circle-check"></i> <span>"${choiceTitle}" 데이트 약속이 확정되었습니다! 💖</span>`;
    }
    if (downloadCardBtn) downloadCardBtn.classList.remove('hidden');

    triggerRomanticConfetti();
    if (isEnthusiastic) {
      setTimeout(() => triggerRomanticConfetti(), 400);
    }

    if (acceptModalTitle) acceptModalTitle.textContent = `🎉 "${choiceTitle}" 수락 완료!`;
    if (acceptModalDesc) {
      acceptModalDesc.textContent = `${sender}님과의 설레는 데이트 약속이 확정되었습니다! 아래 버튼을 눌러 ${sender}님께 카카오톡으로 수락 답장을 전송해 보세요 💖`;
    }
    if (acceptOverlay) acceptOverlay.classList.remove('hidden');

    sendAcceptKakaoMessage(true, choiceTitle);
  };

  if (acceptBtnChoice1) {
    acceptBtnChoice1.addEventListener('click', () => processAccept('갈게! 💖', false));
  }
  if (acceptBtnChoice2) {
    acceptBtnChoice2.addEventListener('click', () => processAccept('당연히 가야지! 무조건! 🥰', true));
  }
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => processAccept('데이트 코스 완벽해! 수락하기 💖', false));
  }

  // External Calendar Modal Handling
  const externalCalendarModal = document.getElementById('externalCalendarModal');
  const ddayCalendarBtn = document.getElementById('ddayCalendarBtn');
  const openExternalCalFromMenuBtn = document.getElementById('openExternalCalFromMenuBtn');
  const closeExternalCalBtn = document.getElementById('closeExternalCalBtn');
  const closeExternalCalBottomBtn = document.getElementById('closeExternalCalBottomBtn');
  const btnGoogleCalendar = document.getElementById('btnGoogleCalendar');
  const btnNaverCalendar = document.getElementById('btnNaverCalendar');
  const btnAppleCalendar = document.getElementById('btnAppleCalendar');

  const openExternalCalendarModal = () => {
    if (!recipientData || !externalCalendarModal) return;

    if (btnGoogleCalendar) {
      btnGoogleCalendar.href = generateGoogleCalendarUrl(recipientData);
    }
    if (btnNaverCalendar) {
      btnNaverCalendar.href = generateNaverCalendarUrl(recipientData);
    }
    if (btnAppleCalendar) {
      btnAppleCalendar.onclick = (e) => {
        e.preventDefault();
        downloadICalendarFile(recipientData);
        showToast('애플/스마트폰 캘린더 파일(.ics)이 다운로드되었습니다! 📅');
      };
    }

    externalCalendarModal.classList.remove('hidden');
  };

  if (ddayCalendarBtn) {
    ddayCalendarBtn.addEventListener('click', openExternalCalendarModal);
  }
  if (openExternalCalFromMenuBtn) {
    openExternalCalFromMenuBtn.addEventListener('click', openExternalCalendarModal);
  }
  if (closeExternalCalBtn && externalCalendarModal) {
    closeExternalCalBtn.addEventListener('click', () => externalCalendarModal.classList.add('hidden'));
  }
  if (closeExternalCalBottomBtn && externalCalendarModal) {
    closeExternalCalBottomBtn.addEventListener('click', () => externalCalendarModal.classList.add('hidden'));
  }

  // Map Route Bottom Sheet Modal Handling
  const mapRouteModal = document.getElementById('mapRouteModal');
  const closeMapRouteBtn = document.getElementById('closeMapRouteBtn');
  const closeMapRouteBottomBtn = document.getElementById('closeMapRouteBottomBtn');

  if (closeMapRouteBtn && mapRouteModal) {
    closeMapRouteBtn.addEventListener('click', () => mapRouteModal.classList.add('hidden'));
  }
  if (closeMapRouteBottomBtn && mapRouteModal) {
    closeMapRouteBottomBtn.addEventListener('click', () => mapRouteModal.classList.add('hidden'));
  }
  if (mapRouteModal) {
    mapRouteModal.addEventListener('click', (e) => {
      if (e.target === mapRouteModal) {
        mapRouteModal.classList.add('hidden');
      }
    });
  }

  if (sendAcceptKakaoBtn) {
    sendAcceptKakaoBtn.addEventListener('click', () => sendAcceptKakaoMessage(false));
  }

  if (closeAcceptBtn && acceptOverlay) {
    closeAcceptBtn.addEventListener('click', () => {
      acceptOverlay.classList.add('hidden');
    });
  }

  // Creator Share Again Button
  if (creatorShareAgainBtn) {
    creatorShareAgainBtn.addEventListener('click', () => {
      const targetUrl = window.location.href;
      const recipient = recipientData ? recipientData.r : '소중한 사람';
      const sender = recipientData ? recipientData.s : '신청자';

      sendKakaoFeed({
        title: `💌 [DateCard] ${sender}님이 보낸 데이트 초대장`,
        description: `${recipient}아, 너만을 위해 준비한 감성 데이트 코스야! 확인해 볼래? 🌿`,
        imageUrl: CONFIG.SECONDARY_OG_IMAGE,
        webUrl: targetUrl,
        buttonTitle: '스토리 초대장 확인하기 💖',
        fallbackText: `[DateCard 초대장 💌]\n${sender}님이 보낸 데이트 초대장:\n${targetUrl}`,
        toastMsg: '카카오톡 공유창이 열렸습니다! 💬'
      });
    });
  }

  // Download Card Image
  [downloadCardBtn, downloadModalCardBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', downloadCardImage);
  });

  // Feedback Modal
  if (feedbackBtn && feedbackModal) {
    feedbackBtn.addEventListener('click', () => {
      feedbackModal.classList.remove('hidden');
    });
  }

  if (closeFeedbackModalBtn && feedbackModal) {
    closeFeedbackModalBtn.addEventListener('click', () => {
      feedbackModal.classList.add('hidden');
    });
  }

  if (sendFeedbackKakaoBtn && feedbackModal) {
    sendFeedbackKakaoBtn.addEventListener('click', () => {
      const selectedTarget = (adjustCourseValue && adjustCourseValue.value) || '코스 전체';
      const reqMsg = (adjustMessage && adjustMessage.value.trim()) || '';
      if (!reqMsg) {
        showToast('변경하고 싶은 제안 내용을 작성해 주세요! 💬', true);
        return;
      }

      const sender = recipientData ? recipientData.s : '남친';
      const recipient = recipientData ? recipientData.r : '그대';
      const currentUrl = window.location.href;

      sendKakaoFeed({
        title: `💌 [데이트 조율] ${recipient}님의 코스 변경 제안`,
        description: `${sender}아! [${selectedTarget}] 코스에 대해 의견이 있어요:\n"${reqMsg}"\n함께 이야기 나누고 조율해 봐요 🌿`,
        imageUrl: CONFIG.SECONDARY_OG_IMAGE,
        webUrl: currentUrl,
        buttonTitle: '코스 확인하고 조율하기 💬',
        fallbackText: `[DatePlanner 코스 조정 요청 💬]\n${sender}아! 데이트 신청 잘 봤어 🌿\n\n📌 요청 코스: ${selectedTarget}\n💌 제안 내용: "${reqMsg}"\n\n👉 코스 링크: ${currentUrl}`,
        toastMsg: '카카오톡 조정 요청 창이 열렸습니다! 💬'
      });

      feedbackModal.classList.add('hidden');
    });
  }

  if (makeNewBtn) {
    makeNewBtn.addEventListener('click', () => {
      window.location.href = window.location.origin + window.location.pathname;
    });
  }
}
