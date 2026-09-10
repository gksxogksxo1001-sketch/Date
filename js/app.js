// ====================================================
// APP.JS — DatePlanner 메인 진입점 (ES Modules)
// ====================================================
import { CONFIG } from './config.js';
import { initKakao, sendKakaoFeed } from './kakao-share.js';
import { AuthService } from './auth-service.js';
import { ArchiveService } from './archive-service.js';
import { CalendarService } from './calendar-service.js';
import { initCourseForm, getFormData } from './course-form.js';
import {
  openCardFromShareUrl,
  checkAndLoadCardFromUrl,
  bindStoryViewerEvents,
  loadCardByToken,
  recipientData
} from './story-viewer.js';
import {
  encodePayload,
  showToast,
  copyToClipboard,
  formatDateString,
  getHashParam
} from './utils.js';
import { EnvelopeOpening } from './envelope-opening.js';
import { LivePreview } from './live-preview.js';

let generatedShareUrl = '';
let isCreatingCard = false;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize SDKs
  initKakao();

  // 2. Wire up service dependencies
  AuthService.setDependencies({
    archiveService: ArchiveService,
    calendarService: CalendarService
  });

  ArchiveService.setDependencies({
    calendarService: CalendarService,
    openCardHandler: openCardFromShareUrl
  });

  CalendarService.setDependencies({
    openCardHandler: openCardFromShareUrl
  });

  // 3. Initialize Services and Form Components
  AuthService.init();
  CalendarService.init();
  ArchiveService.updateCountBadge();
  initCourseForm();
  bindStoryViewerEvents();
  EnvelopeOpening.init();
  LivePreview.init();

  // 4. Global Nav & Auth Event Handlers
  const navBrandBtn = document.getElementById('navBrandBtn');
  const kakaoLoginBtn = document.getElementById('kakaoLoginBtn');
  const kakaoLogoutBtn = document.getElementById('kakaoLogoutBtn');
  const openArchiveBtn = document.getElementById('openArchiveBtn');
  const closeArchiveModalBtn = document.getElementById('closeArchiveModalBtn');
  const closeArchiveBottomBtn = document.getElementById('closeArchiveBottomBtn');
  const archiveModal = document.getElementById('archiveModal');
  const archiveCreateNewBtn = document.getElementById('archiveCreateNewBtn');

  if (navBrandBtn) {
    navBrandBtn.addEventListener('click', () => {
      window.location.href = window.location.origin + window.location.pathname;
    });
  }

  if (kakaoLoginBtn) {
    kakaoLoginBtn.addEventListener('click', () => {
      AuthService.login();
    });
  }

  const archiveModalKakaoLoginBtn = document.getElementById('archiveModalKakaoLoginBtn');
  if (archiveModalKakaoLoginBtn) {
    archiveModalKakaoLoginBtn.addEventListener('click', () => {
      AuthService.login();
    });
  }

  if (kakaoLogoutBtn) {
    kakaoLogoutBtn.addEventListener('click', () => {
      AuthService.logout();
    });
  }

  if (openArchiveBtn) {
    openArchiveBtn.addEventListener('click', () => {
      ArchiveService.loadAndRender();
      if (archiveModal) archiveModal.classList.remove('hidden');
    });
  }

  if (closeArchiveModalBtn) {
    closeArchiveModalBtn.addEventListener('click', () => {
      if (archiveModal) archiveModal.classList.add('hidden');
    });
  }

  if (closeArchiveBottomBtn) {
    closeArchiveBottomBtn.addEventListener('click', () => {
      if (archiveModal) archiveModal.classList.add('hidden');
    });
  }

  if (archiveCreateNewBtn) {
    archiveCreateNewBtn.addEventListener('click', () => {
      if (archiveModal) archiveModal.classList.add('hidden');
      switchToCreateMode();
    });
  }

  // 5. Landing Page CTA Handlers
  const landingMode = document.getElementById('landingMode');
  const appHeader = document.getElementById('appHeader');
  const createMode = document.getElementById('createMode');
  const heroCTA = document.getElementById('heroCTA');
  const bottomCTA = document.getElementById('bottomCTA');

  function switchToCreateMode() {
    if (landingMode) landingMode.classList.add('hidden');
    if (appHeader) appHeader.classList.remove('hidden');
    if (createMode) createMode.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (heroCTA) heroCTA.addEventListener('click', switchToCreateMode);
  if (bottomCTA) bottomCTA.addEventListener('click', switchToCreateMode);

  // 6. Action Dropdown Toggle & Save in Story Viewer
  const actionDropdownWrapper = document.getElementById('actionDropdownWrapper');
  const actionDropdownToggle = document.getElementById('actionDropdownToggle');
  const actionDropdownMenu = document.getElementById('actionDropdownMenu');
  const saveStoryCardBtn = document.getElementById('saveStoryCardBtn');
  const saveStoryCardTitle = document.getElementById('saveStoryCardTitle');

  if (actionDropdownToggle && actionDropdownMenu) {
    actionDropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isClosed = actionDropdownMenu.classList.contains('hidden');
      if (isClosed) {
        actionDropdownMenu.classList.remove('hidden');
        actionDropdownToggle.classList.add('open');
      } else {
        actionDropdownMenu.classList.add('hidden');
        actionDropdownToggle.classList.remove('open');
      }
    });

    document.addEventListener('click', (e) => {
      if (actionDropdownWrapper && !actionDropdownWrapper.contains(e.target)) {
        actionDropdownMenu.classList.add('hidden');
        actionDropdownToggle.classList.remove('open');
      }
    });

    actionDropdownMenu.querySelectorAll('.dropdown-action-item').forEach(item => {
      item.addEventListener('click', () => {
        actionDropdownMenu.classList.add('hidden');
        actionDropdownToggle.classList.remove('open');
      });
    });
  }

  if (saveStoryCardBtn) {
    saveStoryCardBtn.addEventListener('click', async () => {
      if (!recipientData) {
        showToast('저장할 데이트 카드 데이터를 찾을 수 없습니다.', true);
        return;
      }

      const cardPayload = {
        id: recipientData.id || recipientData.cardId || ('card_' + Date.now()),
        s: recipientData.s,
        r: recipientData.r,
        d: recipientData.d,
        a: recipientData.a,
        b: recipientData.b,
        m: recipientData.m,
        tm: recipientData.tm,
        c: recipientData.c || [],
        isAccepted: recipientData.isAccepted || false
      };

      const shareUrl = window.location.href;
      await ArchiveService.save(cardPayload, shareUrl);

      saveStoryCardBtn.classList.add('saved');
      if (saveStoryCardTitle) {
        saveStoryCardTitle.textContent = '내 캘린더에 저장 완료 💖';
      }

      showToast('🎉 내 캘린더와 보관함에 데이트 일정이 쏙 담겼습니다! 📅');
      CalendarService.render();
    });
  }

  // 7. Duplicate Notice Modal
  const duplicateModal = document.getElementById('duplicateModal');
  const dupReceiverName = document.getElementById('dupReceiverName');
  const dupPreviewTag = document.getElementById('dupPreviewTag');
  const dupPreviewCreated = document.getElementById('dupPreviewCreated');
  const dupPreviewTitle = document.getElementById('dupPreviewTitle');
  const dupPreviewMeta = document.getElementById('dupPreviewMeta');
  const dupPreviewCourses = document.getElementById('dupPreviewCourses');
  const dupOpenExistingBtn = document.getElementById('dupOpenExistingBtn');
  const dupOpenArchiveBtn = document.getElementById('dupOpenArchiveBtn');
  const closeDupModalBtn = document.getElementById('closeDupModalBtn');

  function showDuplicateNotice(card) {
    if (!duplicateModal) {
      alert(`이미 ${card.receiverName}님에게 보낼 데이트 초대장이 보관함에 보관되어 있습니다!`);
      return;
    }

    if (dupReceiverName) dupReceiverName.textContent = card.receiverName;
    if (dupPreviewTag) {
      dupPreviewTag.textContent = card.theme === 'rose' ? '🌹 Romantic Rose' : (card.theme === 'midnight' ? '🌙 Midnight Navy' : '🌿 Warm Cozy');
    }
    if (dupPreviewCreated) {
      dupPreviewCreated.textContent = new Date(card.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' 생성';
    }
    if (dupPreviewTitle) {
      dupPreviewTitle.innerHTML = `To. <strong>${card.receiverName}</strong> <span style="font-size:0.85rem; color:var(--text-muted); font-weight:400;">(From. ${card.senderName})</span>`;
    }
    if (dupPreviewMeta) {
      dupPreviewMeta.innerHTML = `
        <span><i class="fa-regular fa-calendar-check"></i> ${formatDateString(card.date)}</span>
        <span><i class="fa-solid fa-location-dot"></i> ${card.area}</span>
        <span><i class="fa-solid fa-wallet"></i> ${card.budget}</span>
      `;
    }
    if (dupPreviewCourses) {
      const summary = (card.courses || []).map((c, i) => `${i + 1}차: ${c.n}`).join(' ➔ ') || '코스 정보';
      dupPreviewCourses.innerHTML = `<i class="fa-solid fa-route"></i> <span>${summary}</span>`;
    }

    duplicateModal.classList.remove('hidden');

    if (dupOpenExistingBtn) {
      dupOpenExistingBtn.onclick = () => {
        duplicateModal.classList.add('hidden');
        openCardFromShareUrl(card.shareUrl || card.id);
      };
    }

    if (dupOpenArchiveBtn) {
      dupOpenArchiveBtn.onclick = () => {
        duplicateModal.classList.add('hidden');
        if (archiveModal) {
          archiveModal.classList.remove('hidden');
          ArchiveService.loadAndRender();
        }
      };
    }

    if (closeDupModalBtn) {
      closeDupModalBtn.onclick = () => {
        duplicateModal.classList.add('hidden');
      };
    }
  }

  // 8. Create Invitation Submit Handler
  const createBtn = document.getElementById('createBtn');
  const shareModal = document.getElementById('shareModal');
  const shareUrlInput = document.getElementById('shareUrlInput');
  const copyBtn = document.getElementById('copyBtn');
  const previewBtn = document.getElementById('previewBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const shareKakaoBtn = document.getElementById('shareKakaoBtn');

  if (createBtn) {
    createBtn.addEventListener('click', () => {
      if (isCreatingCard) return;

      const formData = getFormData();
      if (!formData) return;

      const { senderName, receiverName, dateVal, mainArea, budget, message, theme, courses } = formData;

      // Duplicate Check
      const existingDuplicate = ArchiveService.findDuplicate({
        senderName,
        receiverName,
        date: dateVal,
        area: mainArea,
        courses
      });

      if (existingDuplicate) {
        showDuplicateNotice(existingDuplicate);
        return;
      }

      isCreatingCard = true;
      createBtn.disabled = true;
      createBtn.classList.add('btn-loading');
      const originalBtnHtml = createBtn.innerHTML;
      createBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 초대장 생성 중...';

      const cardId = 'card_' + Date.now();
      const creatorId = AuthService.currentUser ? AuthService.currentUser.id : ('creator_' + Date.now());
      const payload = {
        id: cardId,
        creatorId: creatorId,
        s: senderName,
        r: receiverName,
        d: dateVal,
        a: mainArea,
        b: budget,
        m: message,
        tm: theme,
        c: courses,
        ts: Date.now()
      };

      try {
        localStorage.setItem(cardId, JSON.stringify(payload));
        const myCreated = JSON.parse(localStorage.getItem(CONFIG.STORAGE_CREATED_IDS || 'dateplanner_my_created_ids') || '[]');
        if (!myCreated.includes(cardId)) {
          myCreated.push(cardId);
          localStorage.setItem(CONFIG.STORAGE_CREATED_IDS || 'dateplanner_my_created_ids', JSON.stringify(myCreated));
        }
      } catch (e) {
        console.warn('LocalStorage save warning:', e);
      }

      const encodedToken = encodePayload(payload);
      let baseUrl = window.location.origin + window.location.pathname;
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = CONFIG.BASE_URL;
      }
      generatedShareUrl = `${baseUrl}#card=${encodedToken}`;

      ArchiveService.save(payload, generatedShareUrl);

      if (shareUrlInput) shareUrlInput.value = generatedShareUrl;
      if (shareModal) shareModal.classList.remove('hidden');

      setTimeout(() => {
        isCreatingCard = false;
        createBtn.disabled = false;
        createBtn.classList.remove('btn-loading');
        createBtn.innerHTML = originalBtnHtml;
      }, 800);
    });
  }

  // 9. Share Modal Handlers
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!generatedShareUrl) return;
      copyToClipboard(generatedShareUrl, '스토리 초대장 링크가 복사되었습니다! 🌿');
    });
  }

  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      if (shareModal) shareModal.classList.add('hidden');
      openCardFromShareUrl(generatedShareUrl);
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      if (shareModal) shareModal.classList.add('hidden');
    });
  }

  if (shareKakaoBtn) {
    shareKakaoBtn.addEventListener('click', () => {
      if (!generatedShareUrl) return;

      const sender = (document.getElementById('senderName')?.value || '').trim() || '신청자';
      const receiver = (document.getElementById('receiverName')?.value || '').trim() || '상대방';
      const dateVal = document.getElementById('date')?.value || '';
      const areaVal = (document.getElementById('mainArea')?.value || '').trim() || '데이트 장소';
      const formattedDate = formatDateString(dateVal);

      sendKakaoFeed({
        title: `💌 ${sender}님이 보낸 감성 데이트 초대장 💖`,
        description: `${receiver}야! ${formattedDate}에 ${areaVal}에서 만나자! 🌿`,
        imageUrl: CONFIG.DEFAULT_OG_IMAGE,
        webUrl: generatedShareUrl,
        buttonTitle: '스토리 초대장 확인하기 💖',
        fallbackText: `[DateCard 초대장 💌]\n${sender}님이 보낸 데이트 초대장이 도착했습니다! 💖\n아래 링크를 눌러 스토리로 확인해 보세요 🌿\n\n${generatedShareUrl}`,
        toastMsg: '카카오톡 공유창이 열렸습니다! 💬'
      });
    });
  }

  // 10. Hashchange navigation listener
  window.addEventListener('hashchange', () => {
    const hashCardToken = getHashParam('card');
    const viewMode = document.getElementById('viewMode');
    if (hashCardToken) {
      loadCardByToken(hashCardToken);
    } else if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      if (viewMode) viewMode.classList.add('hidden');
      if (createMode) createMode.classList.add('hidden');
      if (appHeader) appHeader.classList.add('hidden');
      if (landingMode) landingMode.classList.remove('hidden');
    }
  });

  // 11. Initial Card Load from URL
  checkAndLoadCardFromUrl();
});
