<?php

declare(strict_types=1);

namespace Drupal\vvjc;

/**
 * Vvjc-specific constants — 3D carousel pattern-only values.
 *
 * Cross-cutting constants live in vvj_core's `ValidationBounds`.
 *
 * @internal Final, non-instantiable.
 */
final class VvjcConstants {

  /**
   * Width preset values (px).
   */
  public const string WIDTH_300 = '300';
  public const string WIDTH_400 = '400';
  public const string WIDTH_500 = '500';
  public const string WIDTH_600 = '600';
  public const string WIDTH_700 = '700';
  public const string WIDTH_800 = '800';
  public const string WIDTH_900 = '900';
  public const string WIDTH_1000 = '1000';
  public const string DEFAULT_MAX_WIDTH = self::WIDTH_500;

  /**
   * Height preset values (px).
   */
  public const string HEIGHT_100 = '100';
  public const string HEIGHT_150 = '150';
  public const string HEIGHT_200 = '200';
  public const string HEIGHT_250 = '250';
  public const string HEIGHT_300 = '300';
  public const string HEIGHT_350 = '350';
  public const string HEIGHT_400 = '400';
  public const string HEIGHT_450 = '450';
  public const string HEIGHT_500 = '500';
  public const string HEIGHT_550 = '550';
  public const string DEFAULT_LARGE_SCREEN_HEIGHT = self::HEIGHT_400;
  public const string DEFAULT_SMALL_SCREEN_HEIGHT = self::HEIGHT_350;

  /**
   * Auto-rotate interval values (ms).
   */
  public const string TIME_NONE = '0';
  public const string TIME_2000 = '2000';
  public const string TIME_3000 = '3000';
  public const string TIME_4000 = '4000';
  public const string TIME_5000 = '5000';
  public const string TIME_6000 = '6000';
  public const string TIME_7000 = '7000';
  public const string TIME_8000 = '8000';
  public const string TIME_9000 = '9000';
  public const string TIME_10000 = '10000';
  public const string TIME_11000 = '11000';
  public const string TIME_12000 = '12000';
  public const string TIME_13000 = '13000';
  public const string TIME_14000 = '14000';
  public const string TIME_15000 = '15000';
  public const string DEFAULT_TIME = self::TIME_5000;

  /**
   * Breakpoint values.
   */
  public const string DEFAULT_BREAKPOINT = '992';

  /**
   * Carousel style values.
   *
   * The ring is the default so every existing view renders exactly as before.
   */
  public const string STYLE_RING = 'ring';
  public const string STYLE_COVERFLOW = 'coverflow';
  public const string DEFAULT_CAROUSEL_STYLE = self::STYLE_RING;

  /**
   * Every allowed carousel style, for validation.
   *
   * @var list<string>
   */
  public const array CAROUSEL_STYLES = [self::STYLE_RING, self::STYLE_COVERFLOW];

  /**
   * Defaults.
   */
  public const int DEFAULT_PERSPECTIVE = 0;
  public const string DEFAULT_BACKGROUND_COLOR = '#ffffff';
  public const float DEFAULT_BACKGROUND_OPACITY = 0.7;
  public const bool DEFAULT_DISABLE_BACKGROUND = FALSE;
  public const int DEFAULT_SCROLLABLE_DOTS_WIDTH = 0;

  /**
   * Bounds.
   */
  public const int MIN_PERSPECTIVE = 0;
  public const int PERSPECTIVE_STEP = 10;
  public const float MIN_OPACITY = 0.0;
  public const float MAX_OPACITY = 1.0;
  public const float OPACITY_STEP = 0.1;
  public const int MIN_SCROLLABLE_DOTS_WIDTH = 120;
  public const int MAX_SCROLLABLE_DOTS_WIDTH = 700;

  /**
   * Reserved deeplink-identifier words specific to vvjc.
   *
   * Conflict with vvjc's URL fragment prefix `#carousel3d-{id}-{n}`.
   *
   * @var list<string>
   */
  public const array DEEPLINK_RESERVED_WORDS = ['carousel3d', 'carousel', 'slide', 'vvjc', 'vvj'];

  /**
   * Prevent instantiation.
   */
  private function __construct() {
  }

}
