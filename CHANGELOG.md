# Changelog

## [2.0.0] — UNRELEASED

**Drop-in upgrade for 1.x sites.** v2 modernizes internals — extends `vvj_core`
foundation, ships `<vvjc-carousel>` custom element extending `VvjElementBase`,
AbortController-tracked listeners, IntersectionObserver-driven pause-when-out-
of-viewport — while preserving every CSS rule, library name (incl. all 5
breakpoint libraries + admin), option key, plugin ID, theme hook, JS behavior
key, and the full Drupal.vvjc.* public API surface from 1.x.

### Fixed

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
