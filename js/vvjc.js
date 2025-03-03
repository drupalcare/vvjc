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
  Drupal.behaviors.VVJCarousel = {
    attach(context) {
      once('VVJCarousel', '.vvjc-items', context).forEach(initCarousel);
    }
  };
  const playIconSVG = `
    <svg class="svg-play" xmlns="http://www.w3.org/2000/svg" viewBox="80 -880 800 800" fill="currentcolor">
      <path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"></path>
    </svg>`;
  const pauseIconSVG = `
    <svg class="svg-pause" xmlns="http://www.w3.org/2000/svg" viewBox="80 -880 800 800" fill="currentcolor"><path d="M360-320h80v-320h-80v320Zm160 0h80v-320h-80v320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"></path></svg>`;

  function initCarousel(carouselC) {
    const container = carouselC.closest('.vvjc');
    const uniqueId = carouselC.id.split('-')[2];
    const state = {
      container: carouselC,
      cells: carouselC.querySelectorAll('.vvjc-item'),
      currentIndex: 0,
      isPaused: false,
      intervalId: null,
      direction: 1,
      rotationDelay: parseInt(container.querySelector('.vvjc-nav').getAttribute('data-time'), 10) || 0,
      slideNumberElement: container.querySelector(`#index-${uniqueId}`),
      prevButton: container.querySelector(`#prev-${uniqueId}`),
      nextButton: container.querySelector(`#next-${uniqueId}`),
      playPauseButton: container.querySelector(`#btn-${uniqueId}`)
    };

    if (state.rotationDelay <= 0) {
      state.isPaused = true;
      if (state.playPauseButton) {
        state.playPauseButton.classList.remove('pause');
        state.playPauseButton.classList.add('play');
        updatePlayPauseButton(state, true);
      }
    }

    buildCarousel(state);
    setupControls(state);
    updateSlide(state);
    startAutoPlay(state);
  }

  function buildCarousel(state) {
    const {
      cells
      , container
    } = state;
    const cellCount = cells.length;
    const theta = 360 / cellCount;
    const radius = Math.round(container.offsetWidth / 2 / Math.tan(Math.PI / cellCount));
    cells.forEach((cell, i) => {
      cell.style.opacity = '1';
      cell.style.transform = `rotateY(${theta * i}deg) translateZ(${radius}px)`;
    });
    cells[0].classList.add('active');
    if (state.prevButton) {
      state.prevButton.classList.add('hidden');
      state.prevButton.setAttribute('tabindex', '-1');
    }
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

    if (state.rotationDelay > 0) {
      state.container.addEventListener('mouseenter', () => pauseAutoPlay(state));
      state.container.addEventListener('mouseleave', () => resumeAutoPlay(state));
    }
  }

  function manualAdvance(state, direction) {
    state.direction = direction;
    advanceSlide(state);
    if (!state.isPaused) {
      restartAutoPlay(state);
    }
  }

  function advanceSlide(state) {
    const {
      cells
    } = state;
    const cellCount = cells.length;
    state.currentIndex += state.direction;
    if (state.currentIndex >= cellCount) {
      state.currentIndex = cellCount - 1; // Stop at last
      state.direction = -1;
    } else if (state.currentIndex < 0) {
      state.currentIndex = 0; // Stop at first
      state.direction = 1;
    }
    updateSlide(state);
  }

  function updateSlide(state) {
    const {
      cells
      , currentIndex
      , slideNumberElement
      , prevButton
      , nextButton
    } = state;
    const cellCount = cells.length;
    const theta = 360 / cellCount;
    const radius = Math.round(state.container.offsetWidth / 2 / Math.tan(Math.PI / cellCount));
    const angle = theta * currentIndex * -1;
    state.container.style.transition = 'transform 0.8s ease-in-out';
    state.container.style.transform = `translateZ(${-radius}px) rotateY(${angle}deg)`;
    cells.forEach((cell, index) => {
      const isActive = index === currentIndex;
      cell.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      cell.setAttribute('tabindex', isActive ? '0' : '-1');
      updateFocusableElements(cell, isActive);
      cell.classList.toggle('active', isActive);
    });
    if (slideNumberElement) {
      slideNumberElement.setAttribute('aria-label', `Slide ${currentIndex + 1} of ${cellCount}`);
      slideNumberElement.textContent = currentIndex + 1;
    }
    if (prevButton) {
      if (currentIndex === 0) {
        prevButton.classList.add('hidden');
        prevButton.setAttribute('tabindex', '-1');
      } else {
        prevButton.classList.remove('hidden');
        prevButton.setAttribute('tabindex', '0');
      }
    }
    if (nextButton) {
      if (currentIndex === cellCount - 1) {
        nextButton.classList.add('hidden');
        nextButton.setAttribute('tabindex', '-1');
      } else {
        nextButton.classList.remove('hidden');
        nextButton.setAttribute('tabindex', '0');
      }
    }
  }

  function updateFocusableElements(parentElement, isActive) {
    parentElement.querySelectorAll('a, button').forEach((el) => {
      el.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }

  function startAutoPlay(state) {
    clearInterval(state.intervalId);
    if (state.rotationDelay > 0) {
      state.intervalId = setInterval(() => advanceSlide(state), state.rotationDelay);
    }
  }

  function pauseAutoPlay(state) {
    clearInterval(state.intervalId);
    state.isPaused = true;
  }

  function resumeAutoPlay(state) {
    if (state.rotationDelay > 0 && state.isPaused) {
      state.intervalId = setInterval(() => advanceSlide(state), state.rotationDelay);
      state.isPaused = false;
    }
  }

  function restartAutoPlay(state) {
    clearInterval(state.intervalId);
    if (!state.isPaused) {
      startAutoPlay(state);
    }
  }

  function togglePlayPause(state) {
    if (state.isPaused) {
      state.isPaused = false;
      restartAutoPlay(state);
    } else {
      state.isPaused = true;
      clearInterval(state.intervalId);
    }
    updatePlayPauseButton(state, state.isPaused);
  }

  function updatePlayPauseButton(state, isPaused) {
    if (!state.playPauseButton) {
      return;
    }
    state.playPauseButton.innerHTML = isPaused ? playIconSVG : pauseIconSVG;
    state.playPauseButton.setAttribute('aria-label', isPaused ? 'Play slideshow' : 'Pause slideshow');
    state.playPauseButton.setAttribute('aria-pressed', isPaused ? 'false' : 'true');
  }
})(Drupal, drupalSettings, once);
