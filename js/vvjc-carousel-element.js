/**
 * @file
 * VvjcCarouselElement — `<vvjc-carousel>` custom element.
 *
 * Extends `Drupal.Vvj.ElementBase` from `vvj_core`. 3D carousel using
 * rotateY + translateZ placement of N cells on a virtual cylinder. Full
 * v1 feature set preserved: autoplay (with progress bar), arrows, dots
 * (with scrollable variant), play/pause, slide counter, screen-reader
 * announcer, deep linking, touch/swipe, keyboard navigation, RTL-aware,
 * reduced-motion aware, IntersectionObserver-driven pause-when-out-of-
 * viewport. The base class is pulled from the `Drupal.Vvj` namespace —
 * Drupal core's cross-file sharing pattern — with load order guaranteed
 * by the `vvjc` library's `dependencies:`.
 *
 * Public methods (used by the Drupal.vvjc.* compat shim):
 *   - goToSlide(slideIndex: number) → boolean (1-based)
 *   - getCurrentSlide() → number (1-based)
 *   - getTotalSlides() → number
 *   - nextSlide() → boolean
 *   - prevSlide() → boolean
 *   - pause() → boolean
 *   - resume() → boolean
 *
 * @license SPDX-License-Identifier: GPL-2.0-or-later
 */

// phpcs:disable Drupal.NamingConventions.UpperCaseConstant
// phpcs:disable Generic.PHP.UpperCaseConstant
// phpcs:disable Squiz.WhiteSpace.OperatorSpacing

