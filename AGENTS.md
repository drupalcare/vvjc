# Views Vanilla JavaScript 3D Carousel (`vvjc`): agent brief

**Who this is for:** whoever works on `vvjc` next, human or agent, with no memory of how it got this way.

**Scope:** this module only. The shared base class, services and CSS contract live in `vvj_core`; change them there,
never copy them here.

## Before you change anything

1. Read [README.md](./README.md) (what the module promises) and [CHANGELOG.md](./CHANGELOG.md) (what changed and why).
2. Read `vvj_core`'s `VvjStylePluginBase` before editing the style plugin. Most of the plugin's behavior is inherited.
3. Check "What must not change" below. A change that touches any item on it needs a changelog entry and an update path.

## Where the facts live

| Fact | Home |
|---|---|
| Views style plugin (ID `views_vvjc`) | `src/Plugin/views/style/Carousel3D.php` |
| Constants and defaults | `src/VvjcConstants.php` |
| Hooks (theme, preprocess, tokens, help) | `src/Hook/` (OOP `#[Hook]` classes; `vvjc.module` is a stub) |
| Install and update hooks | `vvjc.install` (updates 10001 and 10002) |
| Custom element `<vvjc-carousel>` | `js/vvjc-carousel-element.js` |
| Libraries | `vvjc.libraries.yml` |
| Templates | `templates/` |
| Pattern designs | `patterns/<id>/pattern.yml` plus that Pattern's CSS and JS (`story_reel`, `orbit_dock`, `index_split`, `thumb_rail`, `ambient_stage`) |
| Settings schema | `config/schema/` |
| Sample view | `config/optional/` |
| Requirements | `vvjc.info.yml` and `composer.json` |

A Pattern's name, description, options and "needs" list are read from its `pattern.yml` by `vvj_patterns`
(`PatternRepository`). Edit that file, not the select list code. The Patterns select appears only while
`vvj_patterns` is enabled.

## Commands that check a change

From the Drupal project root, with Drupal's Coder and PHPStan installed through Composer:

```bash
vendor/bin/phpcs --standard=web/modules/contrib/vvjc/phpcs.xml.dist web/modules/contrib/vvjc
vendor/bin/phpstan analyse -c web/modules/contrib/vvjc/phpstan.neon
```

PHPStan reads `phpstan.neon` (level `max`). Findings are fixed, not suppressed with a generated baseline. How to run
the PHPUnit suites is in [CONTRIBUTING.md](./CONTRIBUTING.md).

## CSS checks

The cascade checker is `vvj_core/scripts/check-vvj-cascade.py` (one copy; run `python3 -I` on it from the lane root, `--list` prints each change). Its CI job `vvj-cascade` runs in vvj_core's pipeline, not in this repo's.
`.stylelintrc.json` reports id selectors, `!important` and selectors above 0,2,0 as warnings only; the drupal.org template's stylelint job never fails the pipeline (needs checking), so the cascade checker is the gate.

## What must not change

- Plugin ID `views_vvjc`, the theme hook, Twig template names, library names, option keys, the CSS classes on the
  rendered HTML and the `Drupal.vvjc.*` JavaScript API. Sites and themes rely on them (the drop-in contract in the
  changelog).
- Every update hook docblock is one summary line. Put explanation in `//` comments inside the function body.
- SVG pasted by an administrator goes through `vvj_core.svg_sanitizer`. Do not add a second path that prints
  admin-supplied SVG.
- Behavior attaches with `Drupal.behaviors` and `once()`; listeners use the element's AbortController signal so
  `detach('unload')` removes them.
- A failing test is fixed in the code, not by editing the test to pass.
