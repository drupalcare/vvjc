# Changelog

## [2.0.0] (UNRELEASED)

- Accessibility: the play/pause button is always shown while auto-rotation runs (the option now decides it only without rotation); keyboard focus inside holds rotation until focus leaves, unless Pause was pressed; hidden ring slides are `inert` (printed in the template for the first render) and a focused slide that turns hidden hands focus to the current one; the slide area is a group named "Slides" (it was a second region named by the counter), the outer region carries "carousel", the control bar is a named group, and the arrow and play buttons are `type="button"` without a redundant role; the reduced-motion announcement is translatable; Space is left to the page when there is no play/pause button; scrollable dots no longer smooth-scroll under reduced motion; the progress percentage text is dark blue (5.2:1) and dark green at 100% (5.0:1).
- Accessibility: in Windows high contrast (forced colors) the Pattern icons stay visible; they are masks painted with the text color, which the system used to replace.

**Drop-in upgrade for 1.x sites.** v2 modernizes internals: extends `vvj_core`
foundation, ships `<vvjc-carousel>` custom element extending `VvjElementBase`,
AbortController-tracked listeners, IntersectionObserver-driven pause-when-out-
of-viewport, while preserving every CSS rule, library name (incl. all 5
breakpoint libraries + admin), option key, plugin ID, theme hook, JS behavior
key, and the full Drupal.vvjc.* public API surface from 1.x.

### Fixed

- Patterns: Orbit Dock's controls float above the ring, Story Reel's bars end the top row, and Thumb Rail's tiles and play button align with the card on a wide region. Thumb Rail's counter has a solid ground so it stays readable over a light photo.
- Patterns: Index Split numbers use the shared monospace variable.
- Patterns: spacing, corner radius, type size, shadow and motion read shared `--vvj-*` variables with fallbacks, so a site or theme can adjust them in one place; a few odd values moved to the nearest step, under 10%.
- Patterns: each Pattern states its stage, ground, placement and the kinds of site it serves best in `pattern.yml`.
- Patterns: Ambient Stage, Index Split, Thumb Rail and the card height take their stacked layout from the Pattern's own width (class `vvjc-narrow`), so they stack in a narrow column on a wide screen, not only on a small screen.
- Patterns: Thumb Rail places its arrows on the start and end sides, so Previous sits on the right on right-to-left pages.
- Patterns: sizes that followed the screen width (`vw`) now follow the Pattern's own width (`cqi`), so a Pattern in a sidebar or narrow column keeps its proportions.
- Patterns: Index Split cuts its 3D stage on the start side, so the turned cards no longer paint over the index list, and the big numeral sits 12 px clear of the index and arrows; Ambient Stage keeps its tick targets 12 px from the counter on phones.
- Help page: follows the drupal.org help text standard (translatable About and Uses sections) instead of printing README.md as raw text.
- Layout: the breakpoint stylesheets (`vvjc-576` to `vvjc-1400`) no longer match a Pattern, so a Pattern's layout comes from its own CSS only; the narrow stage height now follows the viewport rule the Patterns use. Classic 3D carousels render as before.
- Accessibility: slides are no longer extra Tab stops (the first slide stayed one even after it turned away); the current slide is a Tab stop only when keyboard navigation is on and no arrows, dots or play button are shown.
- Accessibility: Space on the play/pause button toggles once (the button and the carousel both toggled); carousel keys leave focused controls alone; the progress bar is hidden from screen readers and no longer a live region; timer steps no longer fill the live regions; play/pause drops `aria-pressed` and its labels and the slide announcement are translatable; dots are plain buttons with `aria-current` instead of a partial tabs pattern.

- Index split: the card text now has 22px side padding (the card pads it; the picture stays full width).

- **3D depth follows the carousel width.** With Perspective left at zero, the
  depth is now the ring's measured width times a ratio (ring 5x, coverflow
  2x), set again on every resize. The old fixed 640px fell under the width
  from 700px up, so a ring's side cards hid behind the front card, and the
  setting's help text claimed it already followed the width. The coverflow's
  step back is now a share of the card width instead of a fixed 120px. A
  Perspective value in the view still wins. Themes can set
  `--vvjc-perspective-ratio`. Views with Perspective at zero look different
  after this update.

