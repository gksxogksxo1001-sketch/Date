// ====================================================
// LIVE-PREVIEW.JS — PC 와이드 2열 화면 실시간 스마트폰 프리뷰 동기화
// ====================================================
import { formatDateString } from './utils.js';
import { coursePhotosMap } from './course-form.js';

export const LivePreview = {
  init() {
    this.bindEvents();
    this.update();
  },

  bindEvents() {
    const inputs = [
      'senderName', 'receiverName', 'mainArea', 'selectedBudget',
      'message', 'selectedTheme', 'date'
    ];

    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.update());
        el.addEventListener('change', () => this.update());
      }
    });

    // Theme Picker clicks
    const themePicker = document.getElementById('themePicker');
    if (themePicker) {
      themePicker.addEventListener('click', () => {
        setTimeout(() => this.update(), 60);
      });
    }

    // Course list changes (delegated listener on container)
    const courseList = document.getElementById('courseList');
    if (courseList) {
      courseList.addEventListener('input', () => this.update());
      courseList.addEventListener('change', () => this.update());
    }

    // Add course button clicks
    const addCourseBtn = document.getElementById('addCourseBtn');
    if (addCourseBtn) {
      addCourseBtn.addEventListener('click', () => {
        setTimeout(() => this.update(), 60);
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

    // 5. First Course Preview
    const courseList = document.getElementById('courseList');
    const firstCourseCard = courseList ? courseList.querySelector('.course-item-card') : null;
    
    const mockupCourseType = document.getElementById('mockupCourseType');
    const mockupCourseName = document.getElementById('mockupCourseName');
    const mockupCourseTime = document.getElementById('mockupCourseTime');
    const mockupCourseTip = document.getElementById('mockupCourseTip');
    const mockupImgPreview = document.getElementById('mockupImgPreview');

    if (firstCourseCard) {
      const type = firstCourseCard.querySelector('.course-type')?.value || '🍽️ 맛집/식사';
      const time = firstCourseCard.querySelector('.course-time')?.value || '18:00';
      const name = (firstCourseCard.querySelector('.course-name')?.value || '').trim() || '성수동 감성 다이닝';
      const tip = (firstCourseCard.querySelector('.course-tip')?.value || '').trim() || '창가 예약석 완료 🌿';
      const photos = coursePhotosMap[0] || [];

      if (mockupCourseType) mockupCourseType.textContent = type;
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
