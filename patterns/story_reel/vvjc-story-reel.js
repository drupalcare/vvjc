/**
 * @file
 * Pattern Story reel: the title of each card rises word by word.
 *
 * Uses Drupal.Vvj.splitText (vvj_patterns/split-text). The CSS animates the
 * words; with JS off the title shows as plain text.
 *
 * @license SPDX-License-Identifier: GPL-2.0-or-later
 */

((Drupal, once) => {
  Drupal.behaviors.vvjPatternVvjcStoryReel = {
    attach(context) {
      once(
        'vvj-pattern-vvjc-story-reel',
        '.vvj-pattern--vvjc-story-reel .vvjc-item .vvj-title',
        context,
      ).forEach((title) => Drupal.Vvj.splitText(title, { unit: 'word' }));
    },
  };
})(Drupal, once);
