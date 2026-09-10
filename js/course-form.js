// ====================================================
// COURSE-FORM.JS — 데이트 코스 작성 폼, 드롭다운, 타임피커, 갤러리 업로드
// ====================================================
import { CONFIG } from './config.js';
import { showToast } from './utils.js';

export const COURSE_TYPE_OPTIONS = [
  { value: '🍽️ 맛집/식사', label: '🍽️ 맛있는 식사 · 다이닝' },
  { value: '☕ 카페/디저트', label: '☕ 감성 카페 & 디저트' },
  { value: '🎨 전시/놀거리/문화', label: '🎨 전시회 · 문화 & 놀거리' },
  { value: '✨ 산책/야경', label: '🌙 로맨틱 야경 & 산책' },
  { value: '🍷 술집/와인바', label: '🍷 와인바 · 칵테일 & 펍' },
  { value: '🎡 액티비티/체험', label: '🎡 이색 체험 & 액티비티' },
  { value: '📍 기타 장소', label: '📍 나만의 특별한 장소' }
];

export const coursePhotosMap = {}; // index: Array<dataUrl>

export function getMatchedCourseOption(val) {
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

// 1. Custom Calendar Picker for Date Input
export function initCustomCalendar() {
  const wrapper = document.getElementById('customDatePickerWrapper');
  const trigger = document.getElementById('datepickerTrigger');
  const dateDisplay = document.getElementById('dateDisplay');
  const hiddenDate = document.getElementById('date');
  const popup = document.getElementById('customCalendarPopup');
  const prevBtn = document.getElementById('calPrevMonthBtn');
  const nextBtn = document.getElementById('calNextMonthBtn');
  const monthText = document.getElementById('calMonthText');
  const daysGrid = document.getElementById('calDaysGrid');

  const quickToday = document.getElementById('calQuickToday');
  const quickTomorrow = document.getElementById('calQuickTomorrow');
  const quickWeekend = document.getElementById('calQuickWeekend');

  if (!trigger || !popup || !hiddenDate) return;

  let calCurrentYear = new Date().getFullYear();
  let calCurrentMonth = new Date().getMonth();
  let calSelectedDate = null;

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
    
    if (hiddenDate) hiddenDate.value = toDateString(calSelectedDate);
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
        window.setSelectedCalendarDate(cellDate);
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
    document.querySelectorAll('.custom-timepicker-popup').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.timepicker-input-box').forEach(b => b.classList.remove('open'));

    if (calSelectedDate) {
      calCurrentYear = calSelectedDate.getFullYear();
      calCurrentMonth = calSelectedDate.getMonth();
    }
    if (popup) popup.classList.remove('hidden');
    if (trigger) trigger.classList.add('open');
    renderCalendarDays();
  }

  function closeCalendar() {
    if (popup) popup.classList.add('hidden');
    if (trigger) trigger.classList.remove('open');
  }

  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (popup && popup.classList.contains('hidden')) {
        openCalendar();
      } else {
        closeCalendar();
      }
    });
  }

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
      window.setSelectedCalendarDate(new Date());
      closeCalendar();
    });
  }

  if (quickTomorrow) {
    quickTomorrow.addEventListener('click', (e) => {
      e.stopPropagation();
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      window.setSelectedCalendarDate(tom);
      closeCalendar();
    });
  }

  if (quickWeekend) {
    quickWeekend.addEventListener('click', (e) => {
      e.stopPropagation();
      const d = new Date();
      const diff = (6 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      window.setSelectedCalendarDate(d);
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
  window.setSelectedCalendarDate(defTomorrow);
}

// 2. Theme Picker Handler
export function initThemePicker() {
  const themePicker = document.getElementById('themePicker');
  const selectedTheme = document.getElementById('selectedTheme');
  const appBody = document.body;
  if (!themePicker || !selectedTheme) return;

  themePicker.addEventListener('click', (e) => {
    const card = e.target.closest('.theme-card');
    if (!card) return;

    document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    const themeVal = card.getAttribute('data-theme');
    selectedTheme.value = themeVal;
    appBody.className = `theme-${themeVal}`;
  });
}

// 3. Budget Chips Handler
export function initBudgetChips() {
  const budgetChips = document.getElementById('budgetChips');
  const selectedBudget = document.getElementById('selectedBudget');
  if (!budgetChips || !selectedBudget) return;

  budgetChips.addEventListener('click', (e) => {
    const target = e.target.closest('.chip');
    if (!target) return;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    target.classList.add('active');
    selectedBudget.value = target.getAttribute('data-value');
  });
}

// 4. Course Item Creation & Management
export function addCourseItem(
  typeVal = '🍽️ 맛집/식사', timeVal = '18:00', nameVal = '', urlVal = '', moveVal = '', tipVal = '',
  photosVal = [], placeVal = ''
) {
  const courseList = document.getElementById('courseList');
  if (!courseList) return;

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
      <button type="button" class="btn-remove-course" onclick="window.removeCourseItem(${index})">
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
          <input type="hidden" class="course-time" value="${timeVal}" required>

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
    <div class="form-row dual-row">
      <div class="form-group">
        <label><i class="fa-solid fa-pen-fancy"></i> 코스 제목 / 감성 문구</label>
        <input type="text" class="course-name" value="${nameVal}" placeholder="예: 성수동 분위기 끝판왕 와인바 🍷" required>
      </div>
      <div class="form-group">
        <label><i class="fa-solid fa-location-dot"></i> 길찾기용 실제 상호명 (선택)</label>
        <input type="text" class="course-place" value="${placeVal}" placeholder="예: 어니언 성수 (비워두면 위 코스명으로 검색)">
      </div>
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
      <label><i class="fa-solid fa-link"></i> 가게/지도 링크 (선택)</label>
      <input type="url" class="course-url" value="${urlVal}" placeholder="예: 네이버지도 / 카카오맵 공유 링크 붙여넣기">
    </div>

    <!-- LOCAL GALLERY FILE UPLOAD SECTION -->
    <div class="photo-upload-section">
      <label class="photo-upload-label" for="fileInput_${index}">
        <i class="fa-solid fa-camera"></i> 내 갤러리에서 사진 첨부하기 (최대 3장)
      </label>
      <input type="file" id="fileInput_${index}" class="photo-upload-input" accept="image/*" multiple onchange="window.handleGalleryUpload(event, ${index})">
      <div class="upload-thumbs-grid" id="thumbsGrid_${index}">
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

// 5. Custom Timepicker Binding Function
export function bindCustomTimePicker(card, initialTimeStr = '18:00') {
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

// 6. Image Compression & Gallery Upload
export function compressAndReadImage(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = CONFIG.IMAGE_MAX_DIM || 420;
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
      const compressedDataUrl = canvas.toDataURL('image/jpeg', CONFIG.IMAGE_QUALITY || 0.6);
      callback(compressedDataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

export function renderThumbs(index) {
  const grid = document.getElementById(`thumbsGrid_${index}`);
  if (!grid) return;

  grid.innerHTML = '';
  const photos = coursePhotosMap[index] || [];
  photos.forEach((src, pIdx) => {
    const thumb = document.createElement('div');
    thumb.className = 'thumb-item';
    thumb.innerHTML = `
      <img src="${src}" alt="갤러리 사진">
      <button type="button" class="btn-delete-thumb" onclick="window.deleteThumb(${index}, ${pIdx})">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    grid.appendChild(thumb);
  });
}

export function reindexCourses() {
  const courseList = document.getElementById('courseList');
  if (!courseList) return;

  const cards = courseList.querySelectorAll('.course-item-card');
  const newPhotosMap = {};
  cards.forEach((card, idx) => {
    const oldIndex = parseInt(card.getAttribute('data-index'));
    newPhotosMap[idx] = coursePhotosMap[oldIndex] || [];
    card.setAttribute('data-index', idx);
    const badge = card.querySelector('.course-badge');
    if (badge) badge.textContent = `${idx + 1}차 코스`;
    const removeBtn = card.querySelector('.btn-remove-course');
    if (removeBtn) removeBtn.setAttribute('onclick', `window.removeCourseItem(${idx})`);
    const fileInput = card.querySelector('.photo-upload-input');
    if (fileInput) {
      fileInput.id = `fileInput_${idx}`;
      fileInput.setAttribute('onchange', `window.handleGalleryUpload(event, ${idx})`);
    }
    const uploadLabel = card.querySelector('.photo-upload-label');
    if (uploadLabel) uploadLabel.setAttribute('for', `fileInput_${idx}`);
    const thumbsGrid = card.querySelector('.upload-thumbs-grid');
    if (thumbsGrid) thumbsGrid.id = `thumbsGrid_${idx}`;
  });

  Object.keys(coursePhotosMap).forEach(k => delete coursePhotosMap[k]);
  Object.assign(coursePhotosMap, newPhotosMap);
  updateRemoveButtons();
}

export function updateRemoveButtons() {
  const courseList = document.getElementById('courseList');
  if (!courseList) return;
  const cards = courseList.querySelectorAll('.course-item-card');
  cards.forEach((card) => {
    const removeBtn = card.querySelector('.btn-remove-course');
    if (removeBtn) {
      if (cards.length > 1) removeBtn.classList.remove('hidden');
      else removeBtn.classList.add('hidden');
    }
  });
}

// Global window helpers for inline handlers
window.handleGalleryUpload = function(event, index) {
  const files = Array.from(event.target.files);
  if (!files || files.length === 0) return;

  if (!coursePhotosMap[index]) coursePhotosMap[index] = [];
  const maxPhotos = CONFIG.MAX_PHOTOS_PER_COURSE || 3;
  
  files.slice(0, maxPhotos - coursePhotosMap[index].length).forEach(file => {
    compressAndReadImage(file, (dataUrl) => {
      if (coursePhotosMap[index].length < maxPhotos) {
        coursePhotosMap[index].push(dataUrl);
        renderThumbs(index);
        const mockupImgPreview = document.getElementById('mockupImgPreview');
        if (mockupImgPreview && index === 0) {
          mockupImgPreview.style.backgroundImage = `url('${dataUrl}')`;
        }
      }
    });
  });
};

window.deleteThumb = function(courseIdx, photoIdx) {
  if (coursePhotosMap[courseIdx]) {
    coursePhotosMap[courseIdx].splice(photoIdx, 1);
    renderThumbs(courseIdx);
    const mockupImgPreview = document.getElementById('mockupImgPreview');
    if (mockupImgPreview && courseIdx === 0) {
      const remaining = coursePhotosMap[0] || [];
      if (remaining.length > 0) {
        mockupImgPreview.style.backgroundImage = `url('${remaining[0]}')`;
      } else {
        mockupImgPreview.style.backgroundImage = "url('assets/restaurant.jpg')";
      }
    }
  }
};

window.removeCourseItem = function(index) {
  const courseList = document.getElementById('courseList');
  if (!courseList) return;
  const card = courseList.querySelector(`.course-item-card[data-index="${index}"]`);
  if (card) {
    card.remove();
    delete coursePhotosMap[index];
    reindexCourses();
  }
};

// 7. Initialize Form
export function initCourseForm() {
  initCustomCalendar();
  initThemePicker();
  initBudgetChips();

  // Close custom dropdowns on outside click
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.course-type-dropdown').forEach(dd => {
      if (!dd.contains(e.target)) {
        dd.classList.remove('open');
        const menu = dd.querySelector('.custom-dropdown-menu');
        if (menu) menu.classList.add('hidden');
      }
    });
  });

  const addCourseBtn = document.getElementById('addCourseBtn');
  if (addCourseBtn) {
    addCourseBtn.addEventListener('click', () => {
      addCourseItem();
    });
  }

  // Initial clean empty course (1st course)
  addCourseItem('🍽️ 맛집/식사', '18:00', '', '', '', '', [], '');
}

// 8. Extract & Validate Form Data
export function getFormData() {
  const senderName = (document.getElementById('senderName')?.value || '').trim();
  const receiverName = (document.getElementById('receiverName')?.value || '').trim();
  const dateVal = document.getElementById('date')?.value || '';
  const mainArea = (document.getElementById('mainArea')?.value || '').trim();
  const budget = document.getElementById('selectedBudget')?.value || '예산 미정';
  const message = (document.getElementById('message')?.value || '').trim();
  const theme = document.getElementById('selectedTheme')?.value || 'cozy';

  if (!senderName || !receiverName || !dateVal || !mainArea || !message) {
    showToast('필수 항목을 모두 작성해주세요! 🌿', true);
    return null;
  }

  const courseList = document.getElementById('courseList');
  const courseCards = courseList ? courseList.querySelectorAll('.course-item-card') : [];
  const courses = [];
  let isValid = true;

  courseCards.forEach((card, idx) => {
    const type = card.querySelector('.course-type')?.value || '';
    const time = card.querySelector('.course-time')?.value || '';
    const name = (card.querySelector('.course-name')?.value || '').trim();
    const place = (card.querySelector('.course-place')?.value || '').trim();
    const move = (card.querySelector('.course-move')?.value || '').trim();
    const tip = (card.querySelector('.course-tip')?.value || '').trim();
    let url = (card.querySelector('.course-url')?.value || '').trim();

    const photos = coursePhotosMap[idx] || [];

    if (!name || !time) isValid = false;

    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    courses.push({ t: type, tm: time, n: name, pl: place, m: move, tp: tip, u: url, p: photos });
  });

  if (!isValid || courses.length === 0) {
    showToast('각 코스의 장소 이름과 시간을 입력해 주세요!', true);
    return null;
  }

  return {
    senderName,
    receiverName,
    dateVal,
    mainArea,
    budget,
    message,
    theme,
    courses
  };
}
