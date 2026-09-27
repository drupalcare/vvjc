# Changelog

## [2.0.0] — UNRELEASED

**Drop-in upgrade for 1.x sites.** v2 modernizes internals — extends `vvj_core`
foundation, ships `<vvjc-carousel>` custom element extending `VvjElementBase`,
AbortController-tracked listeners, IntersectionObserver-driven pause-when-out-
of-viewport — while preserving every CSS rule, library name (incl. all 5
breakpoint libraries + admin), option key, plugin ID, theme hook, JS behavior
key, and the full Drupal.vvjc.* public API surface from 1.x.

### Fixed

- Update 10002 converts v1 views to the v2 option shape (value types:
  strings and integers stored where v2 declares integer, boolean and float).
- Reaching the first or last slide with the keyboard hid the arrow that had
  focus and dropped the user to the top of the page. Focus now moves to the
  opposite arrow.
- A one-slide view with autoplay set the slide index to -1 and left no slide
  active.
- Under the operating system's reduced-motion setting the ring's drum still
  rotated, because the script set its transition inline over the stylesheet's
  reduced-motion rule. It now moves without animation, like the slides.

- Restored v1's support for **any** Views row plugin (Fields *or* Content/entity
  rows). The shared base defaulted to requiring Fields — force-switching the row
  plugin on edit and blocking validation — which broke non-Fields carousels
  including the shipped `vvjc_example` (`entity:node` teaser rows). vvjc now
  opts out (`requiresFieldsRow()` → FALSE), matching v1.
- Restored v1's performance guidance in the Views options form (recommend
  limiting to ~30 items) — the shared base showed a generic "requires Fields as
  row style" note instead.
- Deep-link "URL Identifier" field show/hide + required toggle now works (fixed
  in the `vvj_core` base — the toggle attributes are slug-derived).

### Added

- **Carousel Style** option (Format settings → Dimensions): *Rotating ring*
  (default, unchanged) or *Coverflow*, an open fan with the current card in
  front that wraps at the ends. Existing views keep the ring; their markup is
  byte-identical. The coverflow's rules ship in a separate `vvjc/vvjc-coverflow`
  library that loads only for a coverflow.

- `drupal/vvj_core` dependency (auto-installed).
- `vvjc.install` with `vvjc_update_10001()` to auto-enable vvj_core during
  `drush updb`.
- `<vvjc-carousel>` custom element. Lazy IntersectionObserver hydration;
  AbortController-tracked listeners; resize/orientation throttling; `prefers-
  reduced-motion` and visibility-API awareness.

### Changed

- Plugin extends `VvjStylePluginBase`. Implements four small subclass hooks;
  standard sections come from the base. supportsEnableCss = FALSE (v1 had no
  separate vvjc-style library; visual rules ship in vvjc.css).
- `getDeeplinkReservedWords()` overridden to include vvjc's `#carousel3d-`
  slugs.
- Token resolution delegates to `vvj_core.token_resolver`.
- Hooks moved to OOP `#[Hook]` classes.
- `Drupal.vvjc.{getInstance,getAllInstances,goToSlide,getCurrentSlide,getTotalSlides,nextSlide,prevSlide,pause,resume,pauseAll,resumeAll}`
  now delegate to methods on the custom element instance.

### Drupal core / PHP

- Requires Drupal `^11.3 || ^12`, PHP `>=8.3`.
