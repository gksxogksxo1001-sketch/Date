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

    if (this.waxSealBtn) {
      this.waxSealBtn.classList.remove('is-cracking');
    }

    this.overlayEl.classList.remove('hidden', 'fade-out');
  },

  /**
   * 실링 왁스 클릭 시 3D 오프닝 연출
   */
  handleOpen() {
    if (this.isOpening) return;
    this.isOpening = true;

    // 1. 실링 왁스 깨짐 햅틱/애니메이션 트리거
    if (this.waxSealBtn) {
      this.waxSealBtn.classList.add('is-cracking');
    }

    // 진동 피드백 (모바일 지원 브라우저)
    if (navigator.vibrate) {
      navigator.vibrate([35, 60, 45]);
    }

    // 2. 2단계 입체 파티클 연출 (1단계: 미세 왁스 파편 폭발, 2단계: 골드/하트 글리터)
    if (window.confetti && this.waxSealBtn) {
      const rect = this.waxSealBtn.getBoundingClientRect();
      const originX = (rect.left + rect.width / 2) / window.innerWidth;
      const originY = (rect.top + rect.height / 2) / window.innerHeight;

      // 1단계: 왁스 파열 파편 (버건디 & 앤틱 골드)
      window.confetti({
        particleCount: 45,
        spread: 70,
        startVelocity: 30,
        origin: { x: originX, y: originY },
        colors: ['#8B3A36', '#A85A56', '#5C1D1B', '#D4AF37', '#F5D0A9', '#FFE5E0'],
        ticks: 140,
        gravity: 1.1,
        scalar: 0.85,
        shapes: ['circle']
      });

      // 2단계: 0.15초 뒤 설레는 골드 & 로맨틱 스파클링 버스트
      setTimeout(() => {
        window.confetti({
          particleCount: 30,
          spread: 90,
          startVelocity: 35,
          origin: { x: originX, y: originY },
          colors: ['#FF6B8B', '#E07A5F', '#FFD166', '#FFFFFF'],
          ticks: 160,
          gravity: 0.9,
          scalar: 0.95
        });
      }, 150);
    }

    // 3. 플랩 3D 회전 및 편지지 자연스러운 슬라이드업
    if (envelopeWrapper) {
      // 살짝 봉투가 열리면서 펼쳐지는 타이밍
      setTimeout(() => {
        envelopeWrapper.classList.add('is-open');
      }, 180);

      setTimeout(() => {
        envelopeWrapper.classList.add('letter-rise');
      }, 480);
    }

    // 4. 완료 후 뷰어로 부드럽게 크로스페이드
    setTimeout(() => {
      this.finishAndClose();
    }, 1300);
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
