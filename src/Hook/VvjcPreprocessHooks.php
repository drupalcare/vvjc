<?php

declare(strict_types=1);

namespace Drupal\vvjc\Hook;

use Drupal\Core\Hook\Attribute\Hook;
use Drupal\views\Hook\ViewsThemeHooks;
use Drupal\views\ViewExecutable;
use Drupal\vvjc\Plugin\views\style\Carousel3D;
use Drupal\vvjc\VvjcConstants;

/**
 * Preprocess hooks for VVJC 3D carousel.
 *
 * Derives the rgba per-item background from hex+opacity, exposes
 * options to the template, and adds the legacy `vvj-carousel`
 * class on the views_view wrapper for v1 contract preservation.
 */
final class VvjcPreprocessHooks {

  /**
   * Constructor.
   *
   * @param \Drupal\views\Hook\ViewsThemeHooks $viewsThemeHooks
   *   Views row preprocess (replaces removed procedural
   *   template_preprocess_views_view_unformatted in Drupal 12).
   */
  public function __construct(
    private readonly ViewsThemeHooks $viewsThemeHooks,
  ) {}

  /**
   * Implements hook_preprocess_HOOK() for views_view_vvjc.
   *
   * @param array<string, mixed> $variables
   *   Template variables.
   */
  #[Hook('preprocess_views_view_vvjc')]
  public function preprocessViewsViewVvjc(array &$variables): void {
    $view = $variables['view'] ?? NULL;
    if (!($view instanceof ViewExecutable)) {
      return;
    }
    $stylePlugin = $view->style_plugin;
    if (!($stylePlugin instanceof Carousel3D)) {
      return;
    }
    $options = $stylePlugin->options;
    $variables['options'] = $options;

    // Derive RGBA background from hex color + opacity.
    if (!empty($options['background_color']) && empty($options['disable_background'])) {
      $color = $options['background_color'];
      $rgb = self::hexToRgb(is_scalar($color) ? (string) $color : '');
      $raw_opacity = $options['background_color_opacity'] ?? VvjcConstants::MAX_OPACITY;
      $opacity = is_numeric($raw_opacity) ? (float) $raw_opacity : VvjcConstants::MAX_OPACITY;
      $variables['background_rgb'] = sprintf('rgba(%d, %d, %d, %s)', $rgb['r'], $rgb['g'], $rgb['b'], $opacity);
    }
    else {
      $variables['background_rgb'] = NULL;
    }

    $this->viewsThemeHooks->preprocessViewsViewUnformatted($variables);
  }

  /**
   * Implements hook_preprocess_HOOK() for views_view.
   *
   * Adds the legacy `vvj-carousel` class for v1 contract preservation.
   *
   * @param array<string, mixed> $variables
   *   Template variables.
   */
  #[Hook('preprocess_views_view')]
  public function preprocessViewsView(array &$variables): void {
    $view = $variables['view'] ?? NULL;
    if (!($view instanceof ViewExecutable)) {
      return;
    }
    if (!($view->style_plugin instanceof Carousel3D)) {
      return;
    }
    $attributes = $variables['attributes'] ?? NULL;
    if (is_array($attributes)) {
      $classes = $attributes['class'] ?? [];
      if (!is_array($classes)) {
        $classes = [];
      }
      $classes[] = 'vvj-carousel';
      $attributes['class'] = $classes;
      $variables['attributes'] = $attributes;
    }
  }

  /**
   * Convert a hex color to an RGB triplet.
   *
   * @param string $hex
   *   Hex color, with or without leading `#`. Accepts 3 or 6 chars.
   *
   * @return array{r: int, g: int, b: int}
   *   Decimal RGB components.
   */
  private static function hexToRgb(string $hex): array {
    $hex = ltrim($hex, '#');
    if (strlen($hex) === 3) {
      $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
    }
    return [
      'r' => (int) hexdec(substr($hex, 0, 2)),
      'g' => (int) hexdec(substr($hex, 2, 2)),
      'b' => (int) hexdec(substr($hex, 4, 2)),
    ];
  }

}