((Drupal) => {
  'use strict';

  const { ElementBase } = Drupal.Vvj;

  const PLAY_SVG = `<svg class="svg-play" xmlns="http://www.w3.org/2000/svg" viewBox="80 -880 800 800" fill="currentcolor"><path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"></path></svg>`;
  const PAUSE_SVG = `<svg class="svg-pause" xmlns="http://www.w3.org/2000/svg" viewBox="80 -880 800 800" fill="currentcolor"><path d="M360-320h80v-320h-80v320Zm160 0h80v-320h-80v320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"></path></svg>`;

  function isRTLContext(element) {
    return element.closest('[dir="rtl"]') !== null
      || document.documentElement.dir === 'rtl'
      || document.body.dir === 'rtl'
      || getComputedStyle(element).direction === 'rtl';
  }

  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  class VvjcCarouselElement extends ElementBase {

    static get patternSlug() {
 return 'vvjc'; }

    constructor() {
      super();
      this._items = null;
      this._cells = [];
      this._cellCount = 0;
      this._currentIndex = 0;
      this._direction = 1;
      this._isPaused = false;
      this._intervalId = null;
      this._progressIntervalId = null;
      this._rotationDelay = 0;
      this._isRTL = false;
      this._isInViewport = true;
      this._intersectionObserver = null;
      this._lastWidth = 0;

      // DOM refs.
      this._uniqueId = '';
      this._slideNumberEl = null;
      this._totalSlidesEl = null;
      this._prevButton = null;
      this._nextButton = null;
      this._playPauseButton = null;
      this._progressBar = null;
      this._announcer = null;
      this._dotsContainer = null;
      this._scrollableDotsWidth = 0;

      // Feature flags.
      this._features = {};
    }

    onHydrate() {
      this._items = this.querySelector('.vvjc-items');
      if (!this._items) { return;
      }

      this._uniqueId = (this._items.id || '').split('-')[2] ?? '';
      this._cells = this._items.querySelectorAll('.vvjc-item');
      this._cellCount = this._cells.length;
      if (this._cellCount === 0) { return;
      }

      this._readConfig();

      // Look up DOM refs.
      this._slideNumberEl = this.querySelector(`#index-${this._uniqueId}`);
      this._totalSlidesEl = this.querySelector('.total-slides');
      this._prevButton = this.querySelector(`#prev-${this._uniqueId}`);
      this._nextButton = this.querySelector(`#next-${this._uniqueId}`);
      this._playPauseButton = this.querySelector(`#btn-${this._uniqueId}`);
      this._progressBar = this.querySelector('.progressbar');
      this._announcer = this.querySelector('.announcer');
      this._dotsContainer = this.querySelector('.vvjc-dots-nav');
      this._scrollableDotsWidth = parseInt(this._dotsContainer?.dataset.scrollableDotsWidth ?? '0', 10) || 0;

      const navTime = parseInt(this.querySelector('.vvjc-nav')?.getAttribute('data-time') ?? '0', 10);
      this._rotationDelay = Number.isFinite(navTime) ? navTime : 0;
      this._isRTL = isRTLContext(this);

      if (this._rotationDelay <= 0) {
        this._isPaused = true;
        this._updatePlayPauseButton(true);
      }

      if (this._features.pauseOnReducedMotion && this.reducedMotion) {
        this._isPaused = true;
        this._updatePlayPauseButton(true);
        if (this._features.enableScreenReader) {
          this._announce('Carousel paused due to reduced motion preference');
        }
      }

      this._buildCarousel();
      this._setupControls();
      this._initDeepLinking();
      if (this._features.enableTouchSwipe) { this._setupTouch();
      }
      if (this._features.showDotsNavigation && this._dotsContainer) {
        this._setupDotsNavigation();
        if (this._scrollableDotsWidth > 0) { this._initScrollableDots();
        }
      }

      this._updateSlide();

      // Visibility-driven autoplay control.
      this._lastWidth = window.innerWidth;
      if ('IntersectionObserver' in window) {
        this._intersectionObserver = new IntersectionObserver((entries) => {
          this._isInViewport = entries[0].isIntersecting;
          if (this._isInViewport && !this._isPaused) { this._startAutoPlay();
          } else { this._pauseAutoPlay();
          }
        }, { threshold: 0.2 });
        this._intersectionObserver.observe(this);
      }
      else if (!this._isPaused) {
        this._startAutoPlay();
      }

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { this._pauseAutoPlay();
        } else if (this._isInViewport && !this._isPaused) { this._startAutoPlay();
        }
      }, { signal: this.signal });

      const onResize = debounce(() => {
        const w = window.innerWidth;
        if (Math.abs(w - this._lastWidth) >= 50) {
          this._lastWidth = w;
          this._currentIndex = 0;
          this._direction = 1;
          this._buildCarousel();
          this._updateSlide();
          this._restartAutoPlay();
        }
      }, 200);
      window.addEventListener('resize', onResize, { signal: this.signal });
      window.addEventListener('orientationchange', onResize, { signal: this.signal });
    }

    onDisconnect() {
      this._pauseAutoPlay();
      this._intersectionObserver?.disconnect();
      this._intersectionObserver = null;
    }

    // -----------------------------------------------------------------
    // Configuration.
    // -----------------------------------------------------------------

    _readConfig() {
      const ds = this._items.dataset;
      this._features = {
        showProgressBar: ds.showProgressBar === 'true',
        showDotsNavigation: ds.showDotsNavigation === 'true',
        enableKeyboardNav: ds.enableKeyboardNav === 'true',
        enableTouchSwipe: ds.enableTouchSwipe === 'true',
        enablePauseOnHover: ds.enablePauseOnHover === 'true',
        enableScreenReader: ds.enableScreenReader === 'true',
        pauseOnReducedMotion: ds.pauseOnReducedMotion === 'true',
        showNavigationArrows: ds.showNavigationArrows === 'true',
        showPlayPause: ds.showPlayPause === 'true',
        showSlideCounter: ds.showSlideCounter === 'true',
      };
    }

    // -----------------------------------------------------------------
    // 3D layout.
    // -----------------------------------------------------------------

    _buildCarousel() {
      const theta = 360 / this._cellCount;
      const radius = Math.round(this._items.offsetWidth / 2 / Math.tan(Math.PI / this._cellCount));
      const reducedMotion = this._features.pauseOnReducedMotion && this.reducedMotion;
      this._cells.forEach((cell, i) => {
        cell.style.opacity = '1';
        cell.style.transform = `rotateY(${theta * i}deg) translateZ(${radius}px)`;
        if (reducedMotion) { cell.style.transition = 'none';
        }
      });
      if (reducedMotion) {
        this._items.style.transition = 'none';
        this._items.classList.add('reduced-motion');
      }
      this._cells[0]?.classList.add('active');
      this._updateNavVisibility();
    }

    _updateSlide() {
      const theta = 360 / this._cellCount;
      const radius = Math.round(this._items.offsetWidth / 2 / Math.tan(Math.PI / this._cellCount));
      const angle = theta * this._currentIndex * -1;
      this._items.style.transition = 'transform 0.8s ease-in-out';
      this._items.style.transform = `translateZ(${-radius}px) rotateY(${angle}deg)`;

      this._cells.forEach((cell, index) => {
        const isActive = index === this._currentIndex;
        cell.setAttribute('aria-hidden', String(!isActive));
        cell.querySelectorAll('a, button').forEach((el) => {
          el.setAttribute('tabindex', isActive ? '0' : '-1');
        });
        cell.classList.toggle('active', isActive);
      });

      if (this._features.showSlideCounter && this._slideNumberEl) {
        this._slideNumberEl.textContent = String(this._currentIndex + 1);
      }
      if (this._features.showDotsNavigation) { this._updateDots();
      }
      if (this._features.enableScreenReader && this._announcer) {
        this._announcer.textContent = `Slide ${this._currentIndex + 1} of ${this._cellCount}`;
      }
      if (this._features.showProgressBar && this._rotationDelay > 0 && !this._isPaused) {
        this._startProgress();
      }
      this._updateDeepLinkHash();
      this._updateNavVisibility();
    }

    _updateNavVisibility() {
      if (!this._features.showNavigationArrows) { return;
      }
      if (this._prevButton) {
        const atStart = this._currentIndex === 0;
        this._prevButton.classList.toggle('vvjc-hidden', atStart);
        this._prevButton.setAttribute('tabindex', atStart ? '-1' : '0');
      }
      if (this._nextButton) {
        const atEnd = this._currentIndex === this._cellCount - 1;
        this._nextButton.classList.toggle('vvjc-hidden', atEnd);
        this._nextButton.setAttribute('tabindex', atEnd ? '-1' : '0');
      }
    }

    // -----------------------------------------------------------------
    // Navigation primitives.
    // -----------------------------------------------------------------

    _advanceSlide() {
      this._currentIndex += this._direction;
      if (this._currentIndex >= this._cellCount) {
        this._currentIndex = this._cellCount - 2;
        this._direction = -1;
      }
      else if (this._currentIndex < 0) {
        this._currentIndex = 1;
        this._direction = 1;
      }
      this._updateSlide();
    }

    _manualAdvance(direction) {
      this._direction = direction;
      this._advanceSlide();
      this._restartAutoPlay();
    }

    _goToSlideIndex(targetIndex) {
      if (targetIndex < 0 || targetIndex >= this._cellCount) { return;
      }
      if (targetIndex > this._currentIndex) { this._direction = 1;
      } else if (targetIndex < this._currentIndex) { this._direction = -1;
      }
      this._currentIndex = targetIndex;
      this._updateSlide();
    }

    // -----------------------------------------------------------------
    // Controls wiring.
    // -----------------------------------------------------------------

    _setupControls() {
      if (this._features.showNavigationArrows) {
        this._nextButton?.addEventListener('click', () => this._manualAdvance(1), { signal: this.signal });
        this._prevButton?.addEventListener('click', () => this._manualAdvance(-1), { signal: this.signal });
      }

      if (this._features.showPlayPause && this._playPauseButton) {
        this._playPauseButton.style.display = 'flex';
        this._playPauseButton.addEventListener('click', () => this._togglePlayPause(), { signal: this.signal });
        this._playPauseButton.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this._togglePlayPause();
          }
        }, { signal: this.signal });
      }

      if (this._features.enableKeyboardNav) {
        this.addEventListener('keydown', (event) => {
          if (event.target.closest('input, textarea, [contenteditable="true"]')) { return;
          }
          switch (event.key) {
            case 'ArrowRight':
              event.preventDefault();
              this._manualAdvance(this._isRTL ? -1 : 1);
              break;

            case 'ArrowLeft':
              event.preventDefault();
              this._manualAdvance(this._isRTL ? 1 : -1);
              break;

            case ' ':
            case 'Spacebar':
              if (this._features.showPlayPause) {
                event.preventDefault();
                this._togglePlayPause();
              }
              break;

            case 'Home':
              event.preventDefault();
              this._goToSlideIndex(0);
              this._restartAutoPlay();
              break;

            case 'End':
              event.preventDefault();
              this._goToSlideIndex(this._cellCount - 1);
              this._restartAutoPlay();
              break;

            default:
              break;
          }
        }, { signal: this.signal });
      }

      if (this._features.enablePauseOnHover) {
        this.addEventListener('mouseenter', () => {
          this._pauseAutoPlay();
          if (this._features.showProgressBar) { this._pauseProgress();
          }
        }, { signal: this.signal });
        this.addEventListener('mouseleave', () => this._resumeAutoPlay(), { signal: this.signal });
      }
    }

    _setupTouch() {
      let startX = 0;
      let endX = 0;
      this.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true, signal: this.signal });
      this.addEventListener('touchmove', (e) => { endX = e.touches[0].clientX; }, { passive: true, signal: this.signal });
      this.addEventListener('touchend', () => {
        const threshold = 50;
        if (startX - endX > threshold) { this._manualAdvance(this._isRTL ? -1 : 1);
        } else if (endX - startX > threshold) { this._manualAdvance(this._isRTL ? 1 : -1);
        }
      }, { passive: true, signal: this.signal });
    }

    _setupDotsNavigation() {
      this._dotsContainer.querySelectorAll('.dots-numbers-button').forEach((dot, index) => {
        dot.addEventListener('click', () => {
          this._goToSlideIndex(index);
          this._restartAutoPlay();
        }, { signal: this.signal });
      });
    }

    _updateDots() {
      if (!this._dotsContainer) { return;
      }
      this._dotsContainer.querySelectorAll('.dots-numbers-button').forEach((dot, index) => {
        const isActive = index === this._currentIndex;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
        dot.setAttribute('tabindex', isActive ? '0' : '-1');
      });
      if (this._scrollableDotsWidth > 0) { this._centerActiveDot();
      }
    }

    _initScrollableDots() {
      this._dotsContainer.style.maxWidth = `${this._scrollableDotsWidth}px`;
      this._dotsContainer.style.justifyContent = 'flex-start';
      requestAnimationFrame(() => this._centerActiveDot());
    }

    _centerActiveDot() {
      const activeDot = this._dotsContainer?.querySelector('.dots-numbers-button.active');
      if (!activeDot || this._scrollableDotsWidth <= 0) { return;
      }
      const containerWidth = this._dotsContainer.offsetWidth;
      const target = activeDot.offsetLeft - (containerWidth / 2) + (activeDot.offsetWidth / 2);
      const maxScroll = this._dotsContainer.scrollWidth - containerWidth;
      const clamped = Math.max(0, Math.min(target, maxScroll));
      this._dotsContainer.scrollTo({ left: clamped, behavior: 'smooth' });
    }

    // -----------------------------------------------------------------
    // Autoplay + progress + play/pause.
    // -----------------------------------------------------------------

    _startAutoPlay() {
      clearInterval(this._intervalId);
      if (this._rotationDelay > 0 && !this._isPaused) {
        this._intervalId = setInterval(() => this._advanceSlide(), this._rotationDelay);
        if (this._features.showProgressBar) { this._startProgress();
        }
      }
    }

    _pauseAutoPlay() {
      clearInterval(this._intervalId);
      if (this._features.showProgressBar) { this._pauseProgress();
      }
    }

    _resumeAutoPlay() {
      if (!this._isPaused) { this._startAutoPlay();
      }
    }

    _restartAutoPlay() {
      this._pauseAutoPlay();
      this._startAutoPlay();
    }

    _togglePlayPause() {
      this._isPaused = !this._isPaused;
      this._updatePlayPauseButton(this._isPaused);
      if (this._isPaused) {
        this._pauseAutoPlay();
        if (this._features.showProgressBar) { this._pauseProgress();
        }
      }
      else {
        this._restartAutoPlay();
      }
    }

    _updatePlayPauseButton(isPaused) {
      if (!this._playPauseButton) { return;
      }
      this._playPauseButton.innerHTML = isPaused ? PLAY_SVG : PAUSE_SVG;
      this._playPauseButton.setAttribute('aria-label', isPaused ? 'Play slideshow' : 'Pause slideshow');
      this._playPauseButton.setAttribute('aria-pressed', isPaused ? 'false' : 'true');
    }

    _startProgress() {
      if (!this._progressBar || this._rotationDelay <= 0) { return;
      }
      clearInterval(this._progressIntervalId);
      this._progressBar.style.setProperty('--progress', '0%');
      this._progressBar.setAttribute('aria-valuenow', '0');
      const startTime = Date.now();
      this._progressIntervalId = setInterval(() => {
        if (this._isPaused) {
          clearInterval(this._progressIntervalId);
          return;
        }
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / this._rotationDelay) * 100);
        this._progressBar.style.setProperty('--progress', `${progress}%`);
        this._progressBar.setAttribute('aria-valuenow', String(Math.round(progress)));
        if (progress >= 100) { clearInterval(this._progressIntervalId);
        }
      }, 50);
    }

    _pauseProgress() {
      if (this._progressIntervalId) {
        clearInterval(this._progressIntervalId);
        this._progressIntervalId = null;
      }
    }

    _announce(message) {
      if (!this._announcer) { return;
      }
      const original = this._announcer.textContent;
      this._announcer.textContent = message;
      setTimeout(() => { this._announcer.textContent = original; }, 1000);
    }

    // -----------------------------------------------------------------
    // Deep linking.
    // -----------------------------------------------------------------

    _initDeepLinking() {
      const enabled = this._items.dataset.deeplinkEnabled === 'true';
      const id = this._items.dataset.deeplinkId || '';
      if (!enabled || !id) { return;
      }
      this._deeplinkId = id;

      const apply = (hash) => {
        if (!hash || !hash.startsWith(`#carousel3d-${id}-`)) { return;
        }
        const slideNumber = parseInt(hash.split('-').pop(), 10);
        if (!Number.isFinite(slideNumber) || slideNumber < 1 || slideNumber > this._cellCount) { return;
        }
        this._goToSlideIndex(slideNumber - 1);
      };

      apply(window.location.hash);
      window.addEventListener('hashchange', () => apply(window.location.hash), { signal: this.signal });
    }

    _updateDeepLinkHash() {
      if (!this._deeplinkId) { return;
      }
      const newHash = `#carousel3d-${this._deeplinkId}-${this._currentIndex + 1}`;
      if (window.location.hash !== newHash && window.history?.replaceState) {
        window.history.replaceState(null, '', newHash);
      }
    }

    // -----------------------------------------------------------------
    // Public API.
    // -----------------------------------------------------------------

    goToSlide(slideIndex) {
      if (slideIndex < 1 || slideIndex > this._cellCount) {
        console.warn(`VVJC: Invalid slide ${slideIndex}. Must be between 1 and ${this._cellCount}`);
        return false;
      }
      this._goToSlideIndex(slideIndex - 1);
      if (!this._isPaused && this._rotationDelay > 0) { this._startAutoPlay();
      }
      return true;
    }

    getCurrentSlide() {
      return this._currentIndex + 1;
    }

    getTotalSlides() {
      return this._cellCount;
    }

    nextSlide() {
      const next = (this._currentIndex + 1) % this._cellCount;
      this._goToSlideIndex(next);
      if (!this._isPaused && this._rotationDelay > 0) { this._startAutoPlay();
      }
      return true;
    }

    prevSlide() {
      const prev = (this._currentIndex - 1 + this._cellCount) % this._cellCount;
      this._goToSlideIndex(prev);
      if (!this._isPaused && this._rotationDelay > 0) { this._startAutoPlay();
      }
      return true;
    }

    pause() {
      if (this._isPaused) { return false;
      }
      this._isPaused = true;
      this._pauseAutoPlay();
      this._updatePlayPauseButton(true);
      return true;
    }

    resume() {
      if (!this._isPaused || this._rotationDelay <= 0) { return false;
      }
      this._isPaused = false;
      this._startAutoPlay();
      this._updatePlayPauseButton(false);
      return true;
    }

  }

  if (!customElements.get('vvjc-carousel')) {
    customElements.define('vvjc-carousel', VvjcCarouselElement);
  }

})(Drupal);
