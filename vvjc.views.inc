<?php

/**
 * @file
 * Contains the hook implementations for the 3D Carousel Views style plugin.
 */

/**
 * Implements hook_views_data_alter().
 */
function vvjc_views_data_alter(array &$data): void {
  // Define the style plugin schema.
  $data['views_style_plugin']['views_vvjc'] = [
    'type' => 'views_style',
    'label' => t('3D Carousel'),
    'mapping' => [
      'max_width' => [
        'type' => 'string',
        'label' => t('Max Width'),
      ],
      'time_in_seconds' => [
        'type' => 'integer',
        'label' => t('Time In Seconds'),
      ],
      'large_screen_height' => [
        'type' => 'integer',
        'label' => t('Large Screen Height'),
      ],
      'small_screen_height' => [
        'type' => 'integer',
        'label' => t('Small Screen Height'),
      ],
      'available_breakpoints' => [
        'type' => 'string',
        'label' => t('Available Breakpoints'),
      ],
      'perspective' => [
        'type' => 'integer',
        'label' => t('Perspective'),
      ],
      'unique_id' => [
        'type' => 'string',
        'label' => t('Unique ID for the view display'),
      ],
      // New fields for background color and opacity.
      'background_color' => [
        'type' => 'string',
        'label' => t('Background Color'),
        'description' => t('The hex code of the background color for carousel items.'),
      ],
      'background_color_opacity' => [
        'type' => 'float',
        'label' => t('Background Color Opacity'),
        'description' => t('The opacity level for the background color of carousel items, ranging from 0 to 1.'),
      ],
    ],
  ];
}
