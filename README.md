# Views Vanilla JavaScript 3D Carousel (VVJC)

A vanilla-JavaScript 3D carousel **Views format** for Drupal 11.3+ / 12. Renders
Views rows as cells on a virtual 3D cylinder (rotateY + translateZ), with
autoplay, dots / arrows / play-pause / progress / counter, full keyboard, touch,
and screen-reader support, deep linking, RTL-aware navigation, and reduced-
motion handling.

v2.0 builds on the **`drupal/vvj_core` foundation** (composer auto-installs it).
Behavior runs in a `<vvjc-carousel>` custom element extending `VvjElementBase`.

## Features

- Two 3D styles: a rotating ring (slides on a virtual cylinder via rotateY +
  translateZ) or a coverflow (angled cards fanned across an arc, several
  visible at once, wrapping at the ends)
- 8 width presets, 10 large-screen height presets, 9 small-screen height presets
- 14 auto-rotate intervals from 2 s to 15 s, plus disabled
- Configurable CSS `perspective` (or auto-computed)
- Background color + adjustable opacity, or fully disabled
- 5 responsive breakpoints (576 / 768 / 992 / 1200 / 1400 px)
- Navigation arrows, play/pause button, slide counter, progress bar, dots — all
  independently togglable
- Scrollable dots variant for large slide counts
- Touch / swipe gestures (RTL-aware)
- Keyboard nav: ArrowLeft/Right, Space (play/pause), Home, End — RTL-aware
- Screen-reader announcements via ARIA live region
- `prefers-reduced-motion` honored — auto-rotation pauses, transitions disabled
- IntersectionObserver-driven pause when out of viewport
- Deep linking — shareable URL fragments per slide (`#carousel3d-gallery-3`)
- Lazy IntersectionObserver hydration; AbortController-tracked listeners
- **Views tokens** — `[vvjc:field]` / `[vvjc:field:plain]` in Views text areas
  with *Use replacement tokens from the first row*
- **Drupal admin help** — `/admin/help/vvjc`

## Token Support in Views Text Areas

In Views headers, footers, or empty text with *Use replacement tokens from the
first row*, default Twig tokens (`{{ title }}`) do not work. Use VVJC tokens
instead:

- `{{ title }}` → `[vvjc:title]`
- `{{ field_image }}` → `[vvjc:field_image]`
- Append `:plain` for plain text: `[vvjc:title:plain]`

v2 resolves tokens through the shared `vvj_core.token_resolver` service; syntax
is unchanged from v1. Tokens read from the **first row** of rendered View
fields. Complex field rewrites are not supported.

## Installation

```bash
composer require drupal/vvjc:^2.0
drush en vvjc
```

## Usage

1. Create or edit a View.
2. Set **Format** to *Views Vanilla JavaScript 3D Carousel*.
3. Set **Show** to *Fields*.
4. Configure dimensions / behavior / controls / accessibility / style /
   responsive in the format settings.
5. Save.

Recommended: limit slide count to ~30 for optimal 3D performance.

**Sample view:** Optional config `views.view.vvjc_example` (`config/optional/`)
installs when there is no ID conflict.

## Public API

External code can drive the carousel via `Drupal.vvjc.*`. Pass either the
deeplink identifier, a CSS selector, or an `Element` reference:

```js
Drupal.vvjc.goToSlide('gallery', 3);          // jump to slide 3 (1-based)
Drupal.vvjc.nextSlide('gallery');             // advance one slide
Drupal.vvjc.prevSlide('gallery');             // back one slide
Drupal.vvjc.pause('gallery');                 // pause autoplay
Drupal.vvjc.resume('gallery');                // resume autoplay
Drupal.vvjc.pauseAll();                       // pause every carousel on page
Drupal.vvjc.resumeAll();                      // resume every carousel on page
Drupal.vvjc.getCurrentSlide('gallery');       // → number (1-based)
Drupal.vvjc.getTotalSlides('gallery');        // → number
Drupal.vvjc.getInstance('#vvjc-12345');       // → <vvjc-carousel> element
Drupal.vvjc.getAllInstances();                // → array of <vvjc-carousel>
elements
```

## Drop-in upgrade from 1.x

`composer update drupal/vvjc && drush updb && drush cr` is sufficient. v2
preserves:

- Plugin ID `views_vvjc`, theme hook `views_view_vvjc`
- Twig template name
- All 19 option keys
- Library names (`vvjc`, `vvjc-admin`, `vvjc__576/768/992/1200/1400`)
- JS behavior key `Drupal.behaviors.VVJCarousel`
- Public API surface `Drupal.vvjc.{getInstance, getAllInstances, goToSlide,
  getCurrentSlide, getTotalSlides, nextSlide, prevSlide, pause, resume,
  pauseAll, resumeAll}`
- All CSS class names (`.vvjc`, `.vvjc-inner`, `.vvjc-items`, `.vvjc-item`,
  `.vvjc-nav`, `.dots-numbers-button`, `.progressbar`, etc.)

Outer rendered tag changed from `<div>` to `<vvjc-carousel>`. Theme selectors
targeting `.vvjc` keep matching.

## Running the tests

This module ships no `phpunit.xml` of its own, deliberately: its suites are
Kernel, Functional and FunctionalJavascript, which need a real Drupal, so a
module-local config would have to hard-code a relative path to `core` and would
break the moment the module is not physically inside a docroot (a symlinked
checkout, for instance). Drupal core's runner already does the job.

Run the fast suites from the docroot:

```bash
cd /path/to/drupal/web
export SIMPLETEST_DB="mysql://user:pass@localhost/dbname"
../vendor/bin/phpunit -c core modules/contrib/vvjc/tests/src/Unit
../vendor/bin/phpunit -c core modules/contrib/vvjc/tests/src/Kernel
```

The **Functional** and **FunctionalJavascript** suites additionally need
`SIMPLETEST_BASE_URL` pointing at a running web server, and the JavaScript ones
need chromedriver. Without those they error rather than fail, and the errors
name missing infrastructure rather than anything about this module — so don't
read them as test failures. The drupal.org pipeline provides both.

## License

GPL-2.0-or-later.
