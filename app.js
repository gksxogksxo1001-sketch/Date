// ====================================================
// KAKAO TALK API KEY CONFIGURATION
// 카카오 개발자 센터에서 발급받은 JavaScript 키 등록 완료
// ====================================================
const KAKAO_APP_KEY = 'd26b232de6dfcbfa561ff1fd2c6afd54';

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
  const openArchiveBtn = document.getElementById('openArchiveBtn');
  const archiveCountBadge = document.getElementById('archiveCountBadge');
  const kakaoLoginBtn = document.getElementById('kakaoLoginBtn');
  const userProfileNav = document.getElementById('userProfileNav');
  const userAvatarImg = document.getElementById('userAvatarImg');
  const userNicknameSpan = document.getElementById('userNicknameSpan');
  const kakaoLogoutBtn = document.getElementById('kakaoLogoutBtn');

  // Archive Modal Elements
  const archiveModal = document.getElementById('archiveModal');
  const closeArchiveModalBtn = document.getElementById('closeArchiveModalBtn');
  const closeArchiveBottomBtn = document.getElementById('closeArchiveBottomBtn');
  const archiveCardsGrid = document.getElementById('archiveCardsGrid');
  const archiveEmptyState = document.getElementById('archiveEmptyState');
  const archiveCreateNewBtn = document.getElementById('archiveCreateNewBtn');
  const archiveUserStatusText = document.getElementById('archiveUserStatusText');

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
  // SUPABASE CLIENT CONFIGURATION
  // ====================================================
  const SUPABASE_URL = 'https://cmxcazjrasptkspomyyo.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_XSJgAV4bPOhoWbG6DO0M7w_Fibr9uer';

  let supabaseClient = null;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log('Supabase client initialized successfully');
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
      if (!window.Kakao) {
        showToast('카카오 SDK를 불러오는 중입니다.', true);
        return;
      }
      if (!window.Kakao.isInitialized()) {
        try {
          window.Kakao.init(KAKAO_APP_KEY);
        } catch (e) {
          console.error('Kakao init error:', e);
        }
      }

      let redirectUri = 'https://gksxogksxo1001-sketch.github.io/Date/';
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        redirectUri = window.location.origin + window.location.pathname;
      }

      if (window.Kakao.Auth && typeof window.Kakao.Auth.authorize === 'function') {
        window.Kakao.Auth.authorize({
          redirectUri: redirectUri,
          scope: 'profile_nickname,profile_image'
        });
      } else if (window.Kakao.Auth && typeof window.Kakao.Auth.login === 'function') {
        window.Kakao.Auth.login({
          scope: 'profile_nickname,profile_image',
          success: () => this.fetchUserProfile(),
          fail: (err) => {
            console.error('Kakao login error:', err);
            showToast('카카오 로그인에 실패하였습니다.', true);
          }
        });
      }
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
        showToast('카카오 로그인 처리 중입니다... 🌿');
        const response = await fetch('https://kauth.kakao.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: KAKAO_APP_KEY,
            redirect_uri: redirectUri,
            code: code
          })
        });

        const tokenData = await response.json();
        if (tokenData.access_token) {
          if (window.Kakao && window.Kakao.Auth) {
            window.Kakao.Auth.setAccessToken(tokenData.access_token);
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
      if (window.Kakao && window.Kakao.API) {
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: (res) => {
            const kakaoAccount = res.kakao_account || {};
            const profile = kakaoAccount.profile || {};
            const user = {
              id: 'kakao_' + res.id,
              nickname: profile.nickname || '카카오 회원',
              profileImage: profile.profile_image_url || profile.thumbnail_image_url || 'assets/favicon.png',
              email: kakaoAccount.email || '',
              loginTime: Date.now()
            };
            this.saveSession(user);
            showToast(`💖 ${user.nickname}님, 환영합니다!`);
          },
          fail: (error) => {
            console.error('Kakao profile request error:', error);
            showToast('카카오 프로필 정보를 가져오지 못했습니다.', true);
          }
        });
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
      } else {
        if (kakaoLoginBtn) kakaoLoginBtn.classList.remove('hidden');
        if (userProfileNav) userProfileNav.classList.add('hidden');
        if (archiveUserStatusText) archiveUserStatusText.textContent = '💡 카카오 로그인 시 Supabase 클라우드에 안전하게 영구 보관됩니다.';
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

    async save(cardPayload, shareUrl) {
      const list = this.getAll();
      const existingIndex = list.findIndex(item => item.id === cardPayload.id);
      const archiveItem = {
        id: cardPayload.id || ('card_' + Date.now()),
        senderName: cardPayload.s,
        receiverName: cardPayload.r,
        date: cardPayload.d,
        area: cardPayload.a,
        budget: cardPayload.b,
        message: cardPayload.m,
        theme: cardPayload.tm,
        courses: cardPayload.c || [],
        shareUrl: shareUrl,
        createdAt: Date.now(),
        userId: AuthService.currentUser ? AuthService.currentUser.id : 'guest'
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
          const dbRow = {
            id: archiveItem.id,
            user_id: archiveItem.userId,
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
        cardEl.className = `archive-card-item theme-${item.theme || 'cozy'}`;

        const courseSummary = (item.courses || []).map((c, i) => `${i + 1}차: ${c.n}`).join(' ➔ ') || '코스 정보 없음';
        const createdDateStr = new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const targetDateStr = formatDateString(item.date);
        const themeLabel = item.theme === 'rose' ? '🌹 Romantic Rose' : (item.theme === 'midnight' ? '🌙 Midnight Navy' : '🌿 Warm Cozy');

        cardEl.innerHTML = `
          <div class="archive-card-header">
            <div class="archive-theme-pill">${themeLabel}</div>
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
    window.location.href = shareUrl;
  };

  window.copyArchiveLink = function(shareUrl) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => showToast('초대장 링크가 복사되었습니다! 🌿'))
        .catch(() => fallbackCopyDirect(shareUrl));
    } else {
      fallbackCopyDirect(shareUrl);
    }
  };

  function fallbackCopyDirect(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast('초대장 링크가 복사되었습니다!');
  }

  window.shareArchiveKakao = function(cardId) {
    const item = ArchiveService.getAll().find(c => c.id === cardId);
    if (!item) return;

    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        try {
          window.Kakao.init(KAKAO_APP_KEY);
        } catch (e) {
          console.error(e);
        }
      }
      if (window.Kakao.isInitialized()) {
        let targetUrl = item.shareUrl;
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
          targetUrl = 'https://gksxogksxo1001-sketch.github.io/Date/' + (targetUrl.includes('?') ? targetUrl.substring(targetUrl.indexOf('?')) : '');
        }

        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: `💌 ${item.senderName}님이 보낸 감성 데이트 초대장 💖`,
            description: `${item.receiverName}야! ${formatDateString(item.date)}에 ${item.area}에서 만나자! 🌿`,
            imageUrl: 'https://gksxogksxo1001-sketch.github.io/Date/assets/restaurant.jpg',
            link: {
              mobileWebUrl: targetUrl,
              webUrl: targetUrl,
            },
          },
          buttons: [
            {
              title: '스토리 초대장 확인하기 💖',
              link: {
                mobileWebUrl: targetUrl,
                webUrl: targetUrl,
              },
            },
          ],
        });
        showToast('카카오톡 공유창이 열렸습니다! 💬');
        return;
      }
    }

    // Fallback
    window.copyArchiveLink(item.shareUrl);
  };

  window.deleteArchiveItem = function(cardId) {
    if (confirm('이 데이트 초대장을 보관함에서 삭제하시겠습니까?')) {
      ArchiveService.delete(cardId);
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

  // Default DatePicker to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('date').valueAsDate = tomorrow;

  // 1. Custom Dropdown Toggle Handler
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

  // 3. INITIAL CLEAN EMPTY COURSES (NO HARDCODED VALUES)
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
          <select class="course-type custom-select">
            <option value="🍽️ 맛집/식사" ${typeVal.includes('맛집') ? 'selected' : ''}>🍽️ 맛집/식사</option>
            <option value="☕ 카페/디저트" ${typeVal.includes('카페') ? 'selected' : ''}>☕ 카페/디저트</option>
            <option value="전시/놀거리/문화" ${typeVal.includes('놀거리') ? 'selected' : ''}>전시/놀거리/문화</option>
            <option value="✨ 산책/야경" ${typeVal.includes('산책') ? 'selected' : ''}>✨ 산책/야경</option>
            <option value="🍷 술집/와인바" ${typeVal.includes('술집') ? 'selected' : ''}>🍷 술집/와인바</option>
            <option value="📍 기타 장소">📍 기타 장소</option>
          </select>
        </div>
        <div class="form-group">
          <label>약속 시간</label>
          <input type="time" class="course-time" value="${timeVal}" required>
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

    courseList.appendChild(card);
    renderThumbs(index);
    updateRemoveButtons();
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
        const maxDim = 600;
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
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
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
    cards.forEach((card, idx) => {
      card.setAttribute('data-index', idx);
      const badge = card.querySelector('.course-badge');
      if (badge) badge.textContent = `${idx + 1}차 코스`;
      const removeBtn = card.querySelector('.btn-remove-course');
      if (removeBtn) removeBtn.setAttribute('onclick', `removeCourseItem(${idx})`);
    });
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

    const cardId = 'card_' + Date.now();
    const payload = {
      id: cardId,
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
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }

    const encodedToken = encodePayload(payload);

    let baseUrl = window.location.origin + window.location.pathname;
    // Fallback file:// local testing to the registered GitHub Pages domain for Kakao API compatibility
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'https://gksxogksxo1001-sketch.github.io/Date/';
    }
    generatedShareUrl = `${baseUrl}?card=${encodedToken}`;

    // Auto-save to Date Cards Archive
    ArchiveService.save(payload, generatedShareUrl);

    shareUrlInput.value = generatedShareUrl;
    shareModal.classList.remove('hidden');
  });

  // Copy & Modal Handlers
  copyBtn.addEventListener('click', () => {
    if (!generatedShareUrl) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(generatedShareUrl)
        .then(() => showToast('스토리 초대장 링크가 복사되었습니다! 🌿'))
        .catch(() => fallbackCopy(generatedShareUrl));
    } else {
      fallbackCopy(generatedShareUrl);
    }
  });

  function fallbackCopy(text) {
    shareUrlInput.select();
    document.execCommand('copy');
    showToast('초대장 링크가 복사되었습니다!');
  }

  previewBtn.addEventListener('click', () => {
    shareModal.classList.add('hidden');
    window.location.href = generatedShareUrl;
  });

  closeModalBtn.addEventListener('click', () => {
    shareModal.classList.add('hidden');
  });

  // Check URL Query & Decode safely
  const urlParams = new URLSearchParams(window.location.search);
  const cardToken = urlParams.get('card') || getHashParam('card');

  if (cardToken) {
    // Hide landing page immediately when viewing a shared card
    landingMode.classList.add('hidden');
    try {
      recipientData = decodePayload(cardToken);
      renderStoryViewer(recipientData);
    } catch (err) {
      console.warn('Parse error fallback:', err);
      if (cardToken.startsWith('card_')) {
        const localStr = localStorage.getItem(cardToken);
        if (localStr) {
          recipientData = JSON.parse(localStr);
          renderStoryViewer(recipientData);
          return;
        }
      }
      showToast('새 초대장을 작성하시거나 최근 생성된 초대장을 확인하세요.', false);
    }
  }

  // STORY PAGER ENGINE WITH CUSTOM DROPDOWN POPULATION
  function renderStoryViewer(data) {
    landingMode.classList.add('hidden');
    appHeader.classList.remove('hidden');
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
        const photoImgs = item.p.map(src => `<img src="${src}" class="gallery-photo-item" alt="분위기 사진">`).join('');
        galleryHtml = `<div class="story-photo-gallery">${photoImgs}</div>`;
      }

      const linkBox = item.u ? `
        <div class="story-link-box">
          <a href="${item.u}" target="_blank" rel="noopener noreferrer" class="btn-story-link">
            <i class="fa-solid fa-map-location-dot"></i> 가게/지도 정보 보러가기 (새창)
          </a>
        </div>
      ` : '';

      slide.innerHTML = `
        <span class="story-header-tag">${currentStoryIndex + 1}차 코스 - ${item.t}</span>
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

      const appKey = KAKAO_APP_KEY || window.KAKAO_APP_KEY || '';

      // Check Kakao SDK & Key
      if (window.Kakao && appKey) {
        if (!window.Kakao.isInitialized()) {
          try {
            window.Kakao.init(appKey);
          } catch (e) {
            console.error('Kakao init error:', e);
          }
        }

        if (window.Kakao.isInitialized()) {
          const sender = document.getElementById('senderName').value.trim() || '신청자';
          const receiver = document.getElementById('receiverName').value.trim() || '상대방';
          const dateVal = document.getElementById('date').value;
          const areaVal = document.getElementById('mainArea').value.trim() || '데이트 장소';
          const formattedDate = formatDateString(dateVal);

          // Guarantee link URL uses registered HTTPS domain for Kakao API
          let targetShareUrl = generatedShareUrl;
          if (!targetShareUrl.startsWith('http://') && !targetShareUrl.startsWith('https://')) {
            targetShareUrl = 'https://gksxogksxo1001-sketch.github.io/Date/' + (targetShareUrl.includes('?') ? targetShareUrl.substring(targetShareUrl.indexOf('?')) : '');
          }

          window.Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
              title: `💌 ${sender}님이 보낸 감성 데이트 초대장 💖`,
              description: `${receiver}야! ${formattedDate}에 ${areaVal}에서 만나자! 🌿`,
              imageUrl: 'https://gksxogksxo1001-sketch.github.io/Date/assets/restaurant.jpg',
              link: {
                mobileWebUrl: targetShareUrl,
                webUrl: targetShareUrl,
              },
            },
            buttons: [
              {
                title: '스토리 초대장 확인하기 💖',
                link: {
                  mobileWebUrl: targetShareUrl,
                  webUrl: targetShareUrl,
                },
              },
            ],
          });
          showToast('카카오톡 공유창이 열렸습니다! 💬');
          return;
        }
      }

      // Fallback if Kakao Key is not set or not initialized yet
      const senderName = document.getElementById('senderName').value.trim() || '신청자';
      const textToCopy = `[DateCard 초대장 💌]\n${senderName}님이 보낸 데이트 초대장이 도착했습니다! 💖\n아래 링크를 눌러 스토리로 확인해 보세요 🌿\n\n${generatedShareUrl}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            showToast('카톡 공유 문구+링크가 복사되었습니다! 카톡창에 [붙여넣기]해 보세요 💬');
          });
      } else {
        showToast('초대장 링크가 복사되었습니다! 카톡에 붙여넣어 보세요 💬');
      }
    });
  }

  // Accept & Feedback Handlers
  acceptBtn.addEventListener('click', () => {
    const sender = recipientData ? recipientData.s : '신청자';
    acceptModalTitle.textContent = '🎉 데이트 약속을 수락하셨습니다! 🌿';
    acceptModalDesc.textContent = `${sender}님과의 설레는 데이트 약속이 확정되었습니다! 약속 시간과 코스 장소를 캡처하여 간직해 보세요 💖`;
    acceptOverlay.classList.remove('hidden');
    
    // Trigger Romantic Heart & Confetti Explosion Animation
    triggerRomanticConfetti();
  });

  if (downloadCardBtn) {
    downloadCardBtn.addEventListener('click', downloadCardImage);
  }
  if (downloadModalCardBtn) {
    downloadModalCardBtn.addEventListener('click', downloadCardImage);
  }

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
    const textToCopy = `[DatePlanner 코스 조정 요청 💬]\n${sender}아! 데이트 신청 잘 봤어 🌿\n\n📌 요청 코스: ${selectedTarget}\n💌 제안 내용: ${reqMsg}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          showToast('조정 요청 문구가 복사되었습니다! 카톡으로 전송해 보세요 💬');
          feedbackModal.classList.add('hidden');
        });
    } else {
      showToast('요청 내용이 준비되었습니다! 카톡으로 소통해 보세요 💬');
      feedbackModal.classList.add('hidden');
    }
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
