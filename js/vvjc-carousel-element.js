/**
 * @file
 * VvjcCarouselElement — `<vvjc-carousel>` custom element.
 *
 * Extends `Drupal.Vvj.ElementBase` from `vvj_core`. 3D carousel in two
 * styles: a ring (rotateY + translateZ placement of N cells on a virtual
 * cylinder, ping-pong at the ends) and a coverflow (an open fan, centre card
 * forward, wrapping). The style comes from `data-vvjc-style`. Full
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
  const { ElementBase } = Drupal.Vvj;

  const PLAY_SVG = `<svg class="svg-play" xmlns="http://www.w3.org/2000/svg" viewBox="80 -880 800 800" fill="currentcolor"><path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"></path></svg>`;
  const PAUSE_SVG = `<svg class="svg-pause" xmlns="http://www.w3.org/2000/svg" viewBox="80 -880 800 800" fill="currentcolor"><path d="M360-320h80v-320h-80v320Zm160 0h80v-320h-80v320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"></path></svg>`;

  // Coverflow look. These are the values tuned for paragraphs_bundles' 3D
  // carousel (paragraph-bundle-3d-carousel.js), copied because the two
  // projects share no code. They are fixed constants, not settings.
  const CF_CENTRE_SCALE = 0.62;
  const CF_SPACING = 0.72;
  const CF_TILT = 45;
  const CF_DEPTH = 120;
  const CF_SHRINK = 0.16;
  const CF_MIN_SCALE = 0.3;

  function isRTLContext(element) {
    return (
      element.closest('[dir="rtl"]') !== null ||
      document.documentElement.dir === 'rtl' ||
      document.body.dir === 'rtl' ||
      getComputedStyle(element).direction === 'rtl'
    );
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
      return 'vvjc';
    }

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

      // Geometry: 'ring' unless the markup says coverflow (_readConfig).
      this._style = 'ring';
      // Coverflow only: each card's slot at the previous layout, so a card
      // that wraps round the deck can be told apart from one that moves.
      this._lastSlot = new Map();
      // Coverflow only: the stylesheet's card transition in ms, memoised.
      this._cssDuration = null;
    }

    onHydrate() {
      this._items = this.querySelector('.vvjc-items');
      if (!this._items) {
        return;
      }

      this._uniqueId = (this._items.id || '').split('-')[2] ?? '';
      this._cells = this._items.querySelectorAll('.vvjc-item');
      this._cellCount = this._cells.length;
      if (this._cellCount === 0) {
        return;
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
      this._scrollableDotsWidth =
        parseInt(this._dotsContainer?.dataset.scrollableDotsWidth ?? '0', 10) ||
        0;

      const navTime = parseInt(
        this.querySelector('.vvjc-nav')?.getAttribute('data-time') ?? '0',
        10,
      );
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
      if (this._features.enableTouchSwipe) {
        this._setupTouch();
      }
      if (this._features.showDotsNavigation && this._dotsContainer) {
        this._setupDotsNavigation();
        if (this._scrollableDotsWidth > 0) {
          this._initScrollableDots();
        }
      }

      this._updateSlide();

      // Visibility-driven autoplay control.
      this._lastWidth = window.innerWidth;
      if ('IntersectionObserver' in window) {
        this._intersectionObserver = new IntersectionObserver(
          (entries) => {
            this._isInViewport = entries[0].isIntersecting;
            if (this._isInViewport && !this._isPaused) {
              this._startAutoPlay();
            } else {
              this._pauseAutoPlay();
            }
          },
          { threshold: 0.2 },
        );
        this._intersectionObserver.observe(this);
      } else if (!this._isPaused) {
        this._startAutoPlay();
      }

      document.addEventListener(
        'visibilitychange',
        () => {
          if (document.hidden) {
            this._pauseAutoPlay();
          } else if (this._isInViewport && !this._isPaused) {
            this._startAutoPlay();
          }
        },
        { signal: this.signal },
      );

      const onResize = debounce(() => {
        const w = window.innerWidth;
        if (Math.abs(w - this._lastWidth) >= 50) {
          this._lastWidth = w;
          if (this._style !== 'coverflow') {
            // The ring rebuilds its drum from the first slide. A coverflow
            // lays out from the current card, so it keeps its place.
            this._currentIndex = 0;
            this._direction = 1;
          }
          this._buildCarousel();
          this._updateSlide();
          this._restartAutoPlay();
        }
      }, 200);
      window.addEventListener('resize', onResize, { signal: this.signal });
      window.addEventListener('orientationchange', onResize, {
        signal: this.signal,
      });
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
      // Emitted only for coverflow, so a ring's markup is unchanged.
      this._style = ds.vvjcStyle === 'coverflow' ? 'coverflow' : 'ring';
    }

    // -----------------------------------------------------------------
    // 3D layout.
    // -----------------------------------------------------------------

    _buildCarousel() {
      if (this._style === 'coverflow') {
        // The deck never rotates; _updateSlide(), which every caller runs
        // next, lays the cards out.
        this._items.style.transform = '';
        this._cells.forEach((cell) => cell.classList.remove('active'));
        this._cells[0]?.classList.add('active');
        this._updateNavVisibility();
        return;
      }

      const theta = 360 / this._cellCount;
      const radius = Math.round(
        this._items.offsetWidth / 2 / Math.tan(Math.PI / this._cellCount),
      );
      const reducedMotion =
        this._features.pauseOnReducedMotion && this.reducedMotion;
      this._cells.forEach((cell, i) => {
        cell.style.opacity = '1';
        cell.style.transform = `rotateY(${theta * i}deg) translateZ(${radius}px)`;
        if (reducedMotion) {
          cell.style.transition = 'none';
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
      if (this._style === 'coverflow') {
        this._updateCoverflow();
        this._syncSlideState();
        return;
      }

      const theta = 360 / this._cellCount;
      const radius = Math.round(
        this._items.offsetWidth / 2 / Math.tan(Math.PI / this._cellCount),
      );
      const angle = theta * this._currentIndex * -1;
      // Inline, so it beats the stylesheet's reduced-motion rule; it must
      // therefore apply that rule itself or the drum still spins.
      this._items.style.transition = this.reducedMotion
        ? 'none'
        : 'transform 0.8s ease-in-out';
      this._items.style.transform = `translateZ(${-radius}px) rotateY(${angle}deg)`;

      this._cells.forEach((cell, index) => {
        const isActive = index === this._currentIndex;
        cell.setAttribute('aria-hidden', String(!isActive));
        cell.querySelectorAll('a, button').forEach((el) => {
          el.setAttribute('tabindex', isActive ? '0' : '-1');
        });
        cell.classList.toggle('active', isActive);
      });

      this._syncSlideState();
    }

    /**
     * Everything a slide change updates besides the geometry.
     *
     * Moved unchanged out of _updateSlide(), so both geometries share one
     * counter, dots, announcer, progress, hash and arrows.
     */
    _syncSlideState() {
      if (this._features.showSlideCounter && this._slideNumberEl) {
        this._slideNumberEl.textContent = String(this._currentIndex + 1);
      }
      if (this._features.showDotsNavigation) {
        this._updateDots();
      }
      if (this._features.enableScreenReader && this._announcer) {
        this._announcer.textContent = `Slide ${this._currentIndex + 1} of ${this._cellCount}`;
      }
      if (
        this._features.showProgressBar &&
        this._rotationDelay > 0 &&
        !this._isPaused
      ) {
        this._startProgress();
      }
      this._updateDeepLinkHash();
      this._updateNavVisibility();
    }

    /**
     * Lays the coverflow out and sets what assistive technology can reach.
     *
     * Several cards are readable at once, so `inert` follows what is on
     * screen, read back from the opacity _applyCoverflow() has just written.
     * One source of truth, rather than repeating the distance maths here.
     */
    _updateCoverflow() {
      // Read before anything moves: a card turned `inert` below loses focus
      // at once, and reading it afterwards returns <body>.
      const focused = document.activeElement;
      let focusLost = false;

      this._applyCoverflow();
      this._cells.forEach((cell, index) => {
        const shown = cell.style.opacity !== '0';
        if (!shown && focused instanceof Node && cell.contains(focused)) {
          focusLost = true;
        }
        cell.setAttribute('aria-hidden', String(!shown));
        cell.toggleAttribute('inert', !shown);
        cell.querySelectorAll('a, button').forEach((el) => {
          el.setAttribute('tabindex', shown ? '0' : '-1');
        });
        cell.classList.toggle('active', index === this._currentIndex);
      });

      // A keyboard user whose card has just left the screen goes to the
      // centre card rather than to the top of the page (measured 2026-09-26:
      // a focused link on the edge card fell to <body> on one Prev).
      if (focusLost) {
        this._cells[this._currentIndex]?.focus({ preventScroll: true });
      }
    }

    /**
     * Card width, spacing and how far out a card can sit and still be seen.
     *
     * @return {{left: number, right: number, step: number, maxDist: number}}
     *   Cards left and right of centre, px between slots, and the furthest
     *   slot still inside the clipping box.
     */
    _getCoverflowLayout() {
      const cardWidth = this._cells[0]?.offsetWidth || this._items.offsetWidth;

      // Split the cards round one centre card; an odd remainder goes right.
      const left = Math.floor((this._cellCount - 1) / 2);
      const right = this._cellCount - 1 - left;
      const step = CF_SPACING * cardWidth * CF_CENTRE_SCALE;

      // MEASURE THE BOX THAT CLIPS. `overflow: hidden` is on the element
      // itself (.vvjc) and, below the breakpoint, on .vvjc-inner. Never on
      // .vvjc-items. Which one clips is read from the cascade, not assumed.
      const inner = this.querySelector('.vvjc-inner');
      const clipWidth = Math.min(
        this.offsetWidth || Infinity,
        inner && getComputedStyle(inner).overflow === 'hidden'
          ? inner.offsetWidth
          : Infinity,
      );
      const reach = clipWidth / 2 + (cardWidth * CF_CENTRE_SCALE) / 2;
      const maxDist = Number.isFinite(reach)
        ? Math.max(1, Math.floor(reach / step))
        : this._cellCount;

      return { left, right, step, maxDist };
    }

    /**
     * The card in a given slot, wrapping round the ends.
     *
     * @param {number} slot
     *   Slots from the centre; negative is left.
     * @return {number}
     *   The cell index for that slot.
     */
    _coverflowIndexAt(slot) {
      return (
        (((this._currentIndex + slot) % this._cellCount) + this._cellCount) %
        this._cellCount
      );
    }

    /**
     * The stylesheet's card transition duration in ms, memoised.
     *
     * First read at the first wrap, when the card carries no inline
     * transition of its own, so this is the stylesheet's value.
     *
     * @param {HTMLElement} cell
     *   A card.
     * @return {number}
     *   Duration in ms; 0 when none is declared.
     */
    _cssDurationOf(cell) {
      if (this._cssDuration !== null) {
        return this._cssDuration;
      }
      cell.style.transition = '';
      const raw = getComputedStyle(cell).transitionDuration.split(',')[0];
      const value = parseFloat(raw);
      if (!Number.isFinite(value)) {
        this._cssDuration = 0;
        return 0;
      }
      this._cssDuration = raw.trim().endsWith('ms') ? value : value * 1000;
      return this._cssDuration;
    }

    /**
     * Places every card on the fan.
     *
     * Every style write is a CSSOM property write, never a `style` attribute,
     * so the carousel stays clean under a CSP without 'unsafe-inline'.
     *
     * Reduced motion follows the OS setting, not the pause option: vvjc.css
     * already drops every card transition under prefers-reduced-motion, and
     * the wrap animation below is JS, which CSS cannot reach.
     */
    _applyCoverflow() {
      const { reducedMotion } = this;
      const { left, right, step, maxDist } = this._getCoverflowLayout();
      // RTL: the next card sits on the left, so the fan is mirrored.
      const mirror = this._isRTL ? -1 : 1;

      const placed = new Map();
      for (let slot = -left; slot <= right; slot++) {
        const dist = Math.abs(slot);
        placed.set(this._coverflowIndexAt(slot), {
          slot,
          dist,
          x: slot * step * mirror,
          z: -dist * CF_DEPTH,
          ry: -Math.sign(slot) * CF_TILT * mirror,
          scale: Math.max(
            CF_CENTRE_SCALE * (1 - dist * CF_SHRINK),
            CF_MIN_SCALE,
          ),
        });
      }

      this._cells.forEach((cell, index) => {
        const at = placed.get(index);
        if (!at) {
          return;
        }

        // A WRAPPING CARD MUST NOT SLIDE. On every step one card leaves one
        // end and reappears at the other; a plain transition flies it across
        // the whole fan (measured in paragraphs_bundles 2026-09-25: 472px,
        // still 20% opaque halfway). It fades out, jumps while invisible and
        // fades in. "Wrapping" is a slot change of more than half the deck.
        const previous = this._lastSlot.get(index);
        this._lastSlot.set(index, at.slot);
        const wraps =
          !reducedMotion &&
          previous !== undefined &&
          Math.abs(at.slot - previous) * 2 > this._cellCount;

        // ORDER IS LOAD-BEARING: the transition is set and the duration read
        // BEFORE the transform is written. Reading computed style after the
        // write starts the ordinary slide on the spot.
        const duration = wraps ? this._cssDurationOf(cell) : 0;
        const animated =
          wraps && duration > 0 && typeof cell.animate === 'function';
        if (animated) {
          cell.style.transition = `transform 0s ${duration / 2}ms, opacity 0s`;
        } else {
          cell.style.transition = reducedMotion || wraps ? 'none' : '';
        }

        const fromOpacity = cell.style.opacity || '1';
        cell.style.opacity = at.dist > maxDist ? '0' : '1';
        cell.style.zIndex = String(100 - at.dist);
        cell.style.transform =
          `translateX(${at.x}px) ` +
          `translateZ(${at.z}px) ` +
          `rotateY(${at.ry}deg) ` +
          `scale(${at.scale})`;

        if (animated) {
          cell.animate(
            [
              { opacity: fromOpacity },
              { opacity: 0, offset: 0.5 },
              { opacity: cell.style.opacity },
            ],
            { duration, easing: 'ease-in-out' },
          );
        }
      });

      this._items.style.transition = '';
      this._items.style.transform = '';
    }

    _updateNavVisibility() {
      if (!this._features.showNavigationArrows) {
        return;
      }
      // Read BEFORE any arrow is hidden. Chrome drops focus from an element
      // the moment it becomes `visibility: hidden`, so reading it after the
      // toggle below already returns <body> (measured 2026-09-25).
      const focused = document.activeElement;

      // The ring ping-pongs and hides the arrow at each end. The coverflow
      // wraps, so both arrows always do something and are never hidden,
      // unless there is only one card and neither can do anything.
      const looping = this._style === 'coverflow' && this._cellCount > 1;
      if (this._prevButton) {
        const atStart = !looping && this._currentIndex === 0;
        this._prevButton.classList.toggle('vvjc-hidden', atStart);
        this._prevButton.setAttribute('tabindex', atStart ? '-1' : '0');
      }
      if (this._nextButton) {
        const atEnd = !looping && this._currentIndex === this._cellCount - 1;
        this._nextButton.classList.toggle('vvjc-hidden', atEnd);
        this._nextButton.setAttribute('tabindex', atEnd ? '-1' : '0');
      }

      // Never hide the control that holds focus without moving it. A hidden
      // arrow is `visibility: hidden`, which cannot keep focus, so a keyboard
      // user reaching the last slide was dropped to the top of the page.
      if (
        focused === this._nextButton &&
        this._nextButton?.classList.contains('vvjc-hidden')
      ) {
        this._prevButton?.focus();
      } else if (
        focused === this._prevButton &&
        this._prevButton?.classList.contains('vvjc-hidden')
      ) {
        this._nextButton?.focus();
      }
    }

    // -----------------------------------------------------------------
    // Navigation primitives.
    // -----------------------------------------------------------------

    _advanceSlide(step) {
      // One slide has nowhere to go. Without this the ring's ping-pong sets
      // the index to cellCount - 2 = -1 and every card loses `active`.
      if (this._cellCount <= 1) {
        return;
      }

      if (this._style === 'coverflow') {
        // The fan wraps. Autoplay passes no step and always moves forward;
        // a Prev click passes -1 and moves back once.
        const by = step ?? 1;
        this._currentIndex =
          (this._currentIndex + by + this._cellCount) % this._cellCount;
        this._updateSlide();
        return;
      }

      this._currentIndex += this._direction;
      if (this._currentIndex >= this._cellCount) {
        this._currentIndex = this._cellCount - 2;
        this._direction = -1;
      } else if (this._currentIndex < 0) {
        this._currentIndex = 1;
        this._direction = 1;
      }
      this._updateSlide();
    }

    _manualAdvance(direction) {
      if (this._style === 'coverflow') {
        // A step, not a heading: the ring's _direction would leave autoplay
        // running backwards after one Prev click.
        this._advanceSlide(direction);
        this._restartAutoPlay();
        return;
      }
      this._direction = direction;
      this._advanceSlide();
      this._restartAutoPlay();
    }

    _goToSlideIndex(targetIndex) {
      if (targetIndex < 0 || targetIndex >= this._cellCount) {
        return;
      }
      if (targetIndex > this._currentIndex) {
        this._direction = 1;
      } else if (targetIndex < this._currentIndex) {
        this._direction = -1;
      }
      this._currentIndex = targetIndex;
      this._updateSlide();
    }

    // -----------------------------------------------------------------
    // Controls wiring.
    // -----------------------------------------------------------------

    _setupControls() {
      if (this._features.showNavigationArrows) {
        this._nextButton?.addEventListener(
          'click',
          () => this._manualAdvance(1),
          { signal: this.signal },
        );
        this._prevButton?.addEventListener(
          'click',
          () => this._manualAdvance(-1),
          { signal: this.signal },
        );
      }

      if (this._features.showPlayPause && this._playPauseButton) {
        this._playPauseButton.style.display = 'flex';
        this._playPauseButton.addEventListener(
          'click',
          () => this._togglePlayPause(),
          { signal: this.signal },
        );
        this._playPauseButton.addEventListener(
          'keydown',
          (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              this._togglePlayPause();
            }
          },
          { signal: this.signal },
        );
      }

      if (this._features.enableKeyboardNav) {
        this.addEventListener(
          'keydown',
          (event) => {
            if (
              event.target.closest('input, textarea, [contenteditable="true"]')
            ) {
              return;
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
          },
          { signal: this.signal },
        );
      }

      if (this._features.enablePauseOnHover) {
        this.addEventListener(
          'mouseenter',
          () => {
            this._pauseAutoPlay();
            if (this._features.showProgressBar) {
              this._pauseProgress();
            }
          },
          { signal: this.signal },
        );
        this.addEventListener('mouseleave', () => this._resumeAutoPlay(), {
          signal: this.signal,
        });
      }
    }

    _setupTouch() {
      let startX = 0;
      let endX = 0;
      this.addEventListener(
        'touchstart',
        (e) => {
          startX = e.touches[0].clientX;
        },
        { passive: true, signal: this.signal },
      );
      this.addEventListener(
        'touchmove',
        (e) => {
          endX = e.touches[0].clientX;
        },
        { passive: true, signal: this.signal },
      );
      this.addEventListener(
        'touchend',
        () => {
          const threshold = 50;
          if (startX - endX > threshold) {
            this._manualAdvance(this._isRTL ? -1 : 1);
          } else if (endX - startX > threshold) {
            this._manualAdvance(this._isRTL ? 1 : -1);
          }
        },
        { passive: true, signal: this.signal },
      );
    }

    _setupDotsNavigation() {
      this._dotsContainer
        .querySelectorAll('.dots-numbers-button')
        .forEach((dot, index) => {
          dot.addEventListener(
            'click',
            () => {
              this._goToSlideIndex(index);
              this._restartAutoPlay();
            },
            { signal: this.signal },
          );
        });
    }

    _updateDots() {
      if (!this._dotsContainer) {
        return;
      }
      this._dotsContainer
        .querySelectorAll('.dots-numbers-button')
        .forEach((dot, index) => {
          const isActive = index === this._currentIndex;
          dot.classList.toggle('active', isActive);
          dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
          dot.setAttribute('tabindex', isActive ? '0' : '-1');
        });
      if (this._scrollableDotsWidth > 0) {
        this._centerActiveDot();
      }
    }

    _initScrollableDots() {
      this._dotsContainer.style.maxWidth = `${this._scrollableDotsWidth}px`;
      this._dotsContainer.style.justifyContent = 'flex-start';
      requestAnimationFrame(() => this._centerActiveDot());
    }

    _centerActiveDot() {
      const activeDot = this._dotsContainer?.querySelector(
        '.dots-numbers-button.active',
      );
      if (!activeDot || this._scrollableDotsWidth <= 0) {
        return;
      }
      const containerWidth = this._dotsContainer.offsetWidth;
      const target =
        activeDot.offsetLeft - containerWidth / 2 + activeDot.offsetWidth / 2;
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
        this._intervalId = setInterval(
          () => this._advanceSlide(),
          this._rotationDelay,
        );
        if (this._features.showProgressBar) {
          this._startProgress();
        }
      }
    }

    _pauseAutoPlay() {
      clearInterval(this._intervalId);
      if (this._features.showProgressBar) {
        this._pauseProgress();
      }
    }

    _resumeAutoPlay() {
      if (!this._isPaused) {
        this._startAutoPlay();
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
        if (this._features.showProgressBar) {
          this._pauseProgress();
        }
      } else {
        this._restartAutoPlay();
      }
    }

    _updatePlayPauseButton(isPaused) {
      if (!this._playPauseButton) {
        return;
      }
      this._playPauseButton.innerHTML = isPaused ? PLAY_SVG : PAUSE_SVG;
      this._playPauseButton.setAttribute(
        'aria-label',
        isPaused ? 'Play slideshow' : 'Pause slideshow',
      );
      this._playPauseButton.setAttribute(
        'aria-pressed',
        isPaused ? 'false' : 'true',
      );
    }

    _startProgress() {
      if (!this._progressBar || this._rotationDelay <= 0) {
        return;
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
        this._progressBar.setAttribute(
          'aria-valuenow',
          String(Math.round(progress)),
        );
        if (progress >= 100) {
          clearInterval(this._progressIntervalId);
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
      if (!this._announcer) {
        return;
      }
      const original = this._announcer.textContent;
      this._announcer.textContent = message;
      setTimeout(() => {
        this._announcer.textContent = original;
      }, 1000);
    }

    // -----------------------------------------------------------------
    // Deep linking.
    // -----------------------------------------------------------------

    _initDeepLinking() {
      const enabled = this._items.dataset.deeplinkEnabled === 'true';
      const id = this._items.dataset.deeplinkId || '';
      if (!enabled || !id) {
        return;
      }
      this._deeplinkId = id;

      const apply = (hash) => {
        if (!hash || !hash.startsWith(`#carousel3d-${id}-`)) {
          return;
        }
        const slideNumber = parseInt(hash.split('-').pop(), 10);
        if (
          !Number.isFinite(slideNumber) ||
          slideNumber < 1 ||
          slideNumber > this._cellCount
        ) {
          return;
        }
        this._goToSlideIndex(slideNumber - 1);
      };

      apply(window.location.hash);
      window.addEventListener('hashchange', () => apply(window.location.hash), {
        signal: this.signal,
      });
    }

    _updateDeepLinkHash() {
      if (!this._deeplinkId) {
        return;
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
        console.warn(
          `VVJC: Invalid slide ${slideIndex}. Must be between 1 and ${this._cellCount}`,
        );
        return false;
      }
      this._goToSlideIndex(slideIndex - 1);
      if (!this._isPaused && this._rotationDelay > 0) {
        this._startAutoPlay();
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
      if (!this._isPaused && this._rotationDelay > 0) {
        this._startAutoPlay();
      }
      return true;
    }

    prevSlide() {
      const prev = (this._currentIndex - 1 + this._cellCount) % this._cellCount;
      this._goToSlideIndex(prev);
      if (!this._isPaused && this._rotationDelay > 0) {
        this._startAutoPlay();
      }
      return true;
    }

    pause() {
      if (this._isPaused) {
        return false;
      }
      this._isPaused = true;
      this._pauseAutoPlay();
      this._updatePlayPauseButton(true);
      return true;
    }

    resume() {
      if (!this._isPaused || this._rotationDelay <= 0) {
        return false;
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
