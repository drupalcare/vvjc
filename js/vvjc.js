/**
 * @file
 * Views Vanilla JavaScript 3D Carousel
 *
 * Filename:     vvjc.js
 * Website:      https://www.flashwebcenter.com
 * Developer:    Alaa Haddad https://www.alaahaddad.com.
 */
((Drupal, drupalSettings, once) => {
  'use strict';
  const carouselStates = new Map();
  const previousVisibility = new Map();
  let lastKnownWidth = window.innerWidth;
  let resizeTimeout;

  function debounce(func, delay) {
    let timer;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(func, delay);
    };
  }
  const playIconSVG = `
    <svg class="svg-play" xmlns="http://www.w3.org/2000/svg" viewBox="80 -880 800 800" fill="currentcolor">
      <path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"></path>
    </svg>`;
  const pauseIconSVG = `
    <svg class="svg-pause" xmlns="http://www.w3.org/2000/svg" viewBox="80 -880 800 800" fill="currentcolor"><path d="M360-320h80v-320h-80v320Zm160 0h80v-320h-80v320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"></path></svg>`;
  Drupal.behaviors.VVJCarousel = {
    attach(context) {
      once('VVJCarousel', '.vvjc-items', context).forEach(initCarousel);
      if (!document.vvjCarouselVisibilityAttached) {
        document.vvjCarouselVisibilityAttached = true;
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
    }
  };

  function initCarousel(carousel) {
    const container = carousel.closest('.vvjc');
    const uniqueId = carousel.id.split('-')[2];
    const state = {
      container: carousel,
      cells: carousel.querySelectorAll('.vvjc-item'),
      currentIndex: 0,
      isPaused: false,
      intervalId: null,
      direction: 1,
      rotationDelay: parseInt(container.querySelector('.vvjc-nav')?.getAttribute('data-time') || '0', 10),
      slideNumberElement: container.querySelector(`#index-${uniqueId}`),
      prevButton: container.querySelector(`#prev-${uniqueId}`),
      nextButton: container.querySelector(`#next-${uniqueId}`),
      playPauseButton: container.querySelector(`#btn-${uniqueId}`)
    };
    const initiallyVisible = isMostlyVisible(state.container);
    previousVisibility.set(carousel.id, initiallyVisible);
    carouselStates.set(carousel.id, state);
    if (state.rotationDelay <= 0) {
      state.isPaused = true;
      updatePlayPauseButton(state, true);
    }
    buildCarousel(state);
    setupControls(state);
    setupTouchEvents(state);
    updateSlide(state);
    if (initiallyVisible && !state.isPaused) {
      startAutoPlay(state);
    }
  }

  function buildCarousel(state) {
    const {
      cells,
      container
    } = state;
    const theta = 360 / cells.length;
    const radius = Math.round(container.offsetWidth / 2 / Math.tan(Math.PI / cells.length));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cells.forEach((cell, i) => {
      cell.style.opacity = '1';
      cell.style.transform = `rotateY(${theta * i}deg) translateZ(${radius}px)`;
      if (reducedMotion) {
        cell.style.transition = 'none';
      }
    });
    if (reducedMotion) {
      container.style.transition = 'none';
    }
    cells[0].classList.add('active');
    updateNavVisibility(state);
  }

  function setupControls(state) {
    if (state.nextButton) {
      state.nextButton.addEventListener('click', () => manualAdvance(state, 1));
    }
    if (state.prevButton) {
      state.prevButton.addEventListener('click', () => manualAdvance(state, -1));
    }
    if (state.playPauseButton) {
      state.playPauseButton.style.display = 'flex';
      state.playPauseButton.addEventListener('click', () => togglePlayPause(state));
      state.playPauseButton.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          togglePlayPause(state);
        }
      });
    }
    state.container.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        manualAdvance(state, 1);
      } else if (event.key === 'ArrowLeft') {
        manualAdvance(state, -1);
      }
    });
    state.container.addEventListener('mouseenter', () => pauseAutoPlay(state));
    state.container.addEventListener('mouseleave', () => resumeAutoPlay(state));
  }

  function manualAdvance(state, direction) {
    state.direction = direction;
    advanceSlide(state);
    restartAutoPlay(state);
  }

  function advanceSlide(state) {
    const {
      cells
    } = state;
    const cellCount = cells.length;
    state.currentIndex += state.direction;
    if (state.currentIndex >= cellCount) {
      // Bounce immediately to previous slide.
      state.currentIndex = cellCount - 2;
      state.direction = -1;
    } else if (state.currentIndex < 0) {
      // Bounce immediately to next slide.
      state.currentIndex = 1;
      state.direction = 1;
    }
    updateSlide(state);
  }

  function updateSlide(state) {
    const {
      cells,
      currentIndex,
      slideNumberElement,
      container
    } = state;
    const theta = 360 / cells.length;
    const radius = Math.round(container.offsetWidth / 2 / Math.tan(Math.PI / cells.length));
    const angle = theta * currentIndex * -1;
    container.style.transition = 'transform 0.8s ease-in-out';
    container.style.transform = `translateZ(${-radius}px) rotateY(${angle}deg)`;
    cells.forEach((cell, index) => {
      const isActive = index === currentIndex;
      cell.setAttribute('aria-hidden', !isActive);
      updateFocusableElements(cell, isActive);
      if (isActive) {
        cell.classList.add('active');
      } else {
        cell.classList.remove('active');
      }
    });
    if (slideNumberElement) {
      slideNumberElement.setAttribute('aria-label', `Slide ${currentIndex + 1} of ${cells.length}`);
      slideNumberElement.textContent = currentIndex + 1;
    }
    updateNavVisibility(state);
  }

  function updateFocusableElements(cell, isActive) {
    cell.querySelectorAll('a, button').forEach(el => {
      el.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }

  function updateNavVisibility(state) {
    const {
      currentIndex,
      prevButton,
      nextButton,
      cells
    } = state;
    if (prevButton) {
      if (currentIndex === 0) {
        prevButton.classList.add('vvjc-hidden');
        prevButton.setAttribute('tabindex', '-1');
      } else {
        prevButton.classList.remove('vvjc-hidden');
        prevButton.setAttribute('tabindex', '0');
      }
    }
    if (nextButton) {
      if (currentIndex === cells.length - 1) {
        nextButton.classList.add('vvjc-hidden');
        nextButton.setAttribute('tabindex', '-1');
      } else {
        nextButton.classList.remove('vvjc-hidden');
        nextButton.setAttribute('tabindex', '0');
      }
    }
  }

  function togglePlayPause(state) {
    state.isPaused = !state.isPaused;
    updatePlayPauseButton(state, state.isPaused);
    if (state.isPaused) {
      pauseAutoPlay(state);
    } else {
      restartAutoPlay(state);
    }
  }

  function updatePlayPauseButton(state, isPaused) {
    if (!state.playPauseButton) {
      return;
    }
    state.playPauseButton.innerHTML = isPaused ? playIconSVG : pauseIconSVG;
    state.playPauseButton.setAttribute('aria-label', isPaused ? 'Play slideshow' : 'Pause slideshow');
    state.playPauseButton.setAttribute('aria-pressed', isPaused ? 'false' : 'true');
  }

  function setupTouchEvents(state) {
    let touchStartX = 0;
    let touchEndX = 0;
    state.container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    });
    state.container.addEventListener('touchmove', (e) => {
      touchEndX = e.touches[0].clientX;
    });
    state.container.addEventListener('touchend', () => {
      handleSwipe(state, touchStartX, touchEndX);
    });
  }

  function handleSwipe(state, startX, endX) {
    const swipeThreshold = 50; // Minimum distance to count as a swipe.
    if (startX - endX > swipeThreshold) {
      // Swiped left = next slide.
      manualAdvance(state, 1);
    } else if (endX - startX > swipeThreshold) {
      // Swiped right = previous slide.
      manualAdvance(state, -1);
    }
  }

  function startAutoPlay(state) {
    clearInterval(state.intervalId);
    if (state.rotationDelay > 0 && !state.isPaused) {
      state.intervalId = setInterval(() => advanceSlide(state), state.rotationDelay);
    }
  }

  function pauseAutoPlay(state) {
    clearInterval(state.intervalId);
  }

  function resumeAutoPlay(state) {
    if (!state.isPaused) {
      startAutoPlay(state);
    }
  }

  function handleVisibilityChange() {
    carouselStates.forEach((state, id) => {
      const currentlyVisible = !document.hidden && isMostlyVisible(state.container);
      if (currentlyVisible !== previousVisibility.get(id)) {
        previousVisibility.set(id, currentlyVisible);
        currentlyVisible ? startAutoPlay(state) : pauseAutoPlay(state);
      }
    });
  }

  function restartAutoPlay(state) {
    pauseAutoPlay(state);
    startAutoPlay(state);
  }
  const resetCarousel = () => {
    carouselStates.forEach((state) => {
      state.currentIndex = 0;
      state.direction = 1;
      buildCarousel(state);
      updateSlide(state);
      restartAutoPlay(state);
    });
  };
  const isMostlyVisible = (element) => {
    const rect = element.getBoundingClientRect();
    const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    return visibleHeight / rect.height > 0.2;
  };

  function handleCarouselVisibility() {
    carouselStates.forEach((state, carouselId) => {
      const currentlyVisible = isMostlyVisible(state.container);
      const wasVisible = previousVisibility.get(carouselId) ?? false;
      if (currentlyVisible !== wasVisible) {
        previousVisibility.set(carouselId, currentlyVisible);
        if (currentlyVisible && !state.isPaused) {
          startAutoPlay(state);
        } else {
          pauseAutoPlay(state);
        }
      }
    });
  }
  const handleResizeOrRotate = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newWidth = window.innerWidth;
      if (Math.abs(newWidth - lastKnownWidth) >= 50) {
        resetCarousel();
        lastKnownWidth = newWidth;
      }
    }, 200);
  };
  document.addEventListener('scroll', debounce(handleCarouselVisibility, 200));
  window.addEventListener('orientationchange', debounce(handleResizeOrRotate, 200));
  window.addEventListener('resize', debounce(() => {
    handleCarouselVisibility();
    handleResizeOrRotate();
  }, 200));
})(Drupal, drupalSettings, once);
