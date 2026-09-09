// ====================================================
// ARCHIVE-SERVICE.JS — 데이트 카드 로컬 스토리지 보관 및 Supabase 클라우드 동기화
// ====================================================
import { CONFIG } from './config.js';
import { showToast, formatDateString, copyToClipboard } from './utils.js';
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

    if (list.length > (CONFIG.MAX_ARCHIVE_SIZE || 50)) {
      list.length = CONFIG.MAX_ARCHIVE_SIZE || 50;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Archive save error:', e);
    }

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
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
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
    const archiveCardsGrid = document.getElementById('archiveCardsGrid');
    const archiveEmptyState = document.getElementById('archiveEmptyState');
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

  sendKakaoFeed({
    title: `💌 ${item.senderName}님이 보낸 감성 데이트 초대장 💖`,
    description: `${item.receiverName}야! ${formatDateString(item.date)}에 ${item.area}에서 만나자! 🌿`,
    imageUrl: CONFIG.DEFAULT_OG_IMAGE,
    webUrl: item.shareUrl,
    buttonTitle: '스토리 초대장 확인하기 💖',
    fallbackText: `[DateCard 초대장 💌]\n${item.senderName}님이 보낸 데이트 초대장:\n${item.shareUrl}`,
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
