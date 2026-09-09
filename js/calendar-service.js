// ====================================================
// CALENDAR-SERVICE.JS — 데이트 캘린더 모달 및 일정 관리
// ====================================================
import { CONFIG } from './config.js';
import { showToast } from './utils.js';
import { ArchiveService } from './archive-service.js';
import { AuthService } from './auth-service.js';

export const CalendarService = {
  baseYear: new Date().getFullYear(),
  baseMonth: new Date().getMonth(), // 0 ~ 11
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  selectedDateKey: null, // 'YYYY-MM-DD'
  _openCardHandler: null,

  setDependencies({ openCardHandler } = {}) {
    if (openCardHandler) this._openCardHandler = openCardHandler;
  },

  init() {
    const calPrevBtn = document.getElementById('calPrevBtn');
    const calNextBtn = document.getElementById('calNextBtn');
    const calTodayQuickBtn = document.getElementById('calTodayQuickBtn');
    const openCalendarNavBtn = document.getElementById('openCalendarNavBtn');
    const closeCalendarModalBtn = document.getElementById('closeCalendarModalBtn');
    const closeCalendarBottomBtn = document.getElementById('closeCalendarBottomBtn');

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
    const calendarDaysGrid = document.getElementById('calendarDaysGrid');
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
    const calendarModal = document.getElementById('calendarModal');
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
    const calendarModal = document.getElementById('calendarModal');
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
    const maxRange = CONFIG.CALENDAR_MONTH_RANGE || 2;
    if (offset < -maxRange || offset > maxRange) return; // 최대 ±2개월 제한

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
    const eventsMap = new Map();

    const currentUid = AuthService.currentUser ? AuthService.currentUser.id : '';
    const currentNickname = AuthService.currentUser ? (AuthService.currentUser.nickname || '').trim().toLowerCase() : '';

    allArchives.forEach(item => {
      const dateKey = this.parseDateKey(item.date);
      if (!dateKey) return;

      const sName = (item.senderName || '').trim().toLowerCase();
      
      let isSentByMe = false;
      if (item.userId && currentUid && item.userId === currentUid) {
        isSentByMe = true;
      } else if (currentNickname && sName === currentNickname) {
        isSentByMe = true;
      } else if (!item.userId || item.userId === 'guest') {
        isSentByMe = true;
      }

      const chipTitle = (item.courses && item.courses[0] && item.courses[0].n)
        ? item.courses[0].n
        : (item.area || '데이트');

      const eventItem = {
        raw: item,
        dateKey,
        isSentByMe,
        partnerName: isSentByMe ? item.receiverName : item.senderName,
        title: isSentByMe ? `To. ${item.receiverName} 데이트` : `From. ${item.senderName} 데이트`,
        chipTitle,
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
    const calendarDaysGrid = document.getElementById('calendarDaysGrid');
    const calMonthTitle = document.getElementById('calMonthTitle');
    const calPrevBtn = document.getElementById('calPrevBtn');
    const calNextBtn = document.getElementById('calNextBtn');
    if (!calendarDaysGrid || !calMonthTitle) return;

    calMonthTitle.textContent = `${this.viewYear}년 ${this.viewMonth + 1}월`;
    
    const maxRange = CONFIG.CALENDAR_MONTH_RANGE || 2;
    const currentOffset = this.getMonthOffset(this.viewYear, this.viewMonth);
    if (calPrevBtn) calPrevBtn.disabled = currentOffset <= -maxRange;
    if (calNextBtn) calNextBtn.disabled = currentOffset >= maxRange;

    const eventsMap = this.getEventsMap();
    const today = new Date();
    const todayKey = this.formatDateKey(today);

    calendarDaysGrid.innerHTML = '';

    const firstDayOfWeek = new Date(this.viewYear, this.viewMonth, 1).getDay();
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

      // 접근성 향상
      cell.setAttribute('role', 'button');
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('aria-label', `${this.viewYear}년 ${this.viewMonth + 1}월 ${day}일 일정 선택`);

      let chipsHtml = '';
      const dayEvents = eventsMap.get(dateKey) || [];
      if (dayEvents.length > 0) {
        chipsHtml = `<div class="cal-events-container">`;
        dayEvents.slice(0, 2).forEach(ev => {
          const chipClass = ev.isSentByMe ? 'chip-sent' : 'chip-received';
          chipsHtml += `
              <div class="cal-event-chip ${chipClass}" title="${ev.isSentByMe ? '내가 보낸 데이트' : '내가 받은 초대'}">
                ${ev.chipTitle}
              </div>`;
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

      const selectHandler = () => {
        this.selectedDateKey = dateKey;
        document.querySelectorAll('.cal-day-box').forEach(c => c.classList.remove('is-selected'));
        cell.classList.add('is-selected');
        this.renderSelectedDetails(dateKey, dayEvents);
      };

      cell.addEventListener('click', selectHandler);
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectHandler();
        }
      });

      calendarDaysGrid.appendChild(cell);
    }

    // 다음 달 잔여 빈 칸 채우기
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
    const calSelectedDateLabel = document.getElementById('calSelectedDateLabel');
    const calSelectedEventsList = document.getElementById('calSelectedEventsList');
    const calSelectedCountBadge = document.getElementById('calSelectedCountBadge');
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
        if (this._openCardHandler) {
          this._openCardHandler(ev.shareUrl);
        } else if (window.openCardFromShareUrl) {
          window.openCardFromShareUrl(ev.shareUrl);
        }
      });

      calSelectedEventsList.appendChild(card);
    });
  }
};
