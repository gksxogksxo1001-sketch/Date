// ====================================================
// ARCHIVE-SERVICE.JS — 데이트 카드 로컬 스토리지 보관 및 Supabase 클라우드 동기화
// ====================================================
import { CONFIG } from './config.js';
import { showToast, formatDateString, copyToClipboard, safeLocalStorageSet } from './utils.js';
import { sendKakaoFeed } from './kakao-share.js';
import { getSupabaseClient } from './supabase-client.js';
import { AuthService } from './auth-service.js';

export const ArchiveService = {
  STORAGE_KEY: CONFIG.STORAGE_ARCHIVES || 'dateplanner_archives',
  _calendarService: null,
  _openCardHandler: null,

  setDependencies({ calendarService, openCardHandler } = {}) {
    if (calendarService) this._calendarService = calendarService;
    if (openCardHandler) this._openCardHandler = openCardHandler;
  },

  getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Archive load error:', e);
      return [];
    }
  },

  // 로그인된 현재 사용자의 카드만 반환 (미로그인 시 빈 배열 반환하여 타인 데이터 및 캐시 누출 방지)
  getUserCards() {
    if (!AuthService.currentUser || !AuthService.currentUser.id) {
      return [];
    }
    const currentUid = AuthService.currentUser.id;
    const all = this.getAll();
    return all.filter(item => item.userId === currentUid);
  },

  // 미로그인 상태에서 작성된 게스트 카드를 현재 로그인한 계정으로 소유권 이전 및 Supabase 동기화
  async claimGuestCards(userId) {
    if (!userId) return;
    const list = this.getAll();
    let updated = false;
    const claimedItems = [];

    list.forEach(item => {
      if (!item.userId || item.userId === 'guest') {
        item.userId = userId;
        updated = true;
        claimedItems.push(item);
      }
    });

    if (updated) {
      safeLocalStorageSet(this.STORAGE_KEY, JSON.stringify(list));

      // Supabase 클라우드에 소유권 이전된 카드 동기화
      const supabaseClient = getSupabaseClient();
      if (supabaseClient && claimedItems.length > 0) {
        for (const item of claimedItems) {
          try {
            const dbRow = {
              id: item.id,
              user_id: userId,
              sender_name: item.senderName,
              receiver_name: item.receiverName,
              date_val: item.date,
              area: item.area,
              budget: item.budget,
              message: item.message,
              theme: item.theme,
              courses: item.courses,
              share_url: item.shareUrl,
              created_at: new Date(item.createdAt || Date.now()).toISOString(),
              is_accepted: !!item.isAccepted,
              accepted_at: item.acceptedAt ? new Date(item.acceptedAt).toISOString() : null
            };
            await supabaseClient.from('date_cards').upsert(dbRow);
          } catch (err) {
            console.warn('Failed to upsert claimed card to Supabase:', err);
          }
        }
      }
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
        safeLocalStorageSet(this.STORAGE_KEY, JSON.stringify(uniqueList));
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

    if (list.length > (CONFIG.MAX_ARCHIVE_SIZE || 50)) {
      list.length = CONFIG.MAX_ARCHIVE_SIZE || 50;
    }

    safeLocalStorageSet(this.STORAGE_KEY, JSON.stringify(list));

    this.updateCountBadge();

    // Cloud Sync to Supabase
    const supabaseClient = getSupabaseClient();
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
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient || !AuthService.currentUser) return;
    try {
      const { data, error } = await supabaseClient
        .from('date_cards')
        .select('*')
        .eq('user_id', AuthService.currentUser.id)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
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
            userId: row.user_id,
            isAccepted: !!row.is_accepted,
            acceptedAt: row.accepted_at ? new Date(row.accepted_at).getTime() : null
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
        }
        this.loadAndRender();
      }
    } catch (e) {
      console.warn('Supabase cloud sync error:', e);
    }
  },

  async delete(cardId) {
    let list = this.getAll();
    list = list.filter(item => item.id !== cardId);
    safeLocalStorageSet(this.STORAGE_KEY, JSON.stringify(list));
    try {
      localStorage.removeItem(cardId);
    } catch (e) {}
    this.loadAndRender();

    // Cloud delete from Supabase
    const supabaseClient = getSupabaseClient();
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
      safeLocalStorageSet(this.STORAGE_KEY, JSON.stringify(list));
    }

    const supabaseClient = getSupabaseClient();
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
    const archiveCountBadge = document.getElementById('archiveCountBadge');
    if (!archiveCountBadge) return;

    // 미로그인 시 타인의 캐시나 게스트 데이터가 뱃지에 노출되지 않도록 완전 숨김
    if (!AuthService.currentUser) {
      archiveCountBadge.classList.add('hidden');
      return;
    }

    const list = this.getUserCards();
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
    const archiveCardsGrid = document.getElementById('archiveCardsGrid');
    const archiveEmptyState = document.getElementById('archiveEmptyState');
    const archiveLoginRequiredState = document.getElementById('archiveLoginRequiredState');
    const archiveUserStatusText = document.getElementById('archiveUserStatusText');
    if (!archiveCardsGrid || !archiveEmptyState) return;

    // 1. 미로그인 상태인 경우: 타인의 로컬 캐시 카드 절대 노출 방지 & 로그인 필요 화면 렌더링
    if (!AuthService.currentUser) {
      archiveCardsGrid.innerHTML = '';
      archiveCardsGrid.classList.add('hidden');
      archiveEmptyState.classList.add('hidden');
      if (archiveLoginRequiredState) {
        archiveLoginRequiredState.classList.remove('hidden');
      }
      if (archiveUserStatusText) {
        archiveUserStatusText.textContent = '카카오 로그인 후 내 데이트 보관함을 이용하실 수 있습니다.';
      }
      return;
    }

    // 2. 로그인된 경우: 로그인 안내 숨김 & 내 유저 전용 카드 렌더링
    if (archiveLoginRequiredState) {
      archiveLoginRequiredState.classList.add('hidden');
    }
    archiveCardsGrid.classList.remove('hidden');

    if (archiveUserStatusText) {
      archiveUserStatusText.innerHTML = `<span class="badge-online">●</span> <strong>${AuthService.currentUser.nickname}</strong>님의 Supabase 클라우드에 안전하게 보관 중입니다.`;
    }

    const list = this.getUserCards();
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

      const receiverDisplay = (item.receiverName || '소중한 분').trim();
      const senderDisplay = (item.senderName || '익명').trim();
      const courseSummary = (item.courses || []).map((c, i) => `${i + 1}차: ${c.n || '장소'}`).join(' ➔ ') || '코스 정보 없음';
      const createdDateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '최근 생성';
      const targetDateStr = item.date ? formatDateString(item.date) : '날짜 미정';
      const areaDisplay = item.area ? item.area : '데이트 장소';
      const budgetDisplay = item.budget ? item.budget : '예산 미정';
      const themeLabel = item.theme === 'rose' ? '🌹 Romantic Rose' : (item.theme === 'midnight' ? '🌙 Midnight Navy' : '🌿 Warm Cozy');
      const acceptBadge = item.isAccepted ? `<div class="archive-status-badge accepted"><i class="fa-solid fa-heart"></i> 상대방 수락 완료!</div>` : '';

      // 안전한 공유 URL 확보 (너무 길거나 없을 시 ID 기반 fallback)
      let safeShareUrl = item.shareUrl;
      if (!safeShareUrl || safeShareUrl.length > 1500) {
        safeShareUrl = `${CONFIG.BASE_URL}#card=${item.id}`;
      }

      cardEl.innerHTML = `
        <div class="archive-card-header">
          <div style="display:flex; align-items:center; gap:6px;">
            <div class="archive-theme-pill">${themeLabel}</div>
            ${acceptBadge}
          </div>
          <span class="archive-date-tag">${createdDateStr} 생성</span>
        </div>
        <div class="archive-card-body">
          <h4 class="archive-card-title">To. <strong>${receiverDisplay}</strong> <span style="font-weight:400; font-size:0.88rem; color:var(--text-muted);">(From. ${senderDisplay})</span></h4>
          <div class="archive-meta">
            <span><i class="fa-regular fa-calendar-check"></i> ${targetDateStr}</span>
            <span><i class="fa-solid fa-location-dot"></i> ${areaDisplay}</span>
            <span><i class="fa-solid fa-wallet"></i> ${budgetDisplay}</span>
          </div>
          <div class="archive-courses-preview">
            <i class="fa-solid fa-route"></i> <span>${courseSummary}</span>
          </div>
        </div>
        <div class="archive-card-actions">
          <button type="button" class="btn-archive-action btn-view" title="스토리 초대장 열기" onclick="window.viewArchiveCard('${safeShareUrl}')">
            <i class="fa-solid fa-eye"></i> 열기
          </button>
          <button type="button" class="btn-archive-action btn-copy" title="공유 링크 복사" onclick="window.copyArchiveLink('${safeShareUrl}')">
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

// Global handlers for archive cards action buttons
window.viewArchiveCard = function(shareUrl) {
  const archiveModal = document.getElementById('archiveModal');
  if (archiveModal) archiveModal.classList.add('hidden');
  if (ArchiveService._openCardHandler) {
    ArchiveService._openCardHandler(shareUrl);
  } else if (window.openCardFromShareUrl) {
    window.openCardFromShareUrl(shareUrl);
  }
};

window.copyArchiveLink = function(shareUrl) {
  copyToClipboard(shareUrl, '초대장 링크가 복사되었습니다! 🌿');
};

window.shareArchiveKakao = function(cardId) {
  const item = ArchiveService.getAll().find(c => c.id === cardId);
  if (!item) return;

  const sender = (item.senderName || '누군가').trim();
  const receiver = (item.receiverName || '너').trim();
  const areaStr = (item.area || '우리만의 특별한 장소').trim();
  const dateStr = item.date ? formatDateString(item.date) : '설레는 날';

  // URL 길이가 너무 길거나(Base64 이미지 포함 등) 유효하지 않은 경우 안전한 ID 기반 URL 사용
  let targetUrl = item.shareUrl;
  if (!targetUrl || targetUrl.length > 1500) {
    targetUrl = `${CONFIG.BASE_URL}#card=${item.id}`;
  }

  sendKakaoFeed({
    title: `💌 ${sender}님이 보낸 감성 데이트 초대장 💖`,
    description: `${receiver}야! ${dateStr}에 ${areaStr}에서 만나자! 🌿`,
    imageUrl: CONFIG.DEFAULT_OG_IMAGE,
    webUrl: targetUrl,
    buttonTitle: '스토리 초대장 확인하기 💖',
    fallbackText: `[DateCard 초대장 💌]\n${sender}님이 보낸 데이트 초대장:\n${targetUrl}`,
    toastMsg: '카카오톡 공유창이 열렸습니다! 💬'
  });
};

window.deleteArchiveItem = function(cardId) {
  if (confirm('이 데이트 초대장을 보관함에서 삭제하시겠습니까?')) {
    ArchiveService.delete(cardId);
    if (ArchiveService._calendarService) {
      ArchiveService._calendarService.render();
    }
  }
};
