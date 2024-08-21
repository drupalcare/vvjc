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
    attach: function(context, settings) {
      let intervalIds = new Map();
      const carousels = once('vvjCarousel', '.vvjc-items', context);
      if (!carousels.length) {
        return;
      }

      let currentWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      let autoHelper = [];
      let n = 0;
      let isPaused = false;

      const playIconSVG = `
        <svg class="svg-play" xmlns="http://www.w3.org/2000/svg" viewBox="80 -880 800 800" fill="inherit">
          <path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"></path>
        </svg>`;

      const pauseIconSVG = `
        <svg class="svg-pause" xmlns="http://www.w3.org/2000/svg" viewBox="80 -880 800 800" fill="#e8eaed"><path d="M360-320h80v-320h-80v320Zm160 0h80v-320h-80v320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"></path></svg>`;

      // Utility function to update tabindex based on parent element's attributes
      const updateTabIndexForElements = (parentElement) => {
        const focusableElements = parentElement.querySelectorAll('button, a');
        focusableElements.forEach(el => {
          if (parentElement.getAttribute('aria-hidden') === 'true') {
            el.setAttribute('tabindex', '-1');
          } else if (parentElement.getAttribute('tabindex') === '0') {
            el.setAttribute('tabindex', '0');
          } else {
            el.removeAttribute('tabindex');
          }
        });
      };

      // Centralized Interval Management
      const manageAutoSlideInterval = (carouselId, action, cTime) => {
        let intervalId = intervalIds.get(carouselId);
        if (action === 'clear' && intervalId) {
          clearInterval(intervalId);
          intervalIds.delete(carouselId);
        }
        else if (action === 'start' && cTime > 0 && !isPaused) {
          intervalId = setInterval(() => autoPlay(carouselId), cTime);
          intervalIds.set(carouselId, intervalId);
        }
      };

      const getCarInfo = (carouselId) => {
        const carousel = context.getElementById(carouselId);
        const cells = carousel.querySelectorAll(`#${carouselId}>.vvjc-item`);
        const cellCount = cells.length;
        const cellWidth = carousel.offsetWidth;
        const theta = 360 / cellCount;
        const radius = Math.round(cellWidth / 2 / Math.tan(Math.PI / cellCount));
        const rawNo = carouselId.split('-')[2];
        return [carousel, cells, cellCount, cellWidth, theta, radius, rawNo];
      };

      const getThisId = th => `vvjc-items-${parseInt(th.slice(5))}`;

      let rotateCarousel = (carouselId, n) => {
        let [carousel, cells, cellCount, , theta, radius] = getCarInfo(carouselId);
        let angle = theta * n * -1;
        carousel.style.transition = 'transform 0.8s ease-in-out';
        carousel.style.transform = `translateZ(${-radius}px) rotateY(${angle}deg)`;

        if (n >= cellCount) n = 0;
        if (n < 0) n = cellCount - 1;

        cells.forEach((cell, index) => {
          if (index === n) {
            cell.setAttribute('aria-hidden', 'false');
            cell.setAttribute('tabindex', '0');
          } else {
            cell.setAttribute('aria-hidden', 'true');
            cell.setAttribute('tabindex', '-1');
          }

          updateTabIndexForElements(cell);
        });

        const slideNumberElement = context.querySelector(`#index-${carouselId.split('-')[2]}`);
        if (slideNumberElement) {
          slideNumberElement.classList.add('rotating');
          slideNumberElement.setAttribute('aria-label', `Slide ${n + 1} of ${cellCount}`);

          if (!isNaN(n)) {
            const numberElement = slideNumberElement.querySelector('.number');
            if (numberElement) {
              setTimeout(() => {
                numberElement.innerHTML = n + 1;
              }, 200);
            }
          } else {
            console.error('Invalid slide index:', n);
            slideNumberElement.innerHTML = '<span class="number">1</span>';
          }

          setTimeout(() => {
            // .vvjc .vvjc-nav span.current-slide-number.rotating
            slideNumberElement.classList.remove('rotating');
          }, 400);
        }
      };


      let buildCarousel = (carouselId) => {
        let [_, cells, cellCount, , theta, radius, rawNo] = getCarInfo(carouselId);
        let indexNo = context.getElementById('index-' + rawNo);
        let prevBtnId = context.getElementById('prev-' + rawNo);
        let nextBtnId = context.getElementById('next-' + rawNo);
        for (let i = 0; i < cellCount; i++) {
          cells[i].style.opacity = i < cellCount ? 1 : 0;
          cells[i].style.transform = i < cellCount ? `rotateY(${theta * i}deg) translateZ(${radius}px)` : "none";
        }
        cells[0].classList.add('active');
        indexNo.innerHTML = 1;
        nextBtnId.classList.remove('hidden');
        nextBtnId.removeAttribute('tabindex');
        prevBtnId.classList.add('hidden');
        prevBtnId.setAttribute('tabindex', '-1');
        rotateCarousel(carouselId, 0);
      };

      const backward = (carouselId) => {
        const cells = context.querySelectorAll(`#${carouselId}>.vvjc-item`);
        const cellCount = cells.length;
        const btnId = carouselId.split('-')[2];
        const prevBtnId = context.getElementById(`prev-${btnId}`);
        const nextBtnId = context.getElementById(`next-${btnId}`);
        const indexNo = context.getElementById(`index-${btnId}`);
        for (let i = 0; i < cellCount; i++) {
          if (!cells[i].classList.contains('active')) continue;
          if (i === 0) {
            const prevOn = parseInt(`${btnId}00`);
            const prevOff = parseInt(`${btnId}01`);
            const nextOn = parseInt(`${btnId}11`);
            const nextOff = parseInt(`${btnId}10`);
            if (autoHelper.includes(prevOn)) {
              autoHelper = autoHelper.map((item) => {
                if (item === prevOn) return prevOff;
                if (item === nextOff) return nextOn;
                return item;
              });
            }
            break;
          }
          nextBtnId.classList.remove('hidden');
          nextBtnId.removeAttribute('tabindex');
          cells[i].classList.remove('active');
          i -= 1;
          if (!cells[i]) continue;
          if (i === 0) {
            prevBtnId.classList.add('hidden');
            prevBtnId.setAttribute('tabindex', '-1');
            nextBtnId.classList.remove('hidden');
          }
          cells[i].classList.add('active');
          indexNo.innerHTML = i + 1;
          return i;
        }
      };

      let forward = (carouselId) => {
        let cells = context.querySelectorAll(`#${carouselId}>.vvjc-item`);
        let cellCount = cells.length;
        let btnId = carouselId.split('-')[2];
        let prevBtnId = context.getElementById(`prev-${btnId}`);
        let nextBtnId = context.getElementById(`next-${btnId}`);
        let indexNo = context.getElementById(`index-${btnId}`);
        for (let i = 0; i < cellCount; i++) {
          if (cells[i].classList.contains('active')) {
            if (i == cellCount - 1) {
              let prevOn = parseInt(`${btnId}00`);
              let prevOff = parseInt(`${btnId}01`);
              let nextOn = parseInt(`${btnId}11`);
              let nextOff = parseInt(`${btnId}10`);
              if (autoHelper.includes(nextOn)) {
                autoHelper = autoHelper.map(item => {
                  if (item == nextOn) {
                    return nextOff;
                  }
                  else if (item == prevOff) {
                    return prevOn;
                  }
                  else {
                    return item;
                  }
                });
              }
              break;
            }
            prevBtnId.classList.remove('hidden');
            prevBtnId.removeAttribute('tabindex');
            cells[i].classList.remove('active');
            i++;
            if (cells[i]) {
              if (i == cellCount - 1) {
                nextBtnId.classList.add('hidden');
                nextBtnId.setAttribute('tabindex', '-1');
                prevBtnId.classList.remove('hidden');
              }
              cells[i].classList.add('active');
              n = i;
              indexNo.innerHTML = n + 1;
              return n;
            }
          }
        }
      };

      let getNumberId = (th) => {
        let idNu = th.split('-')[2];
        parseInt(idNu);
        return idNu;
      };

      let navigateCarousel = (carouselId, directionFunction) => {
        let n = directionFunction(carouselId);
        rotateCarousel(carouselId, n);
      };

      let nextBtn = (carouselId) => {
        let cTimeId = carouselId.split('-')[2];
        let cTime = parseInt(context.querySelector(`#vvjc-nav-${cTimeId}`).getAttribute('data-time'), 10);
        navigateCarousel(carouselId, forward);
        manageAutoSlideInterval(carouselId, 'clear');
        if (!isPaused) {
          manageAutoSlideInterval(carouselId, 'start', cTime);
        }
      };

      let prevBtn = (carouselId) => {
        let cTimeId = carouselId.split('-')[2];
        let cTime = parseInt(context.querySelector(`#vvjc-nav-${cTimeId}`).getAttribute('data-time'), 10);
        navigateCarousel(carouselId, backward);
        manageAutoSlideInterval(carouselId, 'clear');
        if (!isPaused) {
          manageAutoSlideInterval(carouselId, 'start', cTime);
        }
      };

      let autoPlay = (carouselId) => {
        let d = getNumberId(carouselId);
        let prevOn = parseInt(d + 0 + 0);
        let nextOn = parseInt(d + 1 + 1);
        if ((autoHelper.indexOf(nextOn) >= 0)) {
          n = forward(carouselId);
          rotateCarousel(carouselId, n);
        }
        if ((autoHelper.indexOf(prevOn) >= 0)) {
          n = backward(carouselId);
          rotateCarousel(carouselId, n);
        }
      };

      let initCarousel = (carousels) => {
        autoHelper = [];
        for (let j = 0; j < carousels.length; j++) {
          let carouselC = carousels[j];
          let carouselId = carouselC.id;
          let shortId = carouselId.split('-')[2];
          autoHelper.push(parseInt(shortId + 1 + 1));
          autoHelper.push(parseInt(shortId + 0 + 1));
          buildCarousel(carouselId);
        }
      };

      let setAutoPlayInterval = (carouselId, cTime) => {
        manageAutoSlideInterval(carouselId, 'clear');
        if (cTime > 0) {
          let intervalId = setInterval(() => {
            autoPlay(carouselId);
          }, cTime);
          intervalIds.set(carouselId, intervalId);
          return intervalId;
        }
      };

      carousels.forEach(carouselC => {
        let carouselId = carouselC.id;
        let cTimeId = carouselId.split('-')[2];
        let cTime = parseInt(context.querySelector(`#vvjc-nav-${cTimeId}`).getAttribute('data-time'), 10);

        if (cTime != 0) {
          let intervalId = setAutoPlayInterval(carouselId, cTime); // Create and store interval

          let stopOnHover = context.getElementById(carouselId);
          let playPause = context.getElementById(`btn-${cTimeId}`);
          playPause.style.display = 'flex';

          stopOnHover.addEventListener('mouseover', function() {
            if (playPause.classList.contains('play')) {
              clearInterval(intervalIds.get(carouselId)); // Use interval from the Map
            }
          });

          stopOnHover.addEventListener('mouseout', function() {
            if (playPause.classList.contains('play')) {
              intervalIds.set(carouselId, setAutoPlayInterval(carouselId, cTime)); // Reset the interval
            }
          });

          playPause.addEventListener('click', function() {
            if (this.classList.contains('play')) {
              this.classList.replace('play', 'pause');
              this.innerHTML = playIconSVG;
              isPaused = true;
              manageAutoSlideInterval(carouselId, 'clear');
            }
            else {
              this.classList.replace('pause', 'play');
              this.innerHTML = pauseIconSVG;
              isPaused = false;
              manageAutoSlideInterval(carouselId, 'start', cTime);
            }
          });

        }

        // Add keyboard navigation support
        carouselC.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowRight') {
            nextBtn(carouselId);
          } else if (event.key === 'ArrowLeft') {
            prevBtn(carouselId);
          }
        });

      });

      const handleWindowResize = () => {
        n = 0;
        let newWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        if (Math.abs(newWidth - currentWidth) >= 50) {
          initCarousel(carousels);
          currentWidth = newWidth;
        }
      };

      once('init-next-arrow', '.vvjc-nav .next-arrow', context)
        .forEach(element => {
          element.addEventListener('click', function(event) {
            const buttonElement = event.target.closest('button');
            if (buttonElement) {
              nextBtn(getThisId(buttonElement.id));
            }
          });
        });

      once('init-prev-arrow', '.vvjc-nav .prev-arrow', context)
        .forEach(element => {
          element.addEventListener('click', function(event) {
            const buttonElement = event.target.closest('button');
            if (buttonElement) {
              prevBtn(getThisId(buttonElement.id));
            }
          });
        });

      window.addEventListener('resize', handleWindowResize);
      initCarousel(carousels);

    }
  };
})(Drupal, drupalSettings, once);
