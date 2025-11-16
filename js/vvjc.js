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
    
    // Read configuration from data attributes (security: data attributes are sanitized by Drupal/Twig).
    const config = {
      showProgressBar: carousel.getAttribute('data-show-progress-bar') === 'true',
      showDotsNavigation: carousel.getAttribute('data-show-dots-navigation') === 'true',
      enableKeyboardNav: carousel.getAttribute('data-enable-keyboard-nav') === 'true',
      enableTouchSwipe: carousel.getAttribute('data-enable-touch-swipe') === 'true',
      enablePauseOnHover: carousel.getAttribute('data-enable-pause-on-hover') === 'true',
      enableScreenReader: carousel.getAttribute('data-enable-screen-reader') === 'true',
      pauseOnReducedMotion: carousel.getAttribute('data-pause-on-reduced-motion') === 'true',
      showNavigationArrows: carousel.getAttribute('data-show-navigation-arrows') === 'true',
      showPlayPause: carousel.getAttribute('data-show-play-pause') === 'true',
      showSlideCounter: carousel.getAttribute('data-show-slide-counter') === 'true',
    };
    
    const state = {
      container: carousel,
      cells: carousel.querySelectorAll('.vvjc-item'),
      currentIndex: 0,
      isPaused: false,
      intervalId: null,
      progressIntervalId: null,
      direction: 1,
      rotationDelay: parseInt(container.querySelector('.vvjc-nav')?.getAttribute('data-time') || '0', 10),
      slideNumberElement: container.querySelector(`#index-${uniqueId}`),
      totalSlidesElement: container.querySelector('.total-slides'),
      prevButton: container.querySelector(`#prev-${uniqueId}`),
      nextButton: container.querySelector(`#next-${uniqueId}`),
      playPauseButton: container.querySelector(`#btn-${uniqueId}`),
      progressBar: container.querySelector('.progressbar'),
      announcer: container.querySelector('.announcer'),
      dotsContainer: container.querySelector('.vvjc-dots-nav'),
      config: config,
      uniqueId: uniqueId,
    };
    
    const initiallyVisible = isMostlyVisible(state.container);
    previousVisibility.set(carousel.id, initiallyVisible);
    carouselStates.set(carousel.id, state);
    
    if (state.rotationDelay <= 0) {
      state.isPaused = true;
      updatePlayPauseButton(state, true);
    }
    
    // Check for reduced motion preference.
    if (config.pauseOnReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      state.isPaused = true;
      updatePlayPauseButton(state, true);
      if (config.enableScreenReader && state.announcer) {
        announceMessage(state, 'Carousel paused due to reduced motion preference');
      }
    }
    
    buildCarousel(state);
    setupControls(state);
    
    // Initialize deep linking if enabled
    initializeDeepLinking(state);
    
    if (config.enableTouchSwipe) {
      setupTouchEvents(state);
    }
    
    if (config.showDotsNavigation && state.dotsContainer) {
      setupDotsNavigation(state);
    }
    
    updateSlide(state);
    
    if (initiallyVisible && !state.isPaused) {
      startAutoPlay(state);
    }
  }

  function buildCarousel(state) {
    const {
      cells,
      container,
      config
    } = state;
    const theta = 360 / cells.length;
    const radius = Math.round(container.offsetWidth / 2 / Math.tan(Math.PI / cells.length));
    const reducedMotion = config.pauseOnReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cells.forEach((cell, i) => {
      cell.style.opacity = '1';
      cell.style.transform = `rotateY(${theta * i}deg) translateZ(${radius}px)`;
      if (reducedMotion) {
        cell.style.transition = 'none';
      }
    });
    if (reducedMotion) {
      container.style.transition = 'none';
      container.classList.add('reduced-motion');
    }
    cells[0].classList.add('active');
    updateNavVisibility(state);
  }

  function setupControls(state) {
    const {config} = state;
    
    // Navigation arrows - conditional based on config.
    if (config.showNavigationArrows) {
      if (state.nextButton) {
        state.nextButton.addEventListener('click', () => manualAdvance(state, 1));
      }
      if (state.prevButton) {
        state.prevButton.addEventListener('click', () => manualAdvance(state, -1));
      }
    }
    
    // Play/pause button - conditional based on config.
    if (config.showPlayPause && state.playPauseButton) {
      state.playPauseButton.style.display = 'flex';
      state.playPauseButton.addEventListener('click', () => togglePlayPause(state));
      state.playPauseButton.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          togglePlayPause(state);
        }
      });
    }
    
    // Enhanced keyboard navigation - conditional based on config.
    if (config.enableKeyboardNav) {
      state.container.addEventListener('keydown', (event) => {
        // Skip if focus is in an input element.
        if (event.target.closest('input, textarea, [contenteditable="true"]')) {
          return;
        }
        
        switch (event.key) {
          case 'ArrowRight':
            event.preventDefault();
            manualAdvance(state, 1);
            break;
          case 'ArrowLeft':
            event.preventDefault();
            manualAdvance(state, -1);
            break;
          case ' ':
          case 'Spacebar':
            if (config.showPlayPause) {
              event.preventDefault();
              togglePlayPause(state);
            }
            break;
          case 'Home':
            event.preventDefault();
            goToSlide(state, 0);
            restartAutoPlay(state);
            break;
          case 'End':
            event.preventDefault();
            goToSlide(state, state.cells.length - 1);
            restartAutoPlay(state);
            break;
        }
      });
    }
    
    // Pause on hover - conditional based on config.
    if (config.enablePauseOnHover) {
      state.container.addEventListener('mouseenter', () => {
        pauseAutoPlay(state);
        if (config.showProgressBar) {
          pauseProgress(state);
        }
      });
      state.container.addEventListener('mouseleave', () => {
        resumeAutoPlay(state);
      });
    }
  }

  function manualAdvance(state, direction) {
    state.direction = direction;
    advanceSlide(state);
    restartAutoPlay(state);
  }

  function goToSlide(state, targetIndex) {
    // Security: Validate index bounds.
    const cellCount = state.cells.length;
    if (targetIndex < 0 || targetIndex >= cellCount) {
      return;
    }
    
    state.currentIndex = targetIndex;
    
    // Determine direction based on distance (for natural rotation direction).
    const currentIndex = state.currentIndex;
    if (targetIndex > currentIndex) {
      state.direction = 1;
    } else if (targetIndex < currentIndex) {
      state.direction = -1;
    }
    
    updateSlide(state);
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
      container,
      config
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
    
    // Update slide counter - conditional based on config.
    if (config.showSlideCounter && slideNumberElement) {
      slideNumberElement.textContent = currentIndex + 1;
    }
    
    // Update dots navigation - conditional based on config.
    if (config.showDotsNavigation) {
      updateDotsNavigation(state);
    }
    
    // Announce to screen readers - conditional based on config.
    if (config.enableScreenReader && state.announcer) {
      announceSlide(state);
    }
    
    // Restart progress bar - conditional based on config.
    if (config.showProgressBar && state.rotationDelay > 0 && !state.isPaused) {
      startProgress(state);
    }
    
    // Update deep linking hash if enabled
    if (state.updateHash) {
      state.updateHash(currentIndex);
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
      cells,
      config
    } = state;
    
    // Only update arrow visibility if arrows are enabled.
    if (!config.showNavigationArrows) {
      return;
    }
    
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
      if (state.config.showProgressBar) {
        pauseProgress(state);
      }
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
    
    // Security: Use passive listeners for better performance.
    state.container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, {passive: true});
    
    state.container.addEventListener('touchmove', (e) => {
      touchEndX = e.touches[0].clientX;
    }, {passive: true});
    
    state.container.addEventListener('touchend', () => {
      handleSwipe(state, touchStartX, touchEndX);
    }, {passive: true});
  }

  function handleSwipe(state, startX, endX) {
    // Security: Validate numeric inputs.
    if (typeof startX !== 'number' || typeof endX !== 'number') {
      return;
    }
    
    const swipeThreshold = 50;
    if (startX - endX > swipeThreshold) {
      manualAdvance(state, 1);
    } else if (endX - startX > swipeThreshold) {
      manualAdvance(state, -1);
    }
  }

  function startAutoPlay(state) {
    clearInterval(state.intervalId);
    if (state.rotationDelay > 0 && !state.isPaused) {
      state.intervalId = setInterval(() => advanceSlide(state), state.rotationDelay);
      
      // Start progress bar if enabled.
      if (state.config.showProgressBar) {
        startProgress(state);
      }
    }
  }

  function pauseAutoPlay(state) {
    clearInterval(state.intervalId);
    
    // Also pause progress bar if enabled.
    if (state.config.showProgressBar) {
      pauseProgress(state);
    }
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

  /**
   * Setup dots navigation click handlers.
   */
  function setupDotsNavigation(state) {
    if (!state.dotsContainer) {
      return;
    }
    
    const dotButtons = state.dotsContainer.querySelectorAll('.dots-numbers-button');
    dotButtons.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        goToSlide(state, index);
        restartAutoPlay(state);
      });
    });
  }

  /**
   * Update dots navigation active state.
   */
  function updateDotsNavigation(state) {
    if (!state.dotsContainer) {
      return;
    }
    
    const dotButtons = state.dotsContainer.querySelectorAll('.dots-numbers-button');
    dotButtons.forEach((dot, index) => {
      const isActive = index === state.currentIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      dot.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }

  /**
   * Announce slide change to screen readers.
   */
  function announceSlide(state) {
    if (!state.announcer) {
      return;
    }
    
    const currentSlide = state.currentIndex + 1;
    const totalSlides = state.cells.length;
    state.announcer.textContent = `Slide ${currentSlide} of ${totalSlides}`;
  }

  /**
   * Announce custom message to screen readers.
   */
  function announceMessage(state, message) {
    if (!state.announcer) {
      return;
    }
    
    // Security: Use textContent to prevent XSS.
    const originalText = state.announcer.textContent;
    state.announcer.textContent = message;
    
    // Restore original text after brief delay.
    setTimeout(() => {
      state.announcer.textContent = originalText;
    }, 1000);
  }

  /**
   * Start progress bar animation.
   */
  function startProgress(state) {
    if (!state.progressBar || state.rotationDelay <= 0) {
      return;
    }
    
    // Clear any existing progress interval.
    clearInterval(state.progressIntervalId);
    
    // Reset progress bar.
    state.progressBar.style.setProperty('--progress', '0%');
    state.progressBar.setAttribute('aria-valuenow', '0');
    
    const startTime = Date.now();
    
    // Performance: Use 50ms interval for smooth animation without excessive CPU.
    state.progressIntervalId = setInterval(() => {
      if (state.isPaused) {
        clearInterval(state.progressIntervalId);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / state.rotationDelay) * 100);
      
      state.progressBar.style.setProperty('--progress', `${progress}%`);
      state.progressBar.setAttribute('aria-valuenow', Math.round(progress));
      
      if (progress >= 100) {
        clearInterval(state.progressIntervalId);
      }
    }, 50);
  }

  /**
   * Pause progress bar animation.
   */
  function pauseProgress(state) {
    if (state.progressIntervalId) {
      clearInterval(state.progressIntervalId);
      state.progressIntervalId = null;
    }
  }

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
  
  // Performance: Use debounced event listeners to prevent excessive calls.
  document.addEventListener('scroll', debounce(handleCarouselVisibility, 200));
  window.addEventListener('orientationchange', debounce(handleResizeOrRotate, 200));
  window.addEventListener('resize', debounce(() => {
    handleCarouselVisibility();
    handleResizeOrRotate();
  }, 200));

  /**
   * Deep linking functionality
   */
  function initializeDeepLinking(state) {
    const container = state.container;
    const deeplinkEnabled = container.getAttribute('data-deeplink-enabled') === 'true';
    const deeplinkId = container.getAttribute('data-deeplink-id');

    if (!deeplinkEnabled || !deeplinkId) {
      return;
    }

    // Check URL hash on page load
    const hash = window.location.hash;
    if (hash && hash.startsWith(`#carousel3d-${deeplinkId}-`)) {
      const slideNumber = parseInt(hash.split('-').pop(), 10);
      if (slideNumber >= 1 && slideNumber <= state.cells.length) {
        // Navigate to the slide (0-indexed)
        goToSlide(state, slideNumber - 1);
      }
    }

    // Update URL hash when navigating
    state.updateHash = (slideIndex) => {
      const newHash = `#carousel3d-${deeplinkId}-${slideIndex + 1}`;
      // Use replaceState to avoid cluttering browser history
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', newHash);
      } else {
        window.location.hash = newHash;
      }
    };

    // Listen for hash changes (browser back/forward)
    window.addEventListener('hashchange', () => {
      const currentHash = window.location.hash;
      if (currentHash && currentHash.startsWith(`#carousel3d-${deeplinkId}-`)) {
        const slideNumber = parseInt(currentHash.split('-').pop(), 10);
        if (slideNumber >= 1 && slideNumber <= state.cells.length) {
          goToSlide(state, slideNumber - 1);
        }
      }
    });
  }

  /**
   * Global utility functions for external access
   */
  Drupal.vvjc = Drupal.vvjc || {};

  /**
   * Get carousel instance by container element or selector.
   */
  Drupal.vvjc.getInstance = function(containerOrSelector) {
    let container;

    if (typeof containerOrSelector === 'string') {
      container = document.querySelector(containerOrSelector);
    } else {
      container = containerOrSelector;
    }

    if (!container) {
      return null;
    }

    // Find the .vvjc-items element
    const carouselItems = container.classList.contains('vvjc-items') 
      ? container 
      : container.querySelector('.vvjc-items');

    if (!carouselItems) {
      return null;
    }

    return carouselStates.get(carouselItems.id) || null;
  };

  /**
   * Get all active carousel instances.
   */
  Drupal.vvjc.getAllInstances = function() {
    return Array.from(carouselStates.values());
  };

  /**
   * Helper function to get carousel container by identifier.
   */
  function getContainerByIdentifier(identifier) {
    let container;

    // Try deep link identifier first (if not a CSS selector)
    if (!identifier.startsWith('.') && !identifier.startsWith('#')) {
      container = document.querySelector(`[data-deeplink-id="${identifier}"]`);
    }

    // Fallback to CSS selector
    if (!container) {
      container = document.querySelector(identifier);
    }

    return container;
  }

  /**
   * Helper function to get carousel state from identifier.
   */
  function getStateByIdentifier(identifier) {
    const container = getContainerByIdentifier(identifier);

    if (!container) {
      return null;
    }

    // Get the carousel items container
    const carouselItems = container.classList.contains('vvjc-items')
      ? container
      : container.querySelector('.vvjc-items');

    if (!carouselItems) {
      return null;
    }

    return carouselStates.get(carouselItems.id) || null;
  }

  /**
   * Navigate to a specific slide by identifier.
   */
  Drupal.vvjc.goToSlide = function(identifier, slideIndex) {
    const state = getStateByIdentifier(identifier);

    if (!state) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(`VVJC: Carousel "${identifier}" not found`);
      }
      return false;
    }

    if (slideIndex < 1 || slideIndex > state.cells.length) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(`VVJC: Invalid slide index ${slideIndex}. Must be between 1 and ${state.cells.length}`);
      }
      return false;
    }

    goToSlide(state, slideIndex - 1);
    if (!state.isPaused && state.rotationDelay > 0) {
      startAutoPlay(state);
    }
    return true;
  };

  /**
   * Get the current slide index for a carousel.
   */
  Drupal.vvjc.getCurrentSlide = function(identifier) {
    const state = getStateByIdentifier(identifier);
    return state ? state.currentIndex + 1 : null;
  };

  /**
   * Get total number of slides in a carousel.
   */
  Drupal.vvjc.getTotalSlides = function(identifier) {
    const state = getStateByIdentifier(identifier);
    return state ? state.cells.length : null;
  };

  /**
   * Navigate to next slide.
   */
  Drupal.vvjc.nextSlide = function(identifier) {
    const state = getStateByIdentifier(identifier);

    if (state) {
      const nextIndex = (state.currentIndex + 1) % state.cells.length;
      goToSlide(state, nextIndex);
      if (!state.isPaused && state.rotationDelay > 0) {
        startAutoPlay(state);
      }
      return true;
    }

    return false;
  };

  /**
   * Navigate to previous slide.
   */
  Drupal.vvjc.prevSlide = function(identifier) {
    const state = getStateByIdentifier(identifier);

    if (state) {
      const prevIndex = (state.currentIndex - 1 + state.cells.length) % state.cells.length;
      goToSlide(state, prevIndex);
      if (!state.isPaused && state.rotationDelay > 0) {
        startAutoPlay(state);
      }
      return true;
    }

    return false;
  };

  /**
   * Pause a specific carousel.
   */
  Drupal.vvjc.pause = function(identifier) {
    const state = getStateByIdentifier(identifier);

    if (state && !state.isPaused) {
      state.isPaused = true;
      pauseAutoPlay(state);
      updatePlayPauseButton(state, true);
      return true;
    }

    return false;
  };

  /**
   * Resume a specific carousel.
   */
  Drupal.vvjc.resume = function(identifier) {
    const state = getStateByIdentifier(identifier);

    if (state && state.isPaused && state.rotationDelay > 0) {
      state.isPaused = false;
      startAutoPlay(state);
      updatePlayPauseButton(state, false);
      return true;
    }

    return false;
  };

  /**
   * Pause all carousels on the page.
   */
  Drupal.vvjc.pauseAll = function() {
    carouselStates.forEach(state => {
      if (!state.isPaused) {
        state.isPaused = true;
        pauseAutoPlay(state);
        updatePlayPauseButton(state, true);
      }
    });
  };

  /**
   * Resume all carousels on the page.
   */
  Drupal.vvjc.resumeAll = function() {
    carouselStates.forEach(state => {
      if (state.isPaused && state.rotationDelay > 0) {
        state.isPaused = false;
        startAutoPlay(state);
        updatePlayPauseButton(state, false);
      }
    });
  };

})(Drupal, drupalSettings, once);
