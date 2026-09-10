// ====================================================
// ENVELOPE-OPENING.JS — 실링 왁스 인터랙티브 봉투 오프닝 엔진
// ====================================================

export const EnvelopeOpening = {
  overlayEl: null,
  waxSealBtn: null,
  skipBtn: null,
  isOpening: false,
  onOpenedCallback: null,

  init() {
    this.overlayEl = document.getElementById('envelopeOverlay');
    this.waxSealBtn = document.getElementById('envelopeWaxSeal');
    this.skipBtn = document.getElementById('envelopeSkipBtn');

    if (this.waxSealBtn) {
      this.waxSealBtn.addEventListener('click', () => this.handleOpen());
    }

    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => this.handleSkip());
    }
  },

  /**
   * 봉투 인트로 표시
   */
  show({ sender = '너를 위한 사람', receiver = '소중한 너', date = '', theme = 'cozy', onOpened = null }) {
    if (!this.overlayEl) this.init();
    if (!this.overlayEl) return;

    this.onOpenedCallback = onOpened;
    this.isOpening = false;

    // 데이터 바인딩
    const toSpan = document.getElementById('envelopeTo');
    const fromSpan = document.getElementById('envelopeFrom');
    const dateSpan = document.getElementById('envelopeDate');
    const envelopeWrapper = document.getElementById('envelopeWrapper');

    if (toSpan) toSpan.textContent = receiver;
    if (fromSpan) fromSpan.textContent = sender;
    if (dateSpan) dateSpan.textContent = date ? `Date: ${date}` : '';

    if (envelopeWrapper) {
      envelopeWrapper.className = `envelope-wrapper theme-${theme}`;
      envelopeWrapper.classList.remove('is-open', 'letter-rise');
    }

    this.overlayEl.classList.remove('hidden', 'fade-out');
  },

  /**
   * 실링 왁스 클릭 시 3D 오프닝 연출
   */
  handleOpen() {
    if (this.isOpening) return;
    this.isOpening = true;

    const envelopeWrapper = document.getElementById('envelopeWrapper');

    // 1. 실링 왁스 파열 파티클 효과 (버건디 & 골드 왁스 조각 느낌)
    if (window.confetti && this.waxSealBtn) {
      const rect = this.waxSealBtn.getBoundingClientRect();
      const originX = (rect.left + rect.width / 2) / window.innerWidth;
      const originY = (rect.top + rect.height / 2) / window.innerHeight;

      // 미세 왁스 조각 확산
      window.confetti({
        particleCount: 35,
        spread: 60,
        startVelocity: 25,
        origin: { x: originX, y: originY },
        colors: ['#A32835', '#C84B58', '#E6A868', '#F5D0A9', '#7C1A22'],
        ticks: 120,
        gravity: 1.2,
        scalar: 0.8,
        shapes: ['circle']
      });
    }

    // 2. 봉투 플랩 열림 및 편지지 상승 애니메이션
    if (envelopeWrapper) {
      envelopeWrapper.classList.add('is-open');

      setTimeout(() => {
        envelopeWrapper.classList.add('letter-rise');
      }, 350);
    }

    // 3. 완료 후 부드러운 페이드아웃 및 뷰어로 전환
    setTimeout(() => {
      this.finishAndClose();
    }, 1100);
  },

  /**
   * 스킵 버튼 클릭 시 즉시 뷰어로 이동
   */
  handleSkip() {
    if (this.isOpening) return;
    this.finishAndClose();
  },

  /**
   * 오버레이 닫고 본문 활성화
   */
  finishAndClose() {
    if (!this.overlayEl) return;
    this.overlayEl.classList.add('fade-out');

    setTimeout(() => {
      this.overlayEl.classList.add('hidden');
      this.overlayEl.classList.remove('fade-out');
      if (typeof this.onOpenedCallback === 'function') {
        this.onOpenedCallback();
      }
    }, 400);
  }
};
