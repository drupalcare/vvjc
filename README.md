# Views Vanilla JavaScript 3D Carousel (VVJC)

A vanilla-JavaScript 3D carousel **Views format** for Drupal. Renders
Views rows as cells on a virtual 3D cylinder (rotateY + translateZ), with
autoplay, dots / arrows / play-pause / progress / counter, full keyboard, touch,
and screen-reader support, deep linking, RTL-aware navigation, and reduced-
motion handling.

- Project page: [drupal.org/project/vvjc](https://www.drupal.org/project/vvjc)
- Issue queue:
  [drupal.org/project/issues/vvjc](https://www.drupal.org/project/issues/vvjc)

v2.0 builds on the **`drupal/vvj_core` foundation** (composer auto-installs it).
Behavior runs in a `<vvjc-carousel>` custom element extending `VvjElementBase`.


## Table of contents

- Overview
- Requirements
- Installation
- Configuration
- Usage
- Patterns
- Upgrading from 1.x
- Troubleshooting
- Changelog
- Maintainers
- License


## Overview

- Two 3D styles: a rotating ring (slides on a virtual cylinder via rotateY +
  translateZ) or a coverflow (angled cards fanned across an arc, several
  visible at once, wrapping at the ends)
- 8 width presets, 10 large-screen height presets, 9 small-screen height presets
- 14 auto-rotate intervals from 2 s to 15 s, plus disabled
- Configurable CSS `perspective` (or auto-computed)
- Background color + adjustable opacity, or fully disabled
- 5 responsive breakpoints (576 / 768 / 992 / 1200 / 1400 px)
- Navigation arrows, play/pause button, slide counter, progress bar, dots, all
  independently togglable
- Scrollable dots variant for large slide counts
- Touch / swipe gestures (RTL-aware)
- Keyboard nav: ArrowLeft/Right, Space (play/pause), Home, End, RTL-aware
- Screen-reader announcements via ARIA live region
- `prefers-reduced-motion` honored: auto-rotation pauses, transitions disabled
- IntersectionObserver-driven pause when out of viewport
- Deep linking: shareable URL fragments per slide (`#carousel3d-gallery-3`)
- Lazy IntersectionObserver hydration; AbortController-tracked listeners
- **Views tokens**: `[vvjc:field]` / `[vvjc:field:plain]` in Views text areas
  with *Use replacement tokens from the first row*
- **Drupal admin help**: `/admin/help/vvjc`


## Requirements

- Drupal core `^11.3 || ^12`.
- PHP 8.3 or later.
- Drupal core modules Views and Filter.
- [VVJ Core](https://www.drupal.org/project/vvj_core) (`vvj_core`), installed
  automatically by Composer.


## Installation

1. Install with Composer: `composer require drupal/vvjc:^2.0` (it pulls
   `drupal/vvj_core`), or download the module and `vvj_core` from
   [Drupal.org](https://www.drupal.org/project/vvjc).
1. Enable it in the admin interface or with Drush: `drush en vvjc`.
1. Clear caches so the new plugin is available: `drush cr`.


## Configuration

Settings live in the format settings of the view. Configure dimensions /
behavior / controls / accessibility / style / responsive in the format settings.

For a ready-made starting point, choose a Pattern (see Patterns below).


## Usage

1. Create or edit a View.
1. Set **Format** to *Views Vanilla JavaScript 3D Carousel*.
1. Set **Show** to *Fields*.
1. Configure the format settings (see Configuration).
1. Save.

Recommended: limit slide count to ~30 for optimal 3D performance.

**Sample view:** Optional config `views.view.vvjc_example` (`config/optional/`)
installs when there is no ID conflict.


### Token support in Views text areas

In Views headers, footers, or empty text with *Use replacement tokens from the
first row*, default Twig tokens (`{{ title }}`) do not work. Use VVJC tokens
instead:

- `{{ title }}` → `[vvjc:title]`
- `{{ field_image }}` → `[vvjc:field_image]`
- Append `:plain` for plain text: `[vvjc:title:plain]`

v2 resolves tokens through the shared `vvj_core.token_resolver` service; syntax
is unchanged from v1. Tokens read from the **first row** of rendered View
fields. Complex field rewrites are not supported.


### JavaScript API

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


## Patterns

A Pattern is a ready-made design for this format. One choice in the format
settings sets the layout, animation,
styling and deep linking together. Views Vanilla JavaScript 3D Carousel ships 5
Patterns:

| Pattern | What it looks like | Demo page path |
|---|---|---|
| Story reel | A coverflow fan of tall photo cards, story bars on top that fill with time, and pill buttons below. | `vvj/vvjc/story-reel` |
| Orbit dock | A deep ring of wide photos with a floor glow, a caption chip and a floating dock with a progress ring. | `vvj/vvjc/orbit-dock` |
| Index split | A big counter and a numbered index on the left, a ring of text cards on the right; no autoplay. | `vvj/vvjc/index-split` |
| Thumb rail | A wide coverflow fan with a caption bar, round glass arrows over the stage and a rail of numbered tiles below. | `vvj/vvjc/thumb-rail` |
| Ambient stage | A ring of square cards on a soft glow, a big counter, a square play button and a tick scrubber. | `vvj/vvjc/ambient-stage` |

The demo pages exist only while the optional `vvj_patterns_demo` module is
enabled (see "Example views" below).


### Choosing a Pattern

1. Enable the shared Patterns base, which ships inside `vvj_core`:
   `drush en vvj_patterns`. The "Pattern" select
   appears in the format settings only while `vvj_patterns` is enabled.
1. Edit the view and open the format settings.
1. In the "Patterns" section, pick a Pattern in the "Pattern" select and save.
1. The Pattern's settings replace the layout, animation, styling and deep
   linking settings of the view. You can
   change them afterwards. Pick "None" to keep your own settings.
1. A list titled "To finish the <name> Pattern" shows what the view must supply:
   which fields, which markup
   classes and how many items. Follow it; a Pattern shows its finished design
   only when the view matches.

A Pattern owns its layout and sizes itself by the room it has, not by the screen
width. The breakpoint setting still picks when the regular carousel changes; a
Pattern switches to its narrow stage below 768px wide, whatever that setting
says. On narrow screens the Ambient stage, Index split and Orbit dock Patterns
keep a 12px gutter each side of the card.


### Example views

Enable the optional `vvj_patterns_demo` module (`drush en vvj_patterns_demo`) to
see every Pattern with content.
It creates a "VVJ Slide" content type with five demo slides and pictures, plus
example views titled
"VVJ demo: <format>" for the VVJ format modules that are enabled, one page per
Pattern at the paths in the table
above. Uninstalling the demo module removes the slides and pictures it created.


## Upgrading from 1.x

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


## Troubleshooting

| Symptom | Fix |
|---|---|
| The format is missing from the Views "Format" list | Enable `vvj_core` and `vvjc`, then `drush cr`. |
| `Class "Drupal\vvjc\..." not found` after deploying v2 code | Stale container cache: `drush cr`. If Drush will not bootstrap, clear `cache_container` in the database and retry. |
| `drush updb` errors before `vvj_core` is enabled | Run `drush en vvj_core -y`, then `drush updb -y && drush cr`. |
| No "Patterns" section in the format settings | Enable `vvj_patterns`: `drush en vvj_patterns`. |

Report bugs and request features in the
[issue queue](https://www.drupal.org/project/issues/vvjc).


## Changelog

See [CHANGELOG.md](./CHANGELOG.md).


## Maintainers

- Alaa Haddad - [flashwebcenter](https://www.drupal.org/u/flashwebcenter)


## License

GPL-2.0-or-later. See the
[GNU General Public License, version 2 or later](https://www.gnu.org/licenses/gpl-2.0.html).
