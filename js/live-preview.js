// ====================================================
// LIVE-PREVIEW.JS — PC 와이드 2열 화면 실시간 스마트폰 프리뷰 동기화
// ====================================================
import { formatDateString } from './utils.js';
import { coursePhotosMap, getActiveCourseFormIndex } from './course-form.js';

export const LivePreview = {
  _rafId: null,

  init() {
    this.bindEvents();
    this.scheduleUpdate();
  },

  scheduleUpdate() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = requestAnimationFrame(() => {
      this.update();
      this._rafId = null;
    });
  },

  bindEvents() {
    const inputs = [
      'senderName', 'receiverName', 'mainArea', 'selectedBudget',
      'message', 'selectedTheme', 'date'
    ];

    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.scheduleUpdate());
        el.addEventListener('change', () => this.scheduleUpdate());
      }
    });

    // Theme Picker clicks
    const themePicker = document.getElementById('themePicker');
    if (themePicker) {
      themePicker.addEventListener('click', () => {
        setTimeout(() => this.scheduleUpdate(), 10);
      });
    }

    // Budget chips clicks
    const budgetChips = document.getElementById('budgetChips');
    if (budgetChips) {
      budgetChips.addEventListener('click', () => {
        setTimeout(() => this.scheduleUpdate(), 10);
      });
    }

    // Course list changes (delegated listener on container for text inputs & selects)
    const courseList = document.getElementById('courseList');
    if (courseList) {
      courseList.addEventListener('input', () => this.scheduleUpdate());
      courseList.addEventListener('change', () => this.scheduleUpdate());
    }

    // Listen to custom course events
    window.addEventListener('course-page-change', () => {
      this.scheduleUpdate();
    });

    window.addEventListener('course-photo-change', () => {
      this.scheduleUpdate();
    });

    // Add course button clicks
    const addCourseBtn = document.getElementById('addCourseBtn');
    if (addCourseBtn) {
      addCourseBtn.addEventListener('click', () => {
        setTimeout(() => this.scheduleUpdate(), 20);
      });
    }
  },

  update() {
    const screen = document.getElementById('smartphoneScreenBody');
    if (!screen) return;

    const senderName = (document.getElementById('senderName')?.value || '').trim() || '민우';
    const receiverName = (document.getElementById('receiverName')?.value || '').trim() || '수진이';
    const dateVal = document.getElementById('date')?.value || '2026-09-11';
    const mainArea = (document.getElementById('mainArea')?.value || '').trim() || '성수동 / 연남동';
    const budget = document.getElementById('selectedBudget')?.value || '5~10만원';
    const message = (document.getElementById('message')?.value || '').trim() || '너와 함께하는 날은 언제나 특별해. 맛있는 밥 먹고 예쁜 카페 가자! 💖';
    const theme = document.getElementById('selectedTheme')?.value || 'cozy';

    // 1. Theme Class & Badge
    screen.className = `smartphone-screen-body theme-${theme}`;
    const mockupThemeBadge = document.getElementById('mockupThemeBadge');
    if (mockupThemeBadge) {
      mockupThemeBadge.textContent = theme === 'rose' ? '💖 Romantic Rose' : (theme === 'midnight' ? '🌙 Midnight Navy' : '🌿 Warm Cozy');
    }

    // 2. Sender & Receiver
    const mockupReceiverName = document.getElementById('mockupReceiverName');
    if (mockupReceiverName) mockupReceiverName.textContent = receiverName;

    const mockupSenderName = document.getElementById('mockupSenderName');
    if (mockupSenderName) mockupSenderName.textContent = senderName;

    // 3. Meta Row
    const mockupDateText = document.getElementById('mockupDateText');
    if (mockupDateText) mockupDateText.textContent = formatDateString(dateVal);

    const mockupAreaText = document.getElementById('mockupAreaText');
    if (mockupAreaText) mockupAreaText.textContent = mainArea;

    const mockupBudgetText = document.getElementById('mockupBudgetText');
    if (mockupBudgetText) mockupBudgetText.textContent = budget;

    // 4. Message
    const mockupMessageText = document.getElementById('mockupMessageText');
    if (mockupMessageText) mockupMessageText.textContent = message;

    // 5. Active Course Preview (Synchronized with currently viewed course card in form)
    const courseList = document.getElementById('courseList');
    const cards = courseList ? Array.from(courseList.querySelectorAll('.course-item-card')) : [];
    const activeIdx = typeof getActiveCourseFormIndex === 'function' ? getActiveCourseFormIndex() : 0;
    const targetCard = cards[activeIdx] || cards[0];

    // Update Progress Bar step dots in mockup
    const progressBar = document.querySelector('.mockup-progress-bar');
    if (progressBar && cards.length > 0) {
      progressBar.innerHTML = '';
      cards.forEach((_, idx) => {
        const dot = document.createElement('span');
        dot.className = `mockup-step-dot ${idx === activeIdx ? 'active' : ''}`;
        progressBar.appendChild(dot);
      });
    }

    const mockupCourseType = document.getElementById('mockupCourseType');
    const mockupCourseName = document.getElementById('mockupCourseName');
    const mockupCourseTime = document.getElementById('mockupCourseTime');
    const mockupCourseTip = document.getElementById('mockupCourseTip');
    const mockupImgPreview = document.getElementById('mockupImgPreview');

    if (targetCard) {
      const type = targetCard.querySelector('.course-type')?.value || '🍽️ 맛집/식사';
      const time = targetCard.querySelector('.course-time')?.value || '18:00';
      const name = (targetCard.querySelector('.course-name')?.value || '').trim() || `${activeIdx + 1}차 데이트 코스`;
      const tip = (targetCard.querySelector('.course-tip')?.value || '').trim() || '특별한 데이트 메모 🌿';
      const photos = coursePhotosMap[activeIdx] || [];

      if (mockupCourseType) mockupCourseType.textContent = `${activeIdx + 1}차 · ${type}`;
      if (mockupCourseName) mockupCourseName.textContent = name;
      if (mockupCourseTime) mockupCourseTime.textContent = time;
      if (mockupCourseTip) mockupCourseTip.textContent = tip;

      if (mockupImgPreview) {
        if (photos.length > 0) {
          mockupImgPreview.style.backgroundImage = `url('${photos[0]}')`;
        } else if (type.includes('카페')) {
          mockupImgPreview.style.backgroundImage = "url('assets/cafe.jpg')";
        } else if (type.includes('산책') || type.includes('야경')) {
          mockupImgPreview.style.backgroundImage = "url('assets/walk.jpg')";
        } else {
          mockupImgPreview.style.backgroundImage = "url('assets/restaurant.jpg')";
        }
      }
    }
  }
};
