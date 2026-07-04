/**
 * @file
 * VVJC compat shim. Behavior lives in `<vvjc-carousel>` custom element.
 *
 * @license SPDX-License-Identifier: GPL-2.0-or-later
 */

// phpcs:disable Drupal.NamingConventions.UpperCaseConstant
// phpcs:disable Generic.PHP.UpperCaseConstant
// phpcs:disable Squiz.WhiteSpace.OperatorSpacing

((Drupal, once) => {
  'use strict';

  Drupal.behaviors.VVJCarousel = {
    attach(context) {
      once('vvjc-carousel-marker', 'vvjc-carousel', context);
    },
    detach() {},
  };

  /**
   * Resolve a deeplink-id, CSS selector, or DOM node to the matching
   * `<vvjc-carousel>` custom element.
   *
   * @param {string|Element} identifier
   *   Either a deeplink-id (e.g. `'gallery'`), a CSS selector, or an
   *   existing element.
   * @returns {Element|null}
   *   The matched `<vvjc-carousel>` element, or null.
   */
  function getElement(identifier) {
    if (identifier instanceof Element) {
      return identifier.closest('vvjc-carousel');
    }
    if (typeof identifier !== 'string') { return null;
    }
    let el = document.querySelector(`vvjc-carousel .vvjc-items[data-deeplink-id="${identifier}"]`);
    if (el) { return el.closest('vvjc-carousel');
    }
    el = document.querySelector(`vvjc-carousel[data-deeplink-id="${identifier}"]`);
    if (el) { return el;
    }
    el = document.querySelector(identifier);
    if (el) { return el.closest('vvjc-carousel') || el;
    }
    return null;
  }

  Drupal.vvjc = Drupal.vvjc || {};

  Drupal.vvjc.getInstance = (containerOrSelector) => getElement(containerOrSelector);

  Drupal.vvjc.getAllInstances = () =>
    Array.from(document.querySelectorAll('vvjc-carousel'));

  Drupal.vvjc.goToSlide = (identifier, slideIndex) => {
    const el = getElement(identifier);
    if (!el || typeof el.goToSlide !== 'function') {
      console.warn(`VVJC: Carousel "${identifier}" not found or not yet hydrated`);
      return false;
    }
    return el.goToSlide(slideIndex);
  };

  Drupal.vvjc.getCurrentSlide = (identifier) => {
    const el = getElement(identifier);
    if (!el || typeof el.getCurrentSlide !== 'function') { return null;
    }
    return el.getCurrentSlide();
  };

  Drupal.vvjc.getTotalSlides = (identifier) => {
    const el = getElement(identifier);
    if (!el || typeof el.getTotalSlides !== 'function') { return null;
    }
    return el.getTotalSlides();
  };

  Drupal.vvjc.nextSlide = (identifier) => {
    const el = getElement(identifier);
    if (!el || typeof el.nextSlide !== 'function') { return false;
    }
    return el.nextSlide();
  };

  Drupal.vvjc.prevSlide = (identifier) => {
    const el = getElement(identifier);
    if (!el || typeof el.prevSlide !== 'function') { return false;
    }
    return el.prevSlide();
  };

  Drupal.vvjc.pause = (identifier) => {
    const el = getElement(identifier);
    if (!el || typeof el.pause !== 'function') { return false;
    }
    return el.pause();
  };

  Drupal.vvjc.resume = (identifier) => {
    const el = getElement(identifier);
    if (!el || typeof el.resume !== 'function') { return false;
    }
    return el.resume();
  };

  Drupal.vvjc.pauseAll = () => {
    document.querySelectorAll('vvjc-carousel').forEach((el) => {
      if (typeof el.pause === 'function') { el.pause();
      }
    });
  };

  Drupal.vvjc.resumeAll = () => {
    document.querySelectorAll('vvjc-carousel').forEach((el) => {
      if (typeof el.resume === 'function') { el.resume();
      }
    });
  };

})(Drupal, once);
