// ====================================================
// AUTH-SERVICE.JS — 카카오 OAuth 및 Supabase 인증 세션 관리
// ====================================================
import { CONFIG } from './config.js';
import { showToast } from './utils.js';

export const AuthService = {
  currentUser: null,
  _archiveService: null,
  _calendarService: null,

  setDependencies({ archiveService, calendarService } = {}) {
    if (archiveService) this._archiveService = archiveService;
    if (calendarService) this._calendarService = calendarService;
  },

  async init() {
    this.loadSession();
    this.renderUI();
    await this.checkAuthCode();
    if (this.currentUser && this._archiveService) {
      await this._archiveService.claimGuestCards(this.currentUser.id);
      await this._archiveService.syncCloud();
    }
  },

  loadSession() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_USER || 'dateplanner_user');
      if (saved) {
        this.currentUser = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load user session', e);
    }
  },

  async saveSession(user) {
    this.currentUser = user;
    try {
      if (user) {
        localStorage.setItem(CONFIG.STORAGE_USER || 'dateplanner_user', JSON.stringify(user));
      } else {
        localStorage.removeItem(CONFIG.STORAGE_USER || 'dateplanner_user');
      }
    } catch (e) {
      console.warn('Failed to save session', e);
    }
    this.renderUI();

    if (this._archiveService) {
      if (user) {
        await this._archiveService.claimGuestCards(user.id);
        await this._archiveService.syncCloud();
      }
      this._archiveService.loadAndRender();
    }

    if (this._calendarService) {
      this._calendarService.render();
    }
  },

  login() {
    let redirectUri = CONFIG.BASE_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      redirectUri = window.location.origin + window.location.pathname;
    }

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${CONFIG.KAKAO_REST_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile_nickname,profile_image`;
    window.location.href = kakaoAuthUrl;
  },

  async checkAuthCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) return;

    let redirectUri = CONFIG.BASE_URL;
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
          client_id: CONFIG.KAKAO_REST_KEY,
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
      const profile = (res.kakao_account && res.kakao_account.profile) || {};
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
    const kakaoLoginBtn = document.getElementById('kakaoLoginBtn');
    const userProfileNav = document.getElementById('userProfileNav');
    const userAvatarImg = document.getElementById('userAvatarImg');
    const userNicknameSpan = document.getElementById('userNicknameSpan');
    const archiveUserStatusText = document.getElementById('archiveUserStatusText');
    const openCalendarNavBtn = document.getElementById('openCalendarNavBtn');
    const calendarModal = document.getElementById('calendarModal');

    if (this.currentUser) {
      if (kakaoLoginBtn) kakaoLoginBtn.classList.add('hidden');
      if (userProfileNav) userProfileNav.classList.remove('hidden');
      if (userAvatarImg) userAvatarImg.src = this.currentUser.profileImage || 'assets/favicon.png';
      if (userNicknameSpan) userNicknameSpan.textContent = this.currentUser.nickname;
      if (archiveUserStatusText) {
        archiveUserStatusText.innerHTML = `<span class="badge-online">●</span> <strong>${this.currentUser.nickname}</strong>님의 Supabase 클라우드에 안전하게 보관 중입니다.`;
      }
      if (openCalendarNavBtn) openCalendarNavBtn.classList.remove('hidden');
    } else {
      if (kakaoLoginBtn) kakaoLoginBtn.classList.remove('hidden');
      if (userProfileNav) userProfileNav.classList.add('hidden');
      if (archiveUserStatusText) {
        archiveUserStatusText.textContent = '카카오 로그인 후 내 데이트 보관함을 이용하실 수 있습니다.';
      }
      if (openCalendarNavBtn) openCalendarNavBtn.classList.add('hidden');
      if (calendarModal) calendarModal.classList.add('hidden');
    }

    if (this._archiveService) {
      this._archiveService.updateCountBadge();
    }
  }
};