- **The arrows no longer disappear at the ends.** On the ring, which does
  not loop, the previous arrow on the first card and the next arrow on the
  last card were hidden, which left a gap and shifted the controls beside
  them. They now stay in place, dimmed and marked `aria-disabled="true"`, and
  a click on them does nothing. An arrow key or a swipe past an end does
  nothing either; before, it bounced the ring back the other way. Keyboard
  focus stays on an arrow that becomes disabled (it used to drop to the top
  of the page). Autoplay still reverses at the ends. The `vvjc-hidden` class is replaced by `vvjc-disabled`; a theme
  that styled `vvjc-hidden` should style `vvjc-disabled` instead. The
  coverflow, which loops, is unchanged.
- Update 10002 converts v1 views to the v2 option shape (value types:
  strings and integers stored where v2 declares integer, boolean and float).
- A one-slide view with autoplay set the slide index to -1 and left no slide
  active.
- Under the operating system's reduced-motion setting the ring's drum still
  rotated, because the script set its transition inline over the stylesheet's
  reduced-motion rule. It now moves without animation, like the slides.

- Restored v1's support for **any** Views row plugin (Fields *or* Content/entity
  rows). The shared base defaulted to requiring Fields: force-switching the row
  plugin on edit and blocking validation, which broke non-Fields carousels
  including the shipped `vvjc_example` (`entity:node` teaser rows). vvjc now
  opts out (`requiresFieldsRow()` → FALSE), matching v1.
- Restored v1's performance guidance in the Views options form (recommend
  limiting to ~30 items). The shared base showed a generic "requires Fields as
  row style" note instead.
- Deep-link "URL Identifier" field show/hide + required toggle now works (fixed
  in the `vvj_core` base. The toggle attributes are slug-derived).
- The carousel measures the ring width once per layout instead of writing then reading it.

### Added

- Patterns: the bridge reads the shared `--vvj-theme-*` roles instead of spelling theme names.
- Pattern theme bridges for Solo and APEX (`pattern-bridge-solo`, `pattern-bridge-apex`): they map the module's own color tokens to the region colors, and the Pattern colors that were hard-coded are now declared once in the pattern base file. Black and white stays the default under any other theme.

- **Patterns**: 5 ready-made designs for this format (Story reel, Orbit dock, Index split, Thumb rail, Ambient stage). Pick one in the "Patterns" section of the format settings and its layout, animation, styling and deep linking settings are applied to the view. Needs the `vvj_patterns` module from `vvj_core`; the optional `vvj_patterns_demo` module adds example views.
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

- Text follows the drupal.org standards: the module description begins with a verb, "JavaScript" is spelled as the language spells it, settings titles are in sentence case, comments use American spelling, and the README has its project and issue queue links.
- Plugin extends `VvjStylePluginBase`. Implements four small subclass hooks;
  standard sections come from the base. supportsEnableCss = FALSE (v1 had no
  separate vvjc-style library; visual rules ship in vvjc.css).
- `getDeeplinkReservedWords()` overridden to include vvjc's `#carousel3d-`
  slugs.
- Token resolution delegates to `vvj_core.token_resolver`.
- Hooks moved to OOP `#[Hook]` classes.
- `Drupal.vvjc.{getInstance,getAllInstances,goToSlide,getCurrentSlide,getTotalSlides,nextSlide,prevSlide,pause,resume,pauseAll,resumeAll}`
  now delegate to methods on the custom element instance.
- Code style: JavaScript and CSS follow Drupal core's ESLint, Stylelint and Prettier rules, and the spell-check job passes with a project word file. Rendering and behavior are unchanged.
- Pattern controls draw as designed again: the module's round 28px nav-button rule now has lower specificity (0,1,1), so a Pattern's own button styles win (Story Reel's play/pause pill and arrows broke when the Patterns moved to low specificity).
- Pattern buttons keep their designed shape: the shared Pattern reset reads `--vvjc-btn-*` custom properties, which the module's `all: unset` button rule cannot clear, so Story Reel's pills, Thumb Rail's glass arrows and Index Split's square buttons draw as designed.
- The one deliberate style-write-then-read (reading the stylesheet's transition duration, once per carousel) is marked for the motion check with its reason. No behavior change.

### Drupal core / PHP

- Requires Drupal `^11.3 || ^12`, PHP `>=8.3`.
