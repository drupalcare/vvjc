<?php

declare(strict_types=1);

namespace Drupal\vvjc;

/**
 * Defines constants for the VVJC module.
 */
final class VvjcConstants {

  public const BREAKPOINT_576 = '576';
  public const BREAKPOINT_768 = '768';
  public const BREAKPOINT_992 = '992';
  public const BREAKPOINT_1200 = '1200';
  public const BREAKPOINT_1400 = '1400';

  public const WIDTH_300 = '300';
  public const WIDTH_400 = '400';
  public const WIDTH_500 = '500';
  public const WIDTH_600 = '600';
  public const WIDTH_700 = '700';
  public const WIDTH_800 = '800';
  public const WIDTH_900 = '900';
  public const WIDTH_1000 = '1000';

  public const HEIGHT_100 = '100';
  public const HEIGHT_150 = '150';
  public const HEIGHT_200 = '200';
  public const HEIGHT_250 = '250';
  public const HEIGHT_300 = '300';
  public const HEIGHT_350 = '350';
  public const HEIGHT_400 = '400';
  public const HEIGHT_450 = '450';
  public const HEIGHT_500 = '500';
  public const HEIGHT_550 = '550';

  public const TIME_NONE = '0';
  public const TIME_2000 = '2000';
  public const TIME_3000 = '3000';
  public const TIME_4000 = '4000';
  public const TIME_5000 = '5000';
  public const TIME_6000 = '6000';
  public const TIME_7000 = '7000';
  public const TIME_8000 = '8000';
  public const TIME_9000 = '9000';
  public const TIME_10000 = '10000';
  public const TIME_11000 = '11000';
  public const TIME_12000 = '12000';
  public const TIME_13000 = '13000';
  public const TIME_14000 = '14000';
  public const TIME_15000 = '15000';

  public const DEFAULT_MAX_WIDTH = self::WIDTH_500;
  public const DEFAULT_TIME = self::TIME_5000;
  public const DEFAULT_LARGE_SCREEN_HEIGHT = self::HEIGHT_400;
  public const DEFAULT_SMALL_SCREEN_HEIGHT = self::HEIGHT_350;
  public const DEFAULT_BREAKPOINT = self::BREAKPOINT_992;
  public const DEFAULT_PERSPECTIVE = 0;
  public const DEFAULT_BACKGROUND_COLOR = '#ffffff';
  public const DEFAULT_BACKGROUND_OPACITY = 0.7;
  public const DEFAULT_DISABLE_BACKGROUND = FALSE;

  public const MIN_PERSPECTIVE = 0;
  public const PERSPECTIVE_STEP = 10;

  public const MIN_OPACITY = 0;
  public const MAX_OPACITY = 1;
  public const OPACITY_STEP = 0.1;

  public const MIN_UNIQUE_ID = 10000000;
  public const MAX_UNIQUE_ID = 99999999;

  public const TOKEN_NAMESPACE = 'vvjc';
  public const TOKEN_PLAIN_SUFFIX = ':plain';
  public const TOKEN_PATTERN = '/^[a-zA-Z0-9_]+(:plain)?$/';

  public const HEX_COLOR_PATTERN = '/^#[0-9A-Fa-f]{6}$/';
  public const SHORT_HEX_COLOR_PATTERN = '/^#[0-9A-Fa-f]{3}$/';

  public const DATA_ATTRIBUTE_MAP = [
    'time_in_seconds' => 'time-in-seconds',
    'max_width' => 'max-width',
    'large_screen_height' => 'large-screen-height',
    'small_screen_height' => 'small-screen-height',
    'available_breakpoints' => 'available-breakpoints',
    'perspective' => 'perspective',
    'unique_id' => 'unique-id',
    'disable_background' => 'disable-background',
    'show_navigation_arrows' => 'show-navigation-arrows',
    'show_play_pause' => 'show-play-pause',
    'show_slide_counter' => 'show-slide-counter',
    'show_progress_bar' => 'show-progress-bar',
    'show_dots_navigation' => 'show-dots-navigation',
    'enable_keyboard_nav' => 'enable-keyboard-nav',
    'enable_touch_swipe' => 'enable-touch-swipe',
    'enable_pause_on_hover' => 'enable-pause-on-hover',
    'enable_screen_reader' => 'enable-screen-reader',
    'pause_on_reduced_motion' => 'pause-on-reduced-motion',
  ];

  public const VIEWS_TYPE_INTEGER = 'integer';
  public const VIEWS_TYPE_STRING = 'string';
  public const VIEWS_TYPE_BOOLEAN = 'boolean';
  public const VIEWS_TYPE_FLOAT = 'float';

  private function __construct() {
  }

}
