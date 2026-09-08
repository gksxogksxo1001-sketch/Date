// ====================================================
// KAKAO TALK API KEY CONFIGURATION
// JavaScript 키 (공유/SDK용) & REST API 키 (로그인/OAuth용)
// ====================================================
const KAKAO_JS_KEY = 'd26b232de6dfcbfa561ff1fd2c6afd54';
const KAKAO_REST_KEY = 'f943d3d735eddc5934ec0b5363a38532';
const KAKAO_APP_KEY = KAKAO_JS_KEY;

let courseData = [];
let currentStoryIndex = 0;
let recipientData = null;
const coursePhotosMap = {}; // Stores photo DataURLs per course index

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const appBody = document.getElementById('appBody');
  const landingMode = document.getElementById('landingMode');
  const appHeader = document.getElementById('appHeader');
  const createMode = document.getElementById('createMode');
  const viewMode = document.getElementById('viewMode');
  const courseList = document.getElementById('courseList');
  const addCourseBtn = document.getElementById('addCourseBtn');
  const budgetChips = document.getElementById('budgetChips');
  const selectedBudget = document.getElementById('selectedBudget');
  const createBtn = document.getElementById('createBtn');
  const themePicker = document.getElementById('themePicker');
  const selectedTheme = document.getElementById('selectedTheme');

  // Global Nav & Auth Elements
  const navBrandBtn = document.getElementById('navBrandBtn');
  const openCalendarNavBtn = document.getElementById('openCalendarNavBtn');
  const openArchiveBtn = document.getElementById('openArchiveBtn');
  const archiveCountBadge = document.getElementById('archiveCountBadge');
  const kakaoLoginBtn = document.getElementById('kakaoLoginBtn');
  const userProfileNav = document.getElementById('userProfileNav');
  const userAvatarImg = document.getElementById('userAvatarImg');
  const userNicknameSpan = document.getElementById('userNicknameSpan');
  const kakaoLogoutBtn = document.getElementById('kakaoLogoutBtn');

  // Calendar Modal Elements
  const calendarModal = document.getElementById('calendarModal');
  const closeCalendarModalBtn = document.getElementById('closeCalendarModalBtn');
  const closeCalendarBottomBtn = document.getElementById('closeCalendarBottomBtn');
  const calPrevBtn = document.getElementById('calPrevBtn');
  const calNextBtn = document.getElementById('calNextBtn');
  const calMonthTitle = document.getElementById('calMonthTitle');
  const calTodayQuickBtn = document.getElementById('calTodayQuickBtn');
  const calendarDaysGrid = document.getElementById('calendarDaysGrid');
  const calSelectedDateLabel = document.getElementById('calSelectedDateLabel');
  const calSelectedCountBadge = document.getElementById('calSelectedCountBadge');
  const calSelectedEventsList = document.getElementById('calSelectedEventsList');

  // Archive Modal Elements
  const archiveModal = document.getElementById('archiveModal');
  const closeArchiveModalBtn = document.getElementById('closeArchiveModalBtn');
  const closeArchiveBottomBtn = document.getElementById('closeArchiveBottomBtn');
  const archiveCardsGrid = document.getElementById('archiveCardsGrid');
  const archiveEmptyState = document.getElementById('archiveEmptyState');
  const archiveCreateNewBtn = document.getElementById('archiveCreateNewBtn');
  const archiveUserStatusText = document.getElementById('archiveUserStatusText');

  // Action Dropdown Elements in Story Viewer
  const actionDropdownWrapper = document.getElementById('actionDropdownWrapper');
  const actionDropdownToggle = document.getElementById('actionDropdownToggle');
  const actionDropdownMenu = document.getElementById('actionDropdownMenu');
  const saveStoryCardBtn = document.getElementById('saveStoryCardBtn');
  const saveStoryCardTitle = document.getElementById('saveStoryCardTitle');

  // Story Pager Elements
  const storyProgress = document.getElementById('storyProgress');
  const storyPageWrapper = document.getElementById('storyPageWrapper');
  const prevStoryBtn = document.getElementById('prevStoryBtn');
  const nextStoryBtn = document.getElementById('nextStoryBtn');
  const pageIndicator = document.getElementById('pageIndicator');

  // Modal & Toast
  const shareModal = document.getElementById('shareModal');
  const shareUrlInput = document.getElementById('shareUrlInput');
  const copyBtn = document.getElementById('copyBtn');
  const shareKakaoBtn = document.getElementById('shareKakaoBtn');
  const previewBtn = document.getElementById('previewBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const makeNewBtn = document.getElementById('makeNewBtn');
  
  // Custom Dropdown Feedback Elements
  const feedbackBtn = document.getElementById('feedbackBtn');
  const feedbackModal = document.getElementById('feedbackModal');
  const customDropdown = document.getElementById('customDropdown');
  const dropdownSelected = document.getElementById('dropdownSelected');
  const selectedCourseText = document.getElementById('selectedCourseText');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const adjustCourseValue = document.getElementById('adjustCourseValue');
  const adjustMessage = document.getElementById('adjustMessage');
  const sendFeedbackKakaoBtn = document.getElementById('sendFeedbackKakaoBtn');
  const closeFeedbackModalBtn = document.getElementById('closeFeedbackModalBtn');

  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const acceptBtn = document.getElementById('acceptBtn');
  const acceptOverlay = document.getElementById('acceptOverlay');
  const acceptModalTitle = document.getElementById('acceptModalTitle');
  const acceptModalDesc = document.getElementById('acceptModalDesc');
  const closeAcceptBtn = document.getElementById('closeAcceptBtn');
  const downloadCardBtn = document.getElementById('downloadCardBtn');
  const downloadModalCardBtn = document.getElementById('downloadModalCardBtn');
  const sendAcceptKakaoBtn = document.getElementById('sendAcceptKakaoBtn');
  const creatorNoticeBanner = document.getElementById('creatorNoticeBanner');
  const acceptedStatusBanner = document.getElementById('acceptedStatusBanner');
  const creatorShareAgainBtn = document.getElementById('creatorShareAgainBtn');

  // Duplicate Notice Modal Elements
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

  // Image Lightbox Elements
  const imageLightboxModal = document.getElementById('imageLightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeLightboxBtn = document.getElementById('closeLightboxBtn');

  window.openImageZoom = function(src) {
    if (!imageLightboxModal || !lightboxImg) return;
    lightboxImg.src = src;
    imageLightboxModal.classList.remove('hidden');
  };

  if (closeLightboxBtn) {
    closeLightboxBtn.addEventListener('click', () => {
      if (imageLightboxModal) imageLightboxModal.classList.add('hidden');
    });
  }

  if (imageLightboxModal) {
    imageLightboxModal.addEventListener('click', (e) => {
      if (e.target === imageLightboxModal) {
        imageLightboxModal.classList.add('hidden');
      }
    });
  }

  let isCreatingCard = false;
  let generatedShareUrl = '';

  // Initialize Kakao SDK
  if (window.Kakao && !window.Kakao.isInitialized()) {
    try {
      window.Kakao.init(KAKAO_APP_KEY);
    } catch (e) {
      console.error('Kakao init error:', e);
    }
  }

  // ====================================================
  // UNIFIED CLIPBOARD & KAKAO SHARE HELPERS
  // ====================================================
  function copyToClipboard(text, successMsg = '링크가 복사되었습니다! 🌿') {
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

  function sendKakaoFeed({ title, description, imageUrl, webUrl, buttonTitle, fallbackText, toastMsg, isAuto = false }) {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      try {
        window.Kakao.init(KAKAO_APP_KEY);
      } catch (e) {}
    }

    let finalUrl = webUrl || window.location.href;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://gksxogksxo1001-sketch.github.io/Date/' + (finalUrl.includes('?') ? finalUrl.substring(finalUrl.indexOf('?')) : '');
    }

    if (window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: title,
            description: description,
            imageUrl: imageUrl || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop',
            link: {
              mobileWebUrl: finalUrl,
              webUrl: finalUrl
            }
          },
          buttons: [
            {
              title: buttonTitle || '초대장 확인하기 💖',
              link: {
                mobileWebUrl: finalUrl,
                webUrl: finalUrl
              }
            }
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

  // ====================================================
  // SUPABASE CLIENT CONFIGURATION
  // ====================================================
  const SUPABASE_URL = 'https://cmxcazjrasptkspomyyo.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_XSJgAV4bPOhoWbG6DO0M7w_Fibr9uer';

  let supabaseClient = null;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) {
      console.warn('Supabase initialization warning:', e);
    }
  }

  // ====================================================
  // AUTH SERVICE (KAKAO OAUTH & SUPABASE INTEGRATION)
  // ====================================================
  const AuthService = {
    currentUser: null,

    init() {
      this.loadSession();
      this.renderUI();
      this.checkAuthCode();
    },

    loadSession() {
      try {
        const saved = localStorage.getItem('dateplanner_user');
        if (saved) {
          this.currentUser = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Failed to load user session', e);
      }
    },

    saveSession(user) {
      this.currentUser = user;
      try {
        if (user) {
          localStorage.setItem('dateplanner_user', JSON.stringify(user));
        } else {
          localStorage.removeItem('dateplanner_user');
        }
      } catch (e) {
        console.warn('Failed to save session', e);
      }
      this.renderUI();
      ArchiveService.loadAndRender();
      if (user) {
        ArchiveService.syncCloud();
      }
    },

    login() {
      let redirectUri = 'https://gksxogksxo1001-sketch.github.io/Date/';
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        redirectUri = window.location.origin + window.location.pathname;
      }

      // Kakao OAuth 2.0 Direct Authorize URL with REST Key
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile_nickname,profile_image`;
      window.location.href = kakaoAuthUrl;
    },

    async checkAuthCode() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (!code) return;

      let redirectUri = 'https://gksxogksxo1001-sketch.github.io/Date/';
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        redirectUri = window.location.origin + window.location.pathname;
      }

      try {
        showToast('카카오 로그인 인증 중입니다... 🌿');
        const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: KAKAO_REST_KEY,
            redirect_uri: redirectUri,
            code: code
          })
        });

        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          if (window.Kakao && window.Kakao.Auth) {
            try {
              window.Kakao.Auth.setAccessToken(tokenData.access_token);
            } catch (e) {}
          }
          await this.fetchUserProfile(tokenData.access_token);
        } else {
          console.warn('Kakao token response error:', tokenData);
          showToast('카카오 인증 실패: ' + (tokenData.error_description || tokenData.error || ''), true);
        }
      } catch (e) {
        console.error('Kakao auth code exchange error:', e);
      } finally {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    },

    async fetchUserProfile(accessToken) {
      try {
        const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
          }
        });
        const res = await userRes.json();
        let profileImg = profile.profile_image_url || profile.thumbnail_image_url || 'assets/favicon.png';
        if (profileImg.startsWith('http://')) {
          profileImg = profileImg.replace('http://', 'https://');
        }
        const user = {
          id: 'kakao_' + res.id,
          nickname: profile.nickname || '카카오 회원',
          profileImage: profileImg,
          email: (res.kakao_account && res.kakao_account.email) || '',
          loginTime: Date.now()
        };
        this.saveSession(user);
        showToast(`💖 ${user.nickname}님, 환영합니다!`);
      } catch (error) {
        console.error('Kakao profile request error:', error);
        showToast('카카오 프로필 정보를 가져오지 못했습니다.', true);
      }
    },

    logout() {
      if (window.Kakao && window.Kakao.Auth && window.Kakao.Auth.getAccessToken()) {
        window.Kakao.Auth.logout(() => {
          console.log('Kakao SDK logged out');
        });
      }
      this.saveSession(null);
      showToast('로그아웃 되었습니다.');
    },

    renderUI() {
      if (this.currentUser) {
        if (kakaoLoginBtn) kakaoLoginBtn.classList.add('hidden');
        if (userProfileNav) userProfileNav.classList.remove('hidden');
        if (userAvatarImg) userAvatarImg.src = this.currentUser.profileImage || 'assets/favicon.png';
        if (userNicknameSpan) userNicknameSpan.textContent = this.currentUser.nickname;
        if (archiveUserStatusText) archiveUserStatusText.innerHTML = `<span class="badge-online">●</span> <strong>${this.currentUser.nickname}</strong>님의 Supabase 클라우드에 안전하게 보관 중입니다.`;
        if (openCalendarNavBtn) openCalendarNavBtn.classList.remove('hidden');
      } else {
        if (kakaoLoginBtn) kakaoLoginBtn.classList.remove('hidden');
        if (userProfileNav) userProfileNav.classList.add('hidden');
        if (archiveUserStatusText) archiveUserStatusText.textContent = '💡 카카오 로그인 시 Supabase 클라우드에 안전하게 영구 보관됩니다.';
        if (openCalendarNavBtn) openCalendarNavBtn.classList.add('hidden');
        if (calendarModal) calendarModal.classList.add('hidden');
      }
    }
  };

  // ====================================================
  // ARCHIVE SERVICE (MY DATE CARDS STORAGE + SUPABASE SYNC)
  // ====================================================
  const ArchiveService = {
    STORAGE_KEY: 'dateplanner_archives',

    getAll() {
      try {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        console.warn('Archive load error:', e);
        return [];
      }
    },

    findDuplicate({ senderName, receiverName, date, area, courses }) {
      const list = this.getAll();
      const normalize = (str) => (str || '').trim().toLowerCase();
      const s = normalize(senderName);
      const r = normalize(receiverName);
      const d = (date || '').trim();
      const a = normalize(area);

      return list.find(item => {
        const matchBasic = normalize(item.senderName) === s &&
                           normalize(item.receiverName) === r &&
                           (item.date || '').trim() === d &&
                           normalize(item.area) === a;
        if (!matchBasic) return false;

        if (courses && courses.length > 0 && item.courses && item.courses.length > 0) {
          const itemCoursesSig = item.courses.map(c => normalize(c.n)).join('|');
          const newCoursesSig = courses.map(c => normalize(c.n)).join('|');
          return itemCoursesSig === newCoursesSig || matchBasic;
        }
        return true;
      }) || null;
    },

    cleanupDuplicates() {
      try {
        const list = this.getAll();
        if (!Array.isArray(list) || list.length <= 1) return;

        const seenKeys = new Set();
        const uniqueList = [];

        for (const item of list) {
          const courseSig = (item.courses || []).map(c => (c.n || '').trim()).join(',');
          const key = `${(item.senderName || '').trim()}_${(item.receiverName || '').trim()}_${(item.date || '').trim()}_${(item.area || '').trim()}_${courseSig}`;

          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueList.push(item);
          }
        }

        if (uniqueList.length !== list.length) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(uniqueList));
          this.updateCountBadge();
        }
      } catch (e) {
        console.warn('Archive cleanup notice:', e);
      }
    },

    async save(cardPayload, shareUrl) {
      const list = this.getAll();
      let existingIndex = list.findIndex(item => item.id === cardPayload.id);

      // 동일한 일정(보낸이, 받는이, 날짜, 지역, 코스)의 카드가 이미 존재하면 갱신하여 중복 누적 방지
      if (existingIndex < 0) {
        const normalize = (str) => (str || '').trim().toLowerCase();
        const s = normalize(cardPayload.s);
        const r = normalize(cardPayload.r);
        const d = (cardPayload.d || '').trim();
        const a = normalize(cardPayload.a);
        const newCoursesSig = (cardPayload.c || []).map(c => normalize(c.n)).join('|');

        existingIndex = list.findIndex(item => {
          const basicMatch = normalize(item.senderName) === s &&
                             normalize(item.receiverName) === r &&
                             (item.date || '').trim() === d &&
                             normalize(item.area) === a;
          if (!basicMatch) return false;
          if (newCoursesSig && item.courses && item.courses.length > 0) {
            const itemSig = item.courses.map(c => normalize(c.n)).join('|');
            return itemSig === newCoursesSig || basicMatch;
          }
          return basicMatch;
        });
      }

      const existingItem = existingIndex >= 0 ? list[existingIndex] : null;
      const archiveItem = {
        id: (existingItem && existingItem.id) || cardPayload.id || ('card_' + Date.now()),
        senderName: cardPayload.s,
        receiverName: cardPayload.r,
        date: cardPayload.d,
        area: cardPayload.a,
        budget: cardPayload.b,
        message: cardPayload.m,
        theme: cardPayload.tm,
        courses: cardPayload.c || [],
        shareUrl: shareUrl || (existingItem && existingItem.shareUrl),
        createdAt: existingItem ? existingItem.createdAt : Date.now(),
        userId: AuthService.currentUser ? AuthService.currentUser.id : 'guest',
        isAccepted: existingItem ? existingItem.isAccepted : false,
        acceptedAt: existingItem ? existingItem.acceptedAt : null
      };

      if (existingIndex >= 0) {
        list[existingIndex] = archiveItem;
      } else {
        list.unshift(archiveItem);
      }

      if (list.length > 50) list.length = 50;

      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('Archive save error:', e);
      }

      this.updateCountBadge();

      // Cloud Sync to Supabase
      if (supabaseClient) {
        try {
          const validUserId = (AuthService.currentUser && AuthService.currentUser.id && !AuthService.currentUser.id.startsWith('creator_') && !AuthService.currentUser.id.startsWith('guest')) ? AuthService.currentUser.id : null;
          const dbRow = {
            id: archiveItem.id,
            user_id: validUserId,
            sender_name: archiveItem.senderName,
            receiver_name: archiveItem.receiverName,
            date_val: archiveItem.date,
            area: archiveItem.area,
            budget: archiveItem.budget,
            message: archiveItem.message,
            theme: archiveItem.theme,
            courses: archiveItem.courses,
            share_url: archiveItem.shareUrl,
            created_at: new Date(archiveItem.createdAt).toISOString()
          };
          const { error } = await supabaseClient.from('date_cards').upsert(dbRow);
          if (error) console.warn('Supabase save notice:', error.message);
          else console.log('Card successfully synced to Supabase Cloud DB');
        } catch (err) {
          console.warn('Supabase upsert error:', err);
        }
      }
    },

    async syncCloud() {
      if (!supabaseClient || !AuthService.currentUser) return;
      try {
        const { data, error } = await supabaseClient
          .from('date_cards')
          .select('*')
          .eq('user_id', AuthService.currentUser.id)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const cloudCards = data.map(row => ({
            id: row.id,
            senderName: row.sender_name,
            receiverName: row.receiver_name,
            date: row.date_val,
            area: row.area,
            budget: row.budget,
            message: row.message,
            theme: row.theme,
            courses: row.courses || [],
            shareUrl: row.share_url,
            createdAt: new Date(row.created_at).getTime(),
            userId: row.user_id
          }));

          const localList = this.getAll();
          const mergedMap = new Map();
          cloudCards.forEach(c => mergedMap.set(c.id, c));
          localList.forEach(c => {
            if (!mergedMap.has(c.id)) mergedMap.set(c.id, c);
          });

          const mergedList = Array.from(mergedMap.values());
          mergedList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mergedList));
          this.loadAndRender();
        }
      } catch (e) {
        console.warn('Supabase cloud sync error:', e);
      }
    },

    async delete(cardId) {
      let list = this.getAll();
      list = list.filter(item => item.id !== cardId);
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        localStorage.removeItem(cardId);
      } catch (e) {
        console.warn('Archive delete error:', e);
      }
      this.loadAndRender();

      // Cloud delete from Supabase
      if (supabaseClient) {
        try {
          await supabaseClient.from('date_cards').delete().eq('id', cardId);
        } catch (e) {
          console.warn('Supabase delete error:', e);
        }
      }

      showToast('초대장이 보관함에서 삭제되었습니다.');
    },

    async markCardAccepted(cardId) {
      if (!cardId) return;
      const list = this.getAll();
      const target = list.find(item => item.id === cardId);
      if (target) {
        target.isAccepted = true;
        target.acceptedAt = Date.now();
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        } catch (e) {}
      }

      if (supabaseClient) {
        try {
          await supabaseClient
            .from('date_cards')
            .update({ is_accepted: true, accepted_at: new Date().toISOString() })
            .eq('id', cardId);
        } catch (e) {
          console.warn('Supabase markCardAccepted notice:', e);
        }
      }
    },

    updateCountBadge() {
      if (!archiveCountBadge) return;
      const list = this.getAll();
      if (list.length > 0) {
        archiveCountBadge.textContent = list.length;
        archiveCountBadge.classList.remove('hidden');
      } else {
        archiveCountBadge.classList.add('hidden');
      }
    },

    loadAndRender() {
      this.cleanupDuplicates();
      this.updateCountBadge();
      if (!archiveCardsGrid || !archiveEmptyState) return;

      const list = this.getAll();
      if (list.length === 0) {
        archiveCardsGrid.innerHTML = '';
        archiveEmptyState.classList.remove('hidden');
        return;
      }

      archiveEmptyState.classList.add('hidden');
      archiveCardsGrid.innerHTML = '';

      list.forEach(item => {
        const cardEl = document.createElement('div');
        cardEl.className = `archive-card-item theme-${item.theme || 'cozy'} ${item.isAccepted ? 'is-accepted' : ''}`;

        const courseSummary = (item.courses || []).map((c, i) => `${i + 1}차: ${c.n}`).join(' ➔ ') || '코스 정보 없음';
        const createdDateStr = new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const targetDateStr = formatDateString(item.date);
        const themeLabel = item.theme === 'rose' ? '🌹 Romantic Rose' : (item.theme === 'midnight' ? '🌙 Midnight Navy' : '🌿 Warm Cozy');
        const acceptBadge = item.isAccepted ? `<div class="archive-status-badge accepted"><i class="fa-solid fa-heart"></i> 상대방 수락 완료!</div>` : '';

        cardEl.innerHTML = `
          <div class="archive-card-header">
            <div style="display:flex; align-items:center; gap:6px;">
              <div class="archive-theme-pill">${themeLabel}</div>
              ${acceptBadge}
            </div>
            <span class="archive-date-tag">${createdDateStr} 생성</span>
          </div>
          <div class="archive-card-body">
            <h4 class="archive-card-title">To. <strong>${item.receiverName}</strong> <span style="font-weight:400; font-size:0.88rem; color:var(--text-muted);">(From. ${item.senderName})</span></h4>
            <div class="archive-meta">
              <span><i class="fa-regular fa-calendar-check"></i> ${targetDateStr}</span>
              <span><i class="fa-solid fa-location-dot"></i> ${item.area}</span>
              <span><i class="fa-solid fa-wallet"></i> ${item.budget}</span>
            </div>
            <div class="archive-courses-preview">
              <i class="fa-solid fa-route"></i> <span>${courseSummary}</span>
            </div>
          </div>
          <div class="archive-card-actions">
            <button type="button" class="btn-archive-action btn-view" title="스토리 초대장 열기" onclick="window.viewArchiveCard('${item.shareUrl}')">
              <i class="fa-solid fa-eye"></i> 열기
            </button>
            <button type="button" class="btn-archive-action btn-copy" title="공유 링크 복사" onclick="window.copyArchiveLink('${item.shareUrl}')">
              <i class="fa-solid fa-link"></i> 링크복사
            </button>
            <button type="button" class="btn-archive-action btn-kakao" title="카카오톡 재전송" onclick="window.shareArchiveKakao('${item.id}')">
              <i class="fa-solid fa-comment"></i> 카톡
            </button>
            <button type="button" class="btn-archive-action btn-delete" title="초대장 삭제" onclick="window.deleteArchiveItem('${item.id}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `;
        archiveCardsGrid.appendChild(cardEl);
      });
    }
  };

  // Global Actions for Archive Cards
  window.viewArchiveCard = function(shareUrl) {
    if (archiveModal) archiveModal.classList.add('hidden');
    openCardFromShareUrl(shareUrl);
  };

  window.copyArchiveLink = function(shareUrl) {
    copyToClipboard(shareUrl, '초대장 링크가 복사되었습니다! 🌿');
  };

  window.shareArchiveKakao = function(cardId) {
    const item = ArchiveService.getAll().find(c => c.id === cardId);
    if (!item) return;

    sendKakaoFeed({
      title: `💌 ${item.senderName}님이 보낸 감성 데이트 초대장 💖`,
      description: `${item.receiverName}야! ${formatDateString(item.date)}에 ${item.area}에서 만나자! 🌿`,
      imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop',
      webUrl: item.shareUrl,
      buttonTitle: '스토리 초대장 확인하기 💖',
      fallbackText: `[DateCard 초대장 💌]\n${item.senderName}님이 보낸 데이트 초대장:\n${item.shareUrl}`,
      toastMsg: '카카오톡 공유창이 열렸습니다! 💬'
    });
  };

  window.deleteArchiveItem = function(cardId) {
    if (confirm('이 데이트 초대장을 보관함에서 삭제하시겠습니까?')) {
      ArchiveService.delete(cardId);
      if (CalendarService) CalendarService.render();
    }
  };

  // ====================================================
  // DATE CALENDAR SERVICE (±2 MONTHS, DYNAMIC, STORY LINK)
  // ====================================================
  const CalendarService = {
    baseYear: new Date().getFullYear(),
    baseMonth: new Date().getMonth(), // 0 ~ 11
    viewYear: new Date().getFullYear(),
    viewMonth: new Date().getMonth(),
    selectedDateKey: null, // 'YYYY-MM-DD'

    init() {
      if (calPrevBtn) {
        calPrevBtn.addEventListener('click', () => this.changeMonth(-1));
      }
      if (calNextBtn) {
        calNextBtn.addEventListener('click', () => this.changeMonth(1));
      }
      if (calTodayQuickBtn) {
        calTodayQuickBtn.addEventListener('click', () => this.goToToday());
      }
      if (openCalendarNavBtn) {
        openCalendarNavBtn.addEventListener('click', () => this.open());
      }
      if (closeCalendarModalBtn) {
        closeCalendarModalBtn.addEventListener('click', () => this.close());
      }
      if (closeCalendarBottomBtn) {
        closeCalendarBottomBtn.addEventListener('click', () => this.close());
      }
      this.bindSwipeDrag();
    },

    bindSwipeDrag() {
      const board = document.querySelector('.calendar-board');
      if (!board) return;

      let isDown = false;
      let startX = 0;
      let diffX = 0;

      // Mouse drag handlers
      board.addEventListener('mousedown', (e) => {
        if (e.target.closest('.cal-event-chip') || e.target.closest('.cal-detail-card')) return;
        isDown = true;
        startX = e.pageX;
        diffX = 0;
        board.classList.add('is-dragging');
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        diffX = e.pageX - startX;
        if (calendarDaysGrid && Math.abs(diffX) > 5) {
          calendarDaysGrid.style.transform = `translateX(${diffX * 0.35}px)`;
        }
      });

      window.addEventListener('mouseup', () => {
        if (!isDown) return;
        isDown = false;
        board.classList.remove('is-dragging');
        if (calendarDaysGrid) {
          calendarDaysGrid.style.transform = '';
        }
        if (diffX > 55) {
          this.changeMonth(-1); // 오른쪽으로 드래그 -> 이전 달
        } else if (diffX < -55) {
          this.changeMonth(1); // 왼쪽으로 드래그 -> 다음 달
        }
        diffX = 0;
      });

      // Mobile Touch swipe handlers
      let touchStartX = 0;
      let touchDiffX = 0;
      board.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].pageX;
          touchDiffX = 0;
        }
      }, { passive: true });

      board.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
          touchDiffX = e.touches[0].pageX - touchStartX;
          if (calendarDaysGrid && Math.abs(touchDiffX) > 10) {
            calendarDaysGrid.style.transform = `translateX(${touchDiffX * 0.35}px)`;
          }
        }
      }, { passive: true });

      board.addEventListener('touchend', () => {
        if (calendarDaysGrid) {
          calendarDaysGrid.style.transform = '';
        }
        if (touchDiffX > 50) {
          this.changeMonth(-1); // 우측 스와이프 -> 이전 달
        } else if (touchDiffX < -50) {
          this.changeMonth(1); // 좌측 스와이프 -> 다음 달
        }
        touchDiffX = 0;
      });
    },

    goToToday() {
      const today = new Date();
      this.viewYear = today.getFullYear();
      this.viewMonth = today.getMonth();
      this.selectedDateKey = this.formatDateKey(today);
      this.render();
      showToast('오늘 날짜로 이동했습니다! 🎯');
    },

    open() {
      // 캘린더 열 때 오늘 기준으로 뷰 초기화
      const today = new Date();
      this.baseYear = today.getFullYear();
      this.baseMonth = today.getMonth();
      this.viewYear = this.baseYear;
      this.viewMonth = this.baseMonth;
      
      const todayKey = this.formatDateKey(today);
      this.selectedDateKey = todayKey;

      if (calendarModal) calendarModal.classList.remove('hidden');
      this.render();
    },

    close() {
      if (calendarModal) calendarModal.classList.add('hidden');
    },

    getMonthOffset(y, m) {
      return (y - this.baseYear) * 12 + (m - this.baseMonth);
    },

    changeMonth(delta) {
      let nextM = this.viewMonth + delta;
      let nextY = this.viewYear;
      if (nextM < 0) {
        nextM = 11;
        nextY--;
      } else if (nextM > 11) {
        nextM = 0;
        nextY++;
      }

      const offset = this.getMonthOffset(nextY, nextM);
      if (offset < -2 || offset > 2) return; // 최대 ±2개월 제한

      this.viewYear = nextY;
      this.viewMonth = nextM;
      this.render();
    },

    formatDateKey(dateObj) {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },

    parseDateKey(dateStr) {
      if (!dateStr) return null;
      // 2026-09-09 or 2026년 9월 9일 등
      const m = dateStr.match(/(\d{4})[^\d]+(\d{1,2})[^\d]+(\d{1,2})/);
      if (m) {
        const y = m[1];
        const month = String(parseInt(m[2], 10)).padStart(2, '0');
        const day = String(parseInt(m[3], 10)).padStart(2, '0');
        return `${y}-${month}-${day}`;
      }
      return null;
    },

    getEventsMap() {
      const allArchives = ArchiveService.getAll();
      const eventsMap = new Map(); // key: 'YYYY-MM-DD', value: Array of items

      const currentUid = AuthService.currentUser ? AuthService.currentUser.id : '';
      const currentNickname = AuthService.currentUser ? (AuthService.currentUser.nickname || '').trim().toLowerCase() : '';

      allArchives.forEach(item => {
        const dateKey = this.parseDateKey(item.date);
        if (!dateKey) return;

        // 판별: 내가 보낸 카드 vs 내가 받은 카드
        const sName = (item.senderName || '').trim().toLowerCase();
        const rName = (item.receiverName || '').trim().toLowerCase();
        
        let isSentByMe = false;
        if (item.userId && currentUid && item.userId === currentUid) {
          isSentByMe = true;
        } else if (currentNickname && sName === currentNickname) {
          isSentByMe = true;
        } else if (!item.userId || item.userId === 'guest') {
          isSentByMe = true;
        }

        const eventItem = {
          raw: item,
          dateKey,
          isSentByMe,
          partnerName: isSentByMe ? item.receiverName : item.senderName,
          title: isSentByMe ? `To. ${item.receiverName} 데이트` : `From. ${item.senderName} 데이트`,
          area: item.area || '지역 미정',
          time: (item.courses && item.courses[0] && item.courses[0].t) || '시간 미정',
          coursesSummary: (item.courses || []).map((c, i) => `${i+1}차: ${c.n}`).join(' ➔ ') || '코스 정보',
          shareUrl: item.shareUrl
        };

        if (!eventsMap.has(dateKey)) {
          eventsMap.set(dateKey, []);
        }
        eventsMap.get(dateKey).push(eventItem);
      });

      return eventsMap;
    },

    render() {
      if (!calendarDaysGrid || !calMonthTitle) return;

      // 1. 헤더 연월 타이틀 및 네비 버튼 활성/비활성 제어 (±2개월)
      calMonthTitle.textContent = `${this.viewYear}년 ${this.viewMonth + 1}월`;
      
      const currentOffset = this.getMonthOffset(this.viewYear, this.viewMonth);
      if (calPrevBtn) calPrevBtn.disabled = currentOffset <= -2;
      if (calNextBtn) calNextBtn.disabled = currentOffset >= 2;

      // 2. 이벤트 맵 로드
      const eventsMap = this.getEventsMap();

      // 3. 오늘 날짜 키
      const today = new Date();
      const todayKey = this.formatDateKey(today);

      calendarDaysGrid.innerHTML = '';

      const firstDayOfWeek = new Date(this.viewYear, this.viewMonth, 1).getDay(); // 0(일) ~ 6(토)
      const totalDaysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
      const prevMonthLastDate = new Date(this.viewYear, this.viewMonth, 0).getDate();

      // 이전 달 빈 칸 채우기
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const d = prevMonthLastDate - i;
        const cell = document.createElement('div');
        cell.className = 'cal-day-box other-month';
        cell.innerHTML = `
          <div class="cal-day-top-row">
            <span class="cal-day-num">${d}</span>
          </div>`;
        calendarDaysGrid.appendChild(cell);
      }

      // 이번 달 날짜 채우기
      for (let day = 1; day <= totalDaysInMonth; day++) {
        const cell = document.createElement('div');
        const dayOfWeek = new Date(this.viewYear, this.viewMonth, day).getDay();
        const dStr = String(day).padStart(2, '0');
        const mStr = String(this.viewMonth + 1).padStart(2, '0');
        const dateKey = `${this.viewYear}-${mStr}-${dStr}`;
        const isToday = (dateKey === todayKey);

        let classNames = ['cal-day-box'];
        if (dayOfWeek === 0) classNames.push('sun');
        if (dayOfWeek === 6) classNames.push('sat');
        if (isToday) classNames.push('is-today');
        if (dateKey === this.selectedDateKey) classNames.push('is-selected');

        cell.className = classNames.join(' ');
        cell.setAttribute('data-date', dateKey);

        let chipsHtml = '';
        const dayEvents = eventsMap.get(dateKey) || [];
        if (dayEvents.length > 0) {
          chipsHtml = `<div class="cal-events-container">`;
          dayEvents.slice(0, 2).forEach(ev => {
            if (ev.isSentByMe) {
              chipsHtml += `
                <div class="cal-event-chip chip-sent" title="내가 보낸 데이트 (To. ${ev.partnerName})">
                  <span class="chip-tag">[보냄]</span> ${ev.partnerName} 💌
                </div>`;
            } else {
              chipsHtml += `
                <div class="cal-event-chip chip-received" title="내가 받은 초대 (From. ${ev.partnerName})">
                  <span class="chip-tag">[초대]</span> ${ev.partnerName} 🎁
                </div>`;
            }
          });
          if (dayEvents.length > 2) {
            chipsHtml += `<div class="cal-more-events" style="font-size:0.65rem; color:var(--text-muted); font-weight:700;">+${dayEvents.length - 2}개 더</div>`;
          }
          chipsHtml += `</div>`;
        }

        cell.innerHTML = `
          <div class="cal-day-top-row">
            <span class="cal-day-num">${day}</span>
            ${isToday ? '<span class="cal-today-tag">오늘</span>' : ''}
          </div>
          ${chipsHtml}
        `;

        cell.addEventListener('click', () => {
          this.selectedDateKey = dateKey;
          document.querySelectorAll('.cal-day-box').forEach(c => c.classList.remove('is-selected'));
          cell.classList.add('is-selected');
          this.renderSelectedDetails(dateKey, dayEvents);
        });

        calendarDaysGrid.appendChild(cell);
      }

      // 다음 달 잔여 빈 칸 채우기 (행 완성)
      const renderedTotal = firstDayOfWeek + totalDaysInMonth;
      const remaining = (7 - (renderedTotal % 7)) % 7;
      for (let day = 1; day <= remaining; day++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day-box other-month';
        cell.innerHTML = `
          <div class="cal-day-top-row">
            <span class="cal-day-num">${day}</span>
          </div>`;
        calendarDaysGrid.appendChild(cell);
      }

      // 선택된 날짜 상세 뷰 갱신
      const initialEvents = eventsMap.get(this.selectedDateKey) || [];
      this.renderSelectedDetails(this.selectedDateKey || todayKey, initialEvents);
    },

    renderSelectedDetails(dateKey, events = []) {
      if (!calSelectedDateLabel || !calSelectedEventsList || !calSelectedCountBadge) return;

      const dateParts = dateKey.split('-');
      const y = dateParts[0];
      const m = parseInt(dateParts[1], 10);
      const d = parseInt(dateParts[2], 10);
      const dObj = new Date(y, m - 1, d);
      const KOR_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
      const dow = KOR_DAYS[dObj.getDay()];

      calSelectedDateLabel.textContent = `${y}년 ${m}월 ${d}일 (${dow}) 데이트 일정`;
      calSelectedCountBadge.textContent = `${events.length}개`;

      if (events.length === 0) {
        calSelectedEventsList.innerHTML = `<div class="cal-no-events">이 날짜에 등록된 데이트 일정이 없습니다 🌿</div>`;
        return;
      }

      calSelectedEventsList.innerHTML = '';
      events.forEach(ev => {
        const card = document.createElement('div');
        const typeClass = ev.isSentByMe ? 'type-sent' : 'type-received';
        const typeBadgeText = ev.isSentByMe ? '💌 내가 보낸 데이트 약속' : '🎁 내가 초대받은 데이트 약속';
        const partnerDesc = ev.isSentByMe ? `To. <strong>${ev.partnerName}</strong>` : `From. <strong>${ev.partnerName}</strong>`;

        card.className = `cal-detail-card ${typeClass}`;
        card.innerHTML = `
          <div class="cal-detail-main">
            <div class="cal-detail-badge-row">
              <span class="cal-detail-type-badge">${typeBadgeText}</span>
              <span style="font-size:0.84rem; color:var(--text-muted);">${partnerDesc}</span>
            </div>
            <div class="cal-detail-title">${ev.title}</div>
            <div class="cal-detail-meta">
              <span><i class="fa-regular fa-clock"></i> ${ev.time}</span>
              <span><i class="fa-solid fa-location-dot"></i> ${ev.area}</span>
              <span><i class="fa-solid fa-route"></i> ${ev.coursesSummary}</span>
            </div>
          </div>
          <div class="cal-detail-action">
            <span>스토리 열기</span> <i class="fa-solid fa-arrow-right"></i>
          </div>
        `;

        card.addEventListener('click', () => {
          CalendarService.close();
          openCardFromShareUrl(ev.shareUrl);
        });

        calSelectedEventsList.appendChild(card);
      });
    }
  };

  // Nav & Auth Event Handlers
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

  // Initialize Calendar Service
  CalendarService.init();

  // Action Dropdown Toggle & Auto Close Handlers
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

  // Save Story Card to Calendar & Archive Handler
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

      if (CalendarService) {
        CalendarService.render();
      }
    });
  }

  if (archiveCreateNewBtn) {
    archiveCreateNewBtn.addEventListener('click', () => {
      if (archiveModal) archiveModal.classList.add('hidden');
      switchToCreateMode();
    });
  }

  // Initialize Auth & Archive
  AuthService.init();
  ArchiveService.updateCountBadge();

  // ========== LANDING PAGE CTA HANDLERS ==========
  function switchToCreateMode() {
    landingMode.classList.add('hidden');
    appHeader.classList.remove('hidden');
    createMode.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const heroCTA = document.getElementById('heroCTA');
  const bottomCTA = document.getElementById('bottomCTA');
  if (heroCTA) heroCTA.addEventListener('click', switchToCreateMode);
  if (bottomCTA) bottomCTA.addEventListener('click', switchToCreateMode);

  // ====================================================
  // 1. PREMIUM CUSTOM CALENDAR PICKER
  // ====================================================
  let calCurrentYear = new Date().getFullYear();
  let calCurrentMonth = new Date().getMonth(); // 0 ~ 11
  let calSelectedDate = null;

  function initCustomCalendar() {
    const trigger = document.getElementById('datepickerTrigger');
    const popup = document.getElementById('customCalendarPopup');
    const dateDisplay = document.getElementById('dateDisplay');
    const hiddenDate = document.getElementById('date');
    const prevBtn = document.getElementById('calPrevMonthBtn');
    const nextBtn = document.getElementById('calNextMonthBtn');
    const monthText = document.getElementById('calMonthText');
    const daysGrid = document.getElementById('calDaysGrid');
    const quickToday = document.getElementById('calQuickToday');
    const quickTomorrow = document.getElementById('calQuickTomorrow');
    const quickWeekend = document.getElementById('calQuickWeekend');
    const wrapper = document.getElementById('customDatePickerWrapper');

    if (!trigger || !popup || !hiddenDate) return;

    function toDateString(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    const KOR_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
    function toDisplayString(d) {
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const dow = KOR_DAYS[d.getDay()];
      return `${y}년 ${m}월 ${day}일 (${dow}) 💖`;
    }

    window.setSelectedCalendarDate = function(dateObj) {
      calSelectedDate = new Date(dateObj);
      calCurrentYear = calSelectedDate.getFullYear();
      calCurrentMonth = calSelectedDate.getMonth();
      
      hiddenDate.value = toDateString(calSelectedDate);
      if (dateDisplay) {
        dateDisplay.value = toDisplayString(calSelectedDate);
      }
      renderCalendarDays();
    };

    function renderCalendarDays() {
      if (!monthText || !daysGrid) return;
      monthText.textContent = `${calCurrentYear}년 ${calCurrentMonth + 1}월`;
      daysGrid.innerHTML = '';

      const firstDayIndex = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
      const totalDaysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();
      const prevMonthDays = new Date(calCurrentYear, calCurrentMonth, 0).getDate();

      const today = new Date();
      const todayStr = toDateString(today);
      const selectedStr = calSelectedDate ? toDateString(calSelectedDate) : '';

      // Previous Month buffer days
      for (let i = firstDayIndex - 1; i >= 0; i--) {
        const cell = document.createElement('div');
        cell.className = 'cal-day-cell other-month';
        cell.textContent = prevMonthDays - i;
        daysGrid.appendChild(cell);
      }

      // Current Month days
      for (let day = 1; day <= totalDaysInMonth; day++) {
        const cellDate = new Date(calCurrentYear, calCurrentMonth, day);
        const cellDateStr = toDateString(cellDate);
        const dow = cellDate.getDay();

        const cell = document.createElement('div');
        cell.className = 'cal-day-cell';
        cell.textContent = day;

        if (dow === 0) cell.classList.add('is-sun');
        if (dow === 6) cell.classList.add('is-sat');
        if (cellDateStr === todayStr) cell.classList.add('is-today');
        if (cellDateStr === selectedStr) cell.classList.add('is-selected');

        cell.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedCalendarDate(cellDate);
          closeCalendar();
        });

        daysGrid.appendChild(cell);
      }

      // Next Month buffer days to complete grid rows
      const totalRendered = firstDayIndex + totalDaysInMonth;
      const remaining = (7 - (totalRendered % 7)) % 7;
      for (let day = 1; day <= remaining; day++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day-cell other-month';
        cell.textContent = day;
        daysGrid.appendChild(cell);
      }
    }

    function openCalendar() {
      // Close open timepickers
      document.querySelectorAll('.custom-timepicker-popup').forEach(p => p.classList.add('hidden'));
      document.querySelectorAll('.timepicker-input-box').forEach(b => b.classList.remove('open'));

      if (calSelectedDate) {
        calCurrentYear = calSelectedDate.getFullYear();
        calCurrentMonth = calSelectedDate.getMonth();
      }
      popup.classList.remove('hidden');
      trigger.classList.add('open');
      renderCalendarDays();
    }

    function closeCalendar() {
      popup.classList.add('hidden');
      trigger.classList.remove('open');
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (popup.classList.contains('hidden')) {
        openCalendar();
      } else {
        closeCalendar();
      }
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        calCurrentMonth--;
        if (calCurrentMonth < 0) {
          calCurrentMonth = 11;
          calCurrentYear--;
        }
        renderCalendarDays();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        calCurrentMonth++;
        if (calCurrentMonth > 11) {
          calCurrentMonth = 0;
          calCurrentYear++;
        }
        renderCalendarDays();
      });
    }

    if (quickToday) {
      quickToday.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedCalendarDate(new Date());
        closeCalendar();
      });
    }

    if (quickTomorrow) {
      quickTomorrow.addEventListener('click', (e) => {
        e.stopPropagation();
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        setSelectedCalendarDate(tom);
        closeCalendar();
      });
    }

    if (quickWeekend) {
      quickWeekend.addEventListener('click', (e) => {
        e.stopPropagation();
        const d = new Date();
        const diff = (6 - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + diff);
        setSelectedCalendarDate(d);
        closeCalendar();
      });
    }

    document.addEventListener('click', (e) => {
      if (wrapper && !wrapper.contains(e.target)) {
        closeCalendar();
      }
      if (!e.target.closest('.custom-timepicker-wrapper')) {
        document.querySelectorAll('.custom-timepicker-popup').forEach(p => p.classList.add('hidden'));
        document.querySelectorAll('.timepicker-input-box').forEach(b => b.classList.remove('open'));
      }
    });

    // Default to tomorrow
    const defTomorrow = new Date();
    defTomorrow.setDate(defTomorrow.getDate() + 1);
    setSelectedCalendarDate(defTomorrow);
  }

  // Initialize Custom Calendar
  initCustomCalendar();

  // Feedback Modal Dropdown Toggle Handler
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

  // 2. Theme Picker Handler
  themePicker.addEventListener('click', (e) => {
    const card = e.target.closest('.theme-card');
    if (!card) return;

    document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    const themeVal = card.getAttribute('data-theme');
    selectedTheme.value = themeVal;
    appBody.className = `theme-${themeVal}`;
  });

  // ====================================================
  // 3. COURSE TYPE DEFINITIONS & CUSTOM DROPDOWN COMPONENT
  // ====================================================
  const COURSE_TYPE_OPTIONS = [
    { value: '🍽️ 맛집/식사', label: '🍽️ 맛있는 식사 · 다이닝' },
    { value: '☕ 카페/디저트', label: '☕ 감성 카페 & 디저트' },
    { value: '🎨 전시/놀거리/문화', label: '🎨 전시회 · 문화 & 놀거리' },
    { value: '✨ 산책/야경', label: '🌙 로맨틱 야경 & 산책' },
    { value: '🍷 술집/와인바', label: '🍷 와인바 · 칵테일 & 펍' },
    { value: '🎡 액티비티/체험', label: '🎡 이색 체험 & 액티비티' },
    { value: '📍 기타 장소', label: '📍 나만의 특별한 장소' }
  ];

  function getMatchedCourseOption(val) {
    if (!val) return COURSE_TYPE_OPTIONS[0];
    const found = COURSE_TYPE_OPTIONS.find(opt => 
      opt.value === val || 
      opt.label === val || 
      (val.includes('맛집') && opt.value.includes('맛집')) || 
      (val.includes('카페') && opt.value.includes('카페')) || 
      (val.includes('놀거리') && opt.value.includes('놀거리')) || 
      (val.includes('전시') && opt.value.includes('전시')) || 
      (val.includes('문화') && opt.value.includes('전시')) || 
      (val.includes('산책') && opt.value.includes('산책')) || 
      (val.includes('야경') && opt.value.includes('산책')) || 
      (val.includes('술집') && opt.value.includes('술집')) || 
      (val.includes('와인') && opt.value.includes('술집')) || 
      (val.includes('액티비티') && opt.value.includes('액티비티'))
    );
    return found || COURSE_TYPE_OPTIONS[0];
  }

  // Global click to close any open course dropdowns
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.course-type-dropdown').forEach(dd => {
      if (!dd.contains(e.target)) {
        dd.classList.remove('open');
        const menu = dd.querySelector('.custom-dropdown-menu');
        if (menu) menu.classList.add('hidden');
      }
    });
  });

  // INITIAL CLEAN EMPTY COURSE
  addCourseItem('🍽️ 맛집/식사', '18:00', '', '', '', '', []);

  // Add Course Logic
  addCourseBtn.addEventListener('click', () => {
    addCourseItem();
  });

  function addCourseItem(
    typeVal = '🍽️ 맛집/식사', timeVal = '18:00', nameVal = '', urlVal = '', moveVal = '', tipVal = '',
    photosVal = []
  ) {
    const items = courseList.querySelectorAll('.course-item-card');
    const index = items.length;
    coursePhotosMap[index] = [...photosVal];

    const matchedOption = getMatchedCourseOption(typeVal);

    const card = document.createElement('div');
    card.className = 'course-item-card';
    card.setAttribute('data-index', index);

    card.innerHTML = `
      <div class="course-item-header">
        <span class="course-badge">${index + 1}차 코스</span>
        <button type="button" class="btn-remove-course" onclick="removeCourseItem(${index})">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="form-row dual-row">
        <div class="form-group">
          <label>코스 유형</label>
          <div class="custom-dropdown-container course-type-dropdown">
            <div class="custom-dropdown-selected" tabindex="0">
              <span class="dropdown-selected-label">
                <span class="selected-text">${matchedOption.label}</span>
              </span>
              <i class="fa-solid fa-chevron-down dropdown-arrow"></i>
            </div>
            <div class="custom-dropdown-menu hidden">
              ${COURSE_TYPE_OPTIONS.map(opt => `
                <div class="dropdown-option-item ${opt.value === matchedOption.value ? 'selected' : ''}" data-value="${opt.value}" data-label="${opt.label}">
                  <span class="option-text">${opt.label}</span>
                  <i class="fa-solid fa-check option-check"></i>
                </div>
              `).join('')}
            </div>
            <!-- Hidden native select for 100% backwards compatibility -->
            <select class="course-type" style="display:none;" tabindex="-1">
              ${COURSE_TYPE_OPTIONS.map(opt => `
                <option value="${opt.value}" ${opt.value === matchedOption.value ? 'selected' : ''}>${opt.label}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label><i class="fa-regular fa-clock"></i> 약속 시간</label>
          <div class="custom-timepicker-wrapper">
            <div class="timepicker-input-box" tabindex="0">
              <i class="fa-regular fa-clock timepicker-lead-icon"></i>
              <input type="text" class="course-time-display" placeholder="약속 시간 선택 ⏰" readonly required>
              <i class="fa-solid fa-chevron-down timepicker-arrow-icon"></i>
            </div>
            <!-- Hidden input maintaining HH:MM format for 100% compatibility -->
            <input type="hidden" class="course-time" value="${timeVal}" required>

            <!-- CUSTOM TIMEPICKER POPUP -->
            <div class="custom-timepicker-popup hidden">
              <div class="tp-header">
                <div class="tp-ampm-switch">
                  <button type="button" class="tp-ampm-btn active" data-ampm="PM">오후</button>
                  <button type="button" class="tp-ampm-btn" data-ampm="AM">오전</button>
                </div>
                <div class="tp-preview-text">오후 06:00</div>
              </div>

              <div class="tp-section-label"><i class="fa-regular fa-clock"></i> 시간 선택</div>
              <div class="tp-hours-grid"></div>

              <div class="tp-section-label"><i class="fa-solid fa-hourglass-half"></i> 분 선택</div>
              <div class="tp-minutes-grid"></div>

              <div class="tp-quick-section">
                <div class="tp-section-label">✨ 데이트 추천 시간</div>
                <div class="tp-quick-chips">
                  <button type="button" class="tp-quick-chip" data-time="12:30">☕ 점심 12:30</button>
                  <button type="button" class="tp-quick-chip" data-time="15:00">🍰 카페 15:00</button>
                  <button type="button" class="tp-quick-chip" data-time="18:00">🍽️ 저녁 18:00</button>
                  <button type="button" class="tp-quick-chip" data-time="19:30">🍷 와인 19:30</button>
                  <button type="button" class="tp-quick-chip" data-time="21:00">🌙 산책 21:00</button>
                </div>
              </div>

              <button type="button" class="tp-footer-btn">시간 설정 완료 💖</button>
            </div>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>장소/가게 이름</label>
        <input type="text" class="course-name" value="${nameVal}" placeholder="예: 가게 이름 또는 장소 입력" required>
      </div>
      <div class="form-row dual-row">
        <div class="form-group">
          <label>이동 팁 (선택)</label>
          <input type="text" class="course-move" value="${moveVal}" placeholder="예: 도보 3분 / 차로 10분">
        </div>
        <div class="form-group">
          <label>센스 메모 (선택)</label>
          <input type="text" class="course-tip" value="${tipVal}" placeholder="예: 창가 자리 예약 완료!">
        </div>
      </div>
      <div class="form-group">
        <label>가게/지도 링크 (선택)</label>
        <input type="url" class="course-url" value="${urlVal}" placeholder="예: 네이버지도 / 카카오맵 링크">
      </div>

      <!-- LOCAL GALLERY FILE UPLOAD SECTION -->
      <div class="photo-upload-section">
        <label class="photo-upload-label" for="fileInput_${index}">
          <i class="fa-solid fa-camera"></i> 내 갤러리에서 사진 첨부하기 (최대 3장)
        </label>
        <input type="file" id="fileInput_${index}" class="photo-upload-input" accept="image/*" multiple onchange="handleGalleryUpload(event, ${index})">
        <div class="upload-thumbs-grid" id="thumbsGrid_${index}">
          <!-- Thumbs rendered here -->
        </div>
      </div>
    `;

    // Bind custom dropdown inside this card
    const ddContainer = card.querySelector('.course-type-dropdown');
    const ddSelected = ddContainer.querySelector('.custom-dropdown-selected');
    const ddMenu = ddContainer.querySelector('.custom-dropdown-menu');
    const ddLabel = ddContainer.querySelector('.selected-text');
    const nativeSelect = ddContainer.querySelector('.course-type');
    const optionItems = ddContainer.querySelectorAll('.dropdown-option-item');

    ddSelected.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close other course dropdowns
      document.querySelectorAll('.course-type-dropdown').forEach(other => {
        if (other !== ddContainer) {
          other.classList.remove('open');
          const otherMenu = other.querySelector('.custom-dropdown-menu');
          if (otherMenu) otherMenu.classList.add('hidden');
        }
      });
      ddContainer.classList.toggle('open');
      ddMenu.classList.toggle('hidden');
    });

    optionItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const chosenVal = item.getAttribute('data-value');
        const chosenLabel = item.getAttribute('data-label');

        ddLabel.textContent = chosenLabel;
        nativeSelect.value = chosenVal;
        nativeSelect.dispatchEvent(new Event('change'));

        optionItems.forEach(it => it.classList.remove('selected'));
        item.classList.add('selected');

        ddContainer.classList.remove('open');
        ddMenu.classList.add('hidden');
      });
    });

    // Bind custom time picker for this card
    bindCustomTimePicker(card, timeVal);

    courseList.appendChild(card);
    renderThumbs(index);
    updateRemoveButtons();
  }

  // CUSTOM TIMEPICKER BINDING FUNCTION
  function bindCustomTimePicker(card, initialTimeStr = '18:00') {
    const wrapper = card.querySelector('.custom-timepicker-wrapper');
    if (!wrapper) return;

    const triggerBox = wrapper.querySelector('.timepicker-input-box');
    const displayInput = wrapper.querySelector('.course-time-display');
    const hiddenInput = wrapper.querySelector('.course-time');
    const popup = wrapper.querySelector('.custom-timepicker-popup');
    const ampmBtns = popup.querySelectorAll('.tp-ampm-btn');
    const previewText = popup.querySelector('.tp-preview-text');
    const hoursGrid = popup.querySelector('.tp-hours-grid');
    const minutesGrid = popup.querySelector('.tp-minutes-grid');
    const quickChips = popup.querySelectorAll('.tp-quick-chip');
    const confirmBtn = popup.querySelector('.tp-footer-btn');

    let currentAmPm = 'PM';
    let currentHour12 = 6;
    let currentMinute = '00';

    if (initialTimeStr && initialTimeStr.includes(':')) {
      const parts = initialTimeStr.split(':');
      let h24 = parseInt(parts[0], 10);
      let m = (parts[1] || '00').padStart(2, '0');
      if (isNaN(h24)) h24 = 18;
      currentAmPm = h24 >= 12 ? 'PM' : 'AM';
      currentHour12 = h24 === 0 ? 12 : (h24 > 12 ? h24 - 12 : h24);
      currentMinute = m;
    }

    // 1~12 Hour Chips
    hoursGrid.innerHTML = '';
    for (let h = 1; h <= 12; h++) {
      const chip = document.createElement('div');
      chip.className = `tp-hour-chip ${h === currentHour12 ? 'active' : ''}`;
      chip.textContent = `${h}시`;
      chip.setAttribute('data-hour', h);
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        currentHour12 = h;
        hoursGrid.querySelectorAll('.tp-hour-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        syncValues();
      });
      hoursGrid.appendChild(chip);
    }

    // Minute Chips
    const MINUTE_OPTIONS = ['00', '10', '15', '20', '30', '40', '45', '50'];
    minutesGrid.innerHTML = '';
    MINUTE_OPTIONS.forEach(minStr => {
      const chip = document.createElement('div');
      chip.className = `tp-minute-chip ${minStr === currentMinute ? 'active' : ''}`;
      chip.textContent = `${minStr}분`;
      chip.setAttribute('data-min', minStr);
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        currentMinute = minStr;
        minutesGrid.querySelectorAll('.tp-minute-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        syncValues();
      });
      minutesGrid.appendChild(chip);
    });

    // AM/PM Buttons
    ampmBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentAmPm = btn.getAttribute('data-ampm');
        ampmBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        syncValues();
      });
    });

    // Quick presets
    quickChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const timeVal24 = chip.getAttribute('data-time');
        if (timeVal24) {
          const parts = timeVal24.split(':');
          let h24 = parseInt(parts[0], 10);
          let m = parts[1];
          currentAmPm = h24 >= 12 ? 'PM' : 'AM';
          currentHour12 = h24 === 0 ? 12 : (h24 > 12 ? h24 - 12 : h24);
          currentMinute = m;

          ampmBtns.forEach(b => {
            if (b.getAttribute('data-ampm') === currentAmPm) b.classList.add('active');
            else b.classList.remove('active');
          });
          hoursGrid.querySelectorAll('.tp-hour-chip').forEach(c => {
            if (parseInt(c.getAttribute('data-hour'), 10) === currentHour12) c.classList.add('active');
            else c.classList.remove('active');
          });
          minutesGrid.querySelectorAll('.tp-minute-chip').forEach(c => {
            if (c.getAttribute('data-min') === currentMinute) c.classList.add('active');
            else c.classList.remove('active');
          });

          syncValues();
          closePopup();
        }
      });
    });

    function syncValues() {
      let h24 = currentHour12;
      if (currentAmPm === 'AM') {
        if (h24 === 12) h24 = 0;
      } else {
        if (h24 < 12) h24 += 12;
      }
      const h24Str = String(h24).padStart(2, '0');
      const time24 = `${h24Str}:${currentMinute}`;
      hiddenInput.value = time24;

      const ampmLabel = currentAmPm === 'PM' ? '오후' : '오전';
      const h12Pad = String(currentHour12).padStart(2, '0');
      const displayText = `${ampmLabel} ${h12Pad}:${currentMinute}`;

      displayInput.value = displayText;
      if (previewText) previewText.textContent = displayText;
    }

    function openPopup() {
      document.querySelectorAll('.custom-timepicker-popup').forEach(p => {
        if (p !== popup) p.classList.add('hidden');
      });
      document.querySelectorAll('.timepicker-input-box').forEach(b => {
        if (b !== triggerBox) b.classList.remove('open');
      });
      const calPopup = document.getElementById('customCalendarPopup');
      if (calPopup) calPopup.classList.add('hidden');

      popup.classList.remove('hidden');
      triggerBox.classList.add('open');
    }

    function closePopup() {
      popup.classList.add('hidden');
      triggerBox.classList.remove('open');
    }

    triggerBox.addEventListener('click', (e) => {
      e.stopPropagation();
      if (popup.classList.contains('hidden')) {
        openPopup();
      } else {
        closePopup();
      }
    });

    if (confirmBtn) {
      confirmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        syncValues();
        closePopup();
      });
    }

    syncValues();
  }

  // Handle Local Gallery Image File Upload with Image Compression
  window.handleGalleryUpload = function(event, index) {
    const files = Array.from(event.target.files);
    if (!files || files.length === 0) return;

    if (!coursePhotosMap[index]) coursePhotosMap[index] = [];
    
    files.slice(0, 3 - coursePhotosMap[index].length).forEach(file => {
      compressAndReadImage(file, (dataUrl) => {
        if (coursePhotosMap[index].length < 3) {
          coursePhotosMap[index].push(dataUrl);
          renderThumbs(index);
        }
      });
    });
  };

  // Compress Image to lightweight DataURL
  function compressAndReadImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 420;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // 경량 썸네일로 압축하여 URL 해시 및 클라우드 보관 최적화
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        callback(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function renderThumbs(index) {
    const grid = document.getElementById(`thumbsGrid_${index}`);
    if (!grid) return;

    grid.innerHTML = '';
    const photos = coursePhotosMap[index] || [];
    photos.forEach((src, pIdx) => {
      const thumb = document.createElement('div');
      thumb.className = 'thumb-item';
      thumb.innerHTML = `
        <img src="${src}" alt="갤러리 사진">
        <button type="button" class="btn-delete-thumb" onclick="deleteThumb(${index}, ${pIdx})">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;
      grid.appendChild(thumb);
    });
  }

  window.deleteThumb = function(courseIdx, photoIdx) {
    if (coursePhotosMap[courseIdx]) {
      coursePhotosMap[courseIdx].splice(photoIdx, 1);
      renderThumbs(courseIdx);
    }
  };

  window.removeCourseItem = function(index) {
    const card = courseList.querySelector(`.course-item-card[data-index="${index}"]`);
    if (card) {
      card.remove();
      delete coursePhotosMap[index];
      reindexCourses();
    }
  };

  function reindexCourses() {
    const cards = courseList.querySelectorAll('.course-item-card');
    // coursePhotosMap 키를 새 인덱스에 맞게 재매핑
    const newPhotosMap = {};
    cards.forEach((card, idx) => {
      const oldIndex = parseInt(card.getAttribute('data-index'));
      newPhotosMap[idx] = coursePhotosMap[oldIndex] || [];
      card.setAttribute('data-index', idx);
      const badge = card.querySelector('.course-badge');
      if (badge) badge.textContent = `${idx + 1}차 코스`;
      const removeBtn = card.querySelector('.btn-remove-course');
      if (removeBtn) removeBtn.setAttribute('onclick', `removeCourseItem(${idx})`);
      // 갤러리 file input과 thumbs grid의 인덱스도 업데이트
      const fileInput = card.querySelector('.photo-upload-input');
      if (fileInput) {
        fileInput.id = `fileInput_${idx}`;
        fileInput.setAttribute('onchange', `handleGalleryUpload(event, ${idx})`);
      }
      const uploadLabel = card.querySelector('.photo-upload-label');
      if (uploadLabel) uploadLabel.setAttribute('for', `fileInput_${idx}`);
      const thumbsGrid = card.querySelector('.upload-thumbs-grid');
      if (thumbsGrid) thumbsGrid.id = `thumbsGrid_${idx}`;
    });
    // coursePhotosMap 교체
    Object.keys(coursePhotosMap).forEach(k => delete coursePhotosMap[k]);
    Object.assign(coursePhotosMap, newPhotosMap);
    updateRemoveButtons();
  }

  function updateRemoveButtons() {
    const cards = courseList.querySelectorAll('.course-item-card');
    cards.forEach((card) => {
      const removeBtn = card.querySelector('.btn-remove-course');
      if (removeBtn) {
        if (cards.length > 1) removeBtn.classList.remove('hidden');
        else removeBtn.classList.add('hidden');
      }
    });
  }

  // Budget Chips
  budgetChips.addEventListener('click', (e) => {
    const target = e.target.closest('.chip');
    if (!target) return;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    target.classList.add('active');
    selectedBudget.value = target.getAttribute('data-value');
  });

  // Create Invitation Submit
  createBtn.addEventListener('click', () => {
    if (isCreatingCard) return;

    const senderName = document.getElementById('senderName').value.trim();
    const receiverName = document.getElementById('receiverName').value.trim();
    const dateVal = document.getElementById('date').value;
    const mainArea = document.getElementById('mainArea').value.trim();
    const budget = selectedBudget.value;
    const message = document.getElementById('message').value.trim();
    const theme = selectedTheme.value;

    if (!senderName || !receiverName || !dateVal || !mainArea || !message) {
      showToast('필수 항목을 모두 작성해주세요! 🌿', true);
      return;
    }

    const courseCards = courseList.querySelectorAll('.course-item-card');
    const courses = [];
    let isValid = true;

    courseCards.forEach((card, idx) => {
      const type = card.querySelector('.course-type').value;
      const time = card.querySelector('.course-time').value;
      const name = card.querySelector('.course-name').value.trim();
      const move = card.querySelector('.course-move').value.trim();
      const tip = card.querySelector('.course-tip').value.trim();
      let url = card.querySelector('.course-url').value.trim();

      const photos = coursePhotosMap[idx] || [];

      if (!name || !time) isValid = false;

      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      courses.push({ t: type, tm: time, n: name, m: move, tp: tip, u: url, p: photos });
    });

    if (!isValid || courses.length === 0) {
      showToast('각 코스의 장소 이름과 시간을 입력해 주세요!', true);
      return;
    }

    // 1. 보관함 중복 확인: 이미 동일한 데이트 초대장이 보관함에 있는지 검사
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

    // 2. 무한 클릭 방지 및 로딩 상태 활성화
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
      const myCreated = JSON.parse(localStorage.getItem('dateplanner_my_created_ids') || '[]');
      if (!myCreated.includes(cardId)) {
        myCreated.push(cardId);
        localStorage.setItem('dateplanner_my_created_ids', JSON.stringify(myCreated));
      }
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }

    // URL 해시(#card=)는 서버로 전송되지 않으므로 사진 데이터를 포함하여 인코딩
    const encodedToken = encodePayload(payload);

    let baseUrl = window.location.origin + window.location.pathname;
    // Fallback file:// local testing to the registered GitHub Pages domain for Kakao API compatibility
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'https://gksxogksxo1001-sketch.github.io/Date/';
    }
    generatedShareUrl = `${baseUrl}#card=${encodedToken}`;

    // Auto-save to Date Cards Archive
    ArchiveService.save(payload, generatedShareUrl);

    shareUrlInput.value = generatedShareUrl;
    shareModal.classList.remove('hidden');

    setTimeout(() => {
      isCreatingCard = false;
      createBtn.disabled = false;
      createBtn.classList.remove('btn-loading');
      createBtn.innerHTML = originalBtnHtml;
    }, 800);
  });

  // Duplicate Invitation Notice Modal Handler
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

    dupOpenExistingBtn.onclick = () => {
      duplicateModal.classList.add('hidden');
      openCardFromShareUrl(card.shareUrl || card.id);
    };

    dupOpenArchiveBtn.onclick = () => {
      duplicateModal.classList.add('hidden');
      if (archiveModal) {
        archiveModal.classList.remove('hidden');
        ArchiveService.loadAndRender();
      }
    };

    closeDupModalBtn.onclick = () => {
      duplicateModal.classList.add('hidden');
    };
  }

  // Copy & Modal Handlers
  copyBtn.addEventListener('click', () => {
    if (!generatedShareUrl) return;
    copyToClipboard(generatedShareUrl, '스토리 초대장 링크가 복사되었습니다! 🌿');
  });

  previewBtn.addEventListener('click', () => {
    shareModal.classList.add('hidden');
    openCardFromShareUrl(generatedShareUrl);
  });

  closeModalBtn.addEventListener('click', () => {
    shareModal.classList.add('hidden');
  });

  // Open and View Story Card from URL or Token
  function openCardFromShareUrl(shareUrl) {
    if (!shareUrl) return;
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

  function loadCardByToken(token) {
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

    if (data) {
      // 로컬 스토리지 또는 보관함에서 사진 데이터 복원
      data = hydrateCardPhotos(data);
      recipientData = data;
      renderStoryViewer(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Supabase 클라우드 DB에서 사진이 있을 경우 비동기 보강
      fetchCloudPhotosIfMissing(data);
      return true;
    } else {
      showToast('초대장 데이터를 불러올 수 없습니다. 새 초대장을 작성해 주세요.', true);
      landingMode.classList.remove('hidden');
      return false;
    }
  }

  // 카드 내 누락된 사진 데이터 로컬/보관함 복원 함수
  function hydrateCardPhotos(cardData) {
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

  // Supabase 클라우드에서 사진 비동기 보강
  async function fetchCloudPhotosIfMissing(cardData) {
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

  function checkAndLoadCardFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const queryCardToken = urlParams.get('card');
    const hashCardToken = getHashParam('card');
    const cardToken = hashCardToken || queryCardToken;

    // 레거시 ?card= URL로 접속 시 → #card= 형식으로 자동 리다이렉트 (서버 502 방지)
    if (queryCardToken && !hashCardToken) {
      const cleanBase = window.location.origin + window.location.pathname;
      window.location.replace(`${cleanBase}#card=${queryCardToken}`);
      return;
    }

    if (cardToken) {
      loadCardByToken(cardToken);
    }
  }

  // Hashchange listener for smooth back/forward and direct navigation
  window.addEventListener('hashchange', () => {
    const hashCardToken = getHashParam('card');
    if (hashCardToken) {
      loadCardByToken(hashCardToken);
    } else if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      viewMode.classList.add('hidden');
      createMode.classList.add('hidden');
      appHeader.classList.add('hidden');
      landingMode.classList.remove('hidden');
    }
  });

  // Initial Check on Page Load
  checkAndLoadCardFromUrl();

  // STORY PAGER ENGINE WITH CUSTOM DROPDOWN POPULATION
  function renderStoryViewer(data) {
    landingMode.classList.add('hidden');
    appHeader.classList.add('hidden'); // 스토리 뷰어에서는 상단 글로벌 네비바만 보이도록 대형 헤더 숨김
    createMode.classList.add('hidden');
    viewMode.classList.remove('hidden');

    if (data.tm) {
      appBody.className = `theme-${data.tm}`;
    }

    courseData = data.c || [];
    currentStoryIndex = 0;

    const totalPages = courseData.length + 1;
    storyProgress.innerHTML = '';
    for (let i = 0; i < totalPages; i++) {
      const step = document.createElement('div');
      step.className = `story-step ${i === 0 ? 'active' : ''}`;
      storyProgress.appendChild(step);
    }

    // Populate Custom Dropdown Options for Feedback
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

      // Default First Option
      selectDropdownOption(`${1}차 코스 (${courseData[0].n})`);
    }

    const optAllVal = '전체 코스 변경 요청';
    const optAllEl = document.createElement('div');
    optAllEl.className = 'dropdown-option-item';
    optAllEl.textContent = optAllVal;
    optAllEl.onclick = () => selectDropdownOption(optAllVal);
    dropdownMenu.appendChild(optAllEl);

    updateStoryPage();
    updateViewerActionUI(data);
  }

  function selectDropdownOption(val) {
    selectedCourseText.textContent = val;
    adjustCourseValue.value = val;
    customDropdown.classList.remove('open');
    dropdownMenu.classList.add('hidden');
  }

  function updateStoryPage() {
    if (!recipientData) return;

    const totalPages = courseData.length + 1;
    pageIndicator.textContent = `${currentStoryIndex + 1} / ${totalPages}`;

    const steps = storyProgress.querySelectorAll('.story-step');
    steps.forEach((step, idx) => {
      if (idx <= currentStoryIndex) step.classList.add('active');
      else step.classList.remove('active');
    });

    prevStoryBtn.disabled = (currentStoryIndex === 0);
    nextStoryBtn.disabled = (currentStoryIndex === totalPages - 1);

    storyPageWrapper.innerHTML = '';
    const slide = document.createElement('div');
    slide.className = 'story-card-slide';

    if (currentStoryIndex < courseData.length) {
      const item = courseData[currentStoryIndex];
      const moveBadge = item.m ? `<span><i class="fa-solid fa-person-walking"></i> ${item.m}</span>` : '';
      const tipBox = item.tp ? `
        <div class="story-tip-box">
          <i class="fa-regular fa-lightbulb"></i>
          <div><strong>남친 Tip:</strong> ${item.tp}</div>
        </div>
      ` : '';

      let galleryHtml = '';
      if (item.p && Array.isArray(item.p) && item.p.length > 0) {
        const count = item.p.length;
        const photoImgs = item.p.map((src, idx) => `<img src="${src}" class="gallery-photo-item" alt="분위기 사진" title="클릭하여 원본 크게 보기" onclick="window.openImageZoom('${src}')">`).join('');
        galleryHtml = `<div class="story-photo-gallery count-${count}">${photoImgs}</div>`;
      }

      const linkBox = item.u ? `
        <div class="story-link-box">
          <a href="${item.u}" target="_blank" rel="noopener noreferrer" class="btn-story-link">
            <i class="fa-solid fa-map-location-dot"></i> 가게/지도 정보 보러가기 (새창)
          </a>
        </div>
      ` : '';

      slide.innerHTML = `
        <span class="story-header-tag">${currentStoryIndex + 1}차 코스 · ${item.t}</span>
        <h2 class="story-place-title">${item.n}</h2>
        <div class="story-meta-row">
          <span><i class="fa-regular fa-clock"></i> ${item.tm} 시작</span>
          ${moveBadge}
        </div>
        ${galleryHtml}
        ${tipBox}
        ${linkBox}
      `;
    } else {
      // Final Summary Slide
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
      `;
    }

    storyPageWrapper.appendChild(slide);
  }

  // Pager Event Listeners
  prevStoryBtn.addEventListener('click', () => {
    if (currentStoryIndex > 0) {
      currentStoryIndex--;
      updateStoryPage();
    }
  });

  nextStoryBtn.addEventListener('click', () => {
    const totalPages = courseData.length + 1;
    if (currentStoryIndex < totalPages - 1) {
      currentStoryIndex++;
      updateStoryPage();
    }
  });

  // Touch Swipe Support
  let startX = 0;
  storyPageWrapper.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  });

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

  // KakaoTalk Share Handler
  if (shareKakaoBtn) {
    shareKakaoBtn.addEventListener('click', () => {
      if (!generatedShareUrl) return;

      const sender = document.getElementById('senderName').value.trim() || '신청자';
      const receiver = document.getElementById('receiverName').value.trim() || '상대방';
      const dateVal = document.getElementById('date').value;
      const areaVal = document.getElementById('mainArea').value.trim() || '데이트 장소';
      const formattedDate = formatDateString(dateVal);

      sendKakaoFeed({
        title: `💌 ${sender}님이 보낸 감성 데이트 초대장 💖`,
        description: `${receiver}야! ${formattedDate}에 ${areaVal}에서 만나자! 🌿`,
        imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop',
        webUrl: generatedShareUrl,
        buttonTitle: '스토리 초대장 확인하기 💖',
        fallbackText: `[DateCard 초대장 💌]\n${sender}님이 보낸 데이트 초대장이 도착했습니다! 💖\n아래 링크를 눌러 스토리로 확인해 보세요 🌿\n\n${generatedShareUrl}`,
        toastMsg: '카카오톡 공유창이 열렸습니다! 💬'
      });
    });
  }

  // Role & Acceptance UI State Controller
  function updateViewerActionUI(data) {
    if (!data) return;

    const cardId = data.id || data.cardId;
    let myCreated = [];
    try {
      myCreated = JSON.parse(localStorage.getItem('dateplanner_my_created_ids') || '[]');
    } catch (e) {}

    const isCreator = Boolean(
      (cardId && myCreated.includes(cardId)) || 
      (AuthService.currentUser && data.creatorId && AuthService.currentUser.id === data.creatorId)
    );

    let acceptedList = [];
    try {
      acceptedList = JSON.parse(localStorage.getItem('dateplanner_accepted_cards') || '[]');
    } catch (e) {}

    let isAccepted = Boolean(
      (cardId && acceptedList.includes(cardId)) || 
      data.isAccepted === true
    );

    // Helper function for calendar save button state
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

    if (isCreator) {
      // 1. Creator (Sender) View: Never show accept or feedback buttons
      if (creatorNoticeBanner) creatorNoticeBanner.classList.remove('hidden');
      if (creatorShareAgainBtn) creatorShareAgainBtn.classList.remove('hidden');
      if (acceptBtn) acceptBtn.classList.add('hidden');
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

    // 2. Recipient View
    if (creatorNoticeBanner) creatorNoticeBanner.classList.add('hidden');
    if (creatorShareAgainBtn) creatorShareAgainBtn.classList.add('hidden');

    if (isAccepted) {
      // Already accepted: Permanently hide accept and feedback buttons
      if (acceptedStatusBanner) {
        acceptedStatusBanner.classList.remove('hidden');
        acceptedStatusBanner.innerHTML = '<i class="fa-solid fa-heart-circle-check"></i> <span>데이트 약속을 수락하셨습니다! (확정됨 💖)</span>';
      }
      if (acceptBtn) acceptBtn.classList.add('hidden');
      if (feedbackBtn) feedbackBtn.classList.add('hidden');
      if (downloadCardBtn) downloadCardBtn.classList.remove('hidden');
      if (saveStoryCardBtn) saveStoryCardBtn.classList.remove('hidden');
    } else {
      // Not yet accepted: show accept and feedback buttons
      if (acceptedStatusBanner) acceptedStatusBanner.classList.add('hidden');
      if (acceptBtn) acceptBtn.classList.remove('hidden');
      if (feedbackBtn) feedbackBtn.classList.remove('hidden');
      if (downloadCardBtn) downloadCardBtn.classList.remove('hidden');
      if (saveStoryCardBtn) saveStoryCardBtn.classList.remove('hidden');
    }

    updateSaveBtnState();

    // Cloud Verification with Supabase
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
              localStorage.setItem('dateplanner_accepted_cards', JSON.stringify(acceptedList));
            } catch (e) {}
            updateViewerActionUI(Object.assign({}, data, { isAccepted: true }));
          }
        })
        .catch(() => {});
    }
  }

  // Accept & Feedback Handlers
  acceptBtn.addEventListener('click', async () => {
    const sender = recipientData ? recipientData.s : '신청자';
    const recipient = recipientData ? recipientData.r : '그대';
    const targetDate = recipientData ? formatDateString(recipientData.d) : '특별한 날';
    const cardId = recipientData ? (recipientData.id || recipientData.cardId) : null;
    const currentUrl = window.location.href;

    // 1. Mark accepted locally & in Supabase
    if (cardId) {
      try {
        const acceptedList = JSON.parse(localStorage.getItem('dateplanner_accepted_cards') || '[]');
        if (!acceptedList.includes(cardId)) {
          acceptedList.push(cardId);
          localStorage.setItem('dateplanner_accepted_cards', JSON.stringify(acceptedList));
        }
      } catch (e) {}
      ArchiveService.markCardAccepted(cardId);
    }

    // 2. Immediately lock UI (hide accept & feedback buttons, keep only image download button)
    if (acceptBtn) acceptBtn.classList.add('hidden');
    if (feedbackBtn) feedbackBtn.classList.add('hidden');
    if (acceptedStatusBanner) {
      acceptedStatusBanner.classList.remove('hidden');
      acceptedStatusBanner.innerHTML = '<i class="fa-solid fa-heart-circle-check"></i> <span>데이트 약속을 수락하셨습니다! (확정됨 💖)</span>';
    }
    if (downloadCardBtn) downloadCardBtn.classList.remove('hidden');

    // 3. Trigger Romantic Heart & Confetti Explosion Animation
    triggerRomanticConfetti();

    // 4. Open Accept Modal
    acceptModalTitle.textContent = '🎉 데이트 약속을 수락하셨습니다!';
    acceptModalDesc.textContent = `${sender}님과의 설레는 데이트 약속이 확정되었습니다! 아래 버튼을 눌러 ${sender}님께 카카오톡으로 수락 답장을 전송해 보세요 💖`;
    acceptOverlay.classList.remove('hidden');

    // 5. Automatically open Kakao Share dialog so recipient can send acceptance message back to creator
    sendAcceptKakaoMessage(true);
  });

  function sendAcceptKakaoMessage(isAuto = false) {
    const sender = recipientData ? recipientData.s : '신청자';
    const recipient = recipientData ? recipientData.r : '그대';
    const targetDate = recipientData ? formatDateString(recipientData.d) : '특별한 날';
    const currentUrl = window.location.href;

    sendKakaoFeed({
      title: `💖 [데이트 수락] ${recipient}님이 데이트 코스를 수락했어요!`,
      description: `${sender}아! 네가 정성껏 보내준 데이트 코스 너무 마음에 들어 🌿\n📅 데이트 약속: ${targetDate}\n설레는 마음으로 그날 만나요 ✨`,
      imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop',
      webUrl: currentUrl,
      buttonTitle: '확정된 데이트 코스 보기 💖',
      fallbackText: `[DatePlanner 데이트 수락 💖]\n${sender}아! 정성껏 보내준 데이트 코스 너무 완벽해! 기쁜 마음으로 수락할게 🌿\n\n📅 데이트 날짜: ${targetDate}\n✨ 확정 코스 보기: ${currentUrl}`,
      toastMsg: '카카오톡으로 수락 답장 창이 열렸습니다! 💖',
      isAuto: isAuto
    });
  }

  if (sendAcceptKakaoBtn) {
    sendAcceptKakaoBtn.addEventListener('click', () => sendAcceptKakaoMessage(false));
  }

  if (creatorShareAgainBtn) {
    creatorShareAgainBtn.addEventListener('click', () => {
      const targetUrl = window.location.href;
      const recipient = recipientData ? recipientData.r : '소중한 사람';
      const sender = recipientData ? recipientData.s : '신청자';

      sendKakaoFeed({
        title: `💌 [DateCard] ${sender}님이 보낸 데이트 초대장`,
        description: `${recipient}아, 너만을 위해 준비한 감성 데이트 코스야! 확인해 볼래? 🌿`,
        imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop',
        webUrl: targetUrl,
        buttonTitle: '스토리 초대장 확인하기 💖',
        fallbackText: `[DateCard 초대장 💌]\n${sender}님이 보낸 데이트 초대장:\n${targetUrl}`,
        toastMsg: '카카오톡 공유창이 열렸습니다! 💬'
      });
    });
  }

  [downloadCardBtn, downloadModalCardBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', downloadCardImage);
  });

  feedbackBtn.addEventListener('click', () => {
    feedbackModal.classList.remove('hidden');
  });

  closeFeedbackModalBtn.addEventListener('click', () => {
    feedbackModal.classList.add('hidden');
  });

  sendFeedbackKakaoBtn.addEventListener('click', () => {
    const selectedTarget = adjustCourseValue.value || '코스 전체';
    const reqMsg = adjustMessage.value.trim();
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
      imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop',
      webUrl: currentUrl,
      buttonTitle: '코스 확인하고 조율하기 💬',
      fallbackText: `[DatePlanner 코스 조정 요청 💬]\n${sender}아! 데이트 신청 잘 봤어 🌿\n\n📌 요청 코스: ${selectedTarget}\n💌 제안 내용: "${reqMsg}"\n\n👉 코스 링크: ${currentUrl}`,
      toastMsg: '카카오톡 조정 요청 창이 열렸습니다! 💬'
    });

    feedbackModal.classList.add('hidden');
  });

  closeAcceptBtn.addEventListener('click', () => {
    acceptOverlay.classList.add('hidden');
  });

  makeNewBtn.addEventListener('click', () => {
    window.location.href = window.location.origin + window.location.pathname;
  });

  // MULTI-FALLBACK COMPATIBLE DECODER
  function encodePayload(obj) {
    const jsonStr = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(jsonStr);
    let binStr = '';
    bytes.forEach(b => binStr += String.fromCharCode(b));
    return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodePayload(token) {
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

  function getHashParam(key) {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get(key);
  }

  function formatDateString(dStr) {
    const dateObj = new Date(dStr);
    if (isNaN(dateObj.getTime())) return dStr;
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const date = dateObj.getDate();
    const day = days[dateObj.getDay()];
    return `${year}년 ${month}월 ${date}일 (${day})`;
  }

  function showToast(msg, isError = false) {
    toastMsg.textContent = msg;
    toast.style.background = isError ? '#E53935' : '#2B2D42';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  // 4. ROMANTIC CONFETTI & HEART ANIMATION ENGINE
  function triggerRomanticConfetti() {
    if (typeof confetti !== 'function') return;

    // First burst: Center hearts & pastel rose/gold confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E07A5F', '#F4F1DE', '#81B29A', '#F2CC8F', '#E8A598', '#FFB7C5'],
      scalar: 1.2
    });

    // Side cannons after 250ms
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#E07A5F', '#FFB7C5', '#F2CC8F']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#E07A5F', '#81B29A', '#F4F1DE']
      });
    }, 250);

    // Heart rainfall finish after 600ms
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 100,
        origin: { y: 0.4 },
        colors: ['#E07A5F', '#FF6B81', '#FFB7C5'],
        shapes: ['circle'],
        scalar: 1.5
      });
    }, 600);
  }

  // 5. HTML2CANVAS HIGH-QUALITY CARD IMAGE DOWNLOAD ENGINE
  function downloadCardImage() {
    const cardTarget = document.getElementById('storyPageWrapper');
    if (!cardTarget) return;

    // Temporarily hide open modal overlays and toast notification so they don't appear in captured card image
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

    // Allow DOM layout to settle after hiding overlays
    setTimeout(() => {
      html2canvas(cardTarget, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        scrollX: 0,
        scrollY: 0
      }).then(canvas => {
        // Restore modal overlays and toast
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
});
