<?php

declare(strict_types=1);

namespace Drupal\vvjc\Plugin\views\style;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Url;
use Drupal\views\Attribute\ViewsStyle;
use Drupal\vvj_core\Plugin\views\style\VvjStylePluginBase;
use Drupal\vvjc\VvjcConstants;

/**
 * Renders Views rows as a vanilla-JavaScript 3D carousel.
 *
 * @ingroup views_style_plugins
 */
#[ViewsStyle(
  id: 'views_vvjc',
  title: new TranslatableMarkup('Views Vanilla JavaScript 3D Carousel'),
  help: new TranslatableMarkup('Render items in a 3D carousel.'),
  theme: 'views_view_vvjc',
  display_types: ['normal'],
)]
class Carousel3D extends VvjStylePluginBase {

  /**
   * {@inheritdoc}
   */
  public function getModuleSlug(): string {
    return 'vvjc';
  }

  /**
   * {@inheritdoc}
   */
  public function getCustomElementTag(): string {
    return 'vvjc-carousel';
  }

  /**
   * {@inheritdoc}
   *
   * Restores v1's wording, including the Dots Navigation requirement note.
   */
  protected function getDeeplinkEnableDescription(): TranslatableMarkup {
    return $this->t('Enable deep linking to create shareable URLs for specific slides. <strong>Note: This feature requires Dots Navigation to be enabled.</strong>');
  }

  /**
   * {@inheritdoc}
   *
   * Restores v1's wording, including the #carousel3d-gallery-3 example.
   */
  protected function getDeeplinkIdentifierDescription(): TranslatableMarkup {
    return $this->t('Short identifier used in slide links. Example: "gallery" creates links like #carousel3d-gallery-3. Will be automatically cleaned: converted to lowercase, spaces become hyphens, special characters removed.');
  }

  /**
   * {@inheritdoc}
   *
   * Vvjc does not ship a `vvjc-style` library — the main `vvjc`
   * library already includes the visual layer.
   */
  protected function supportsEnableCss(): bool {
    return FALSE;
  }

  /**
   * {@inheritdoc}
   *
   * @return list<string>
   *   Reserved words that conflict with vvjc's `#carousel3d-` prefix.
   */
  protected function getDeeplinkReservedWords(): array {
    return VvjcConstants::DEEPLINK_RESERVED_WORDS;
  }

  /**
   * {@inheritdoc}
   */
  protected function definePatternOptions(array $options): array {
    $options['max_width'] = ['default' => VvjcConstants::DEFAULT_MAX_WIDTH];
    $options['time_in_seconds'] = ['default' => VvjcConstants::DEFAULT_TIME];
    $options['large_screen_height'] = ['default' => VvjcConstants::DEFAULT_LARGE_SCREEN_HEIGHT];
    $options['small_screen_height'] = ['default' => VvjcConstants::DEFAULT_SMALL_SCREEN_HEIGHT];
    $options['available_breakpoints'] = ['default' => VvjcConstants::DEFAULT_BREAKPOINT];
    $options['perspective'] = ['default' => VvjcConstants::DEFAULT_PERSPECTIVE];
    $options['background_color'] = ['default' => VvjcConstants::DEFAULT_BACKGROUND_COLOR];
    $options['background_color_opacity'] = ['default' => VvjcConstants::DEFAULT_BACKGROUND_OPACITY];
    $options['disable_background'] = ['default' => VvjcConstants::DEFAULT_DISABLE_BACKGROUND];
    $options['show_navigation_arrows'] = ['default' => TRUE];
    $options['show_play_pause'] = ['default' => TRUE];
    $options['show_slide_counter'] = ['default' => TRUE];
    $options['show_progress_bar'] = ['default' => TRUE];
    $options['show_dots_navigation'] = ['default' => TRUE];
    $options['enable_keyboard_nav'] = ['default' => TRUE];
    $options['enable_touch_swipe'] = ['default' => TRUE];
    $options['enable_pause_on_hover'] = ['default' => TRUE];
    $options['enable_screen_reader'] = ['default' => TRUE];
    $options['pause_on_reduced_motion'] = ['default' => TRUE];
    $options['scrollable_dots_width'] = ['default' => VvjcConstants::DEFAULT_SCROLLABLE_DOTS_WIDTH];
    return $options;
  }

  /**
   * {@inheritdoc}
   */
  protected function buildPatternSections(array &$form): void {
    $this->buildDimensionsSection($form);
    $this->buildBehaviorSection($form);
    $this->buildControlsSection($form);
    $this->buildAccessibilitySection($form);
    $this->buildStyleSection($form);
    $this->buildResponsiveSection($form);
  }

  /**
   * Dimensions section — width, large/small height, perspective.
   *
   * @param array<int|string, mixed> $form
   *   The form, modified in place.
   */
  protected function buildDimensionsSection(array &$form): void {
    $form['dimensions_section'] = [
      '#type' => 'details',
      '#title' => $this->t('Dimensions Settings'),
      '#open' => TRUE,
      '#weight' => -40,
    ];

    $form['dimensions_section']['max_width'] = [
      '#type' => 'select',
      '#title' => $this->t('Max Width'),
      '#options' => [
        VvjcConstants::WIDTH_300 => $this->t('300 px'),
        VvjcConstants::WIDTH_400 => $this->t('400 px'),
        VvjcConstants::WIDTH_500 => $this->t('500 px'),
        VvjcConstants::WIDTH_600 => $this->t('600 px'),
        VvjcConstants::WIDTH_700 => $this->t('700 px'),
        VvjcConstants::WIDTH_800 => $this->t('800 px'),
        VvjcConstants::WIDTH_900 => $this->t('900 px'),
        VvjcConstants::WIDTH_1000 => $this->t('1000 px'),
      ],
      '#default_value' => $this->options['max_width'],
      '#description' => $this->t('Choose the maximum width for carousel items.'),
      '#required' => TRUE,
    ];

    $heights_large = [
      VvjcConstants::HEIGHT_100 => $this->t('100 px'),
      VvjcConstants::HEIGHT_150 => $this->t('150 px'),
      VvjcConstants::HEIGHT_200 => $this->t('200 px'),
      VvjcConstants::HEIGHT_250 => $this->t('250 px'),
      VvjcConstants::HEIGHT_300 => $this->t('300 px'),
      VvjcConstants::HEIGHT_350 => $this->t('350 px'),
      VvjcConstants::HEIGHT_400 => $this->t('400 px'),
      VvjcConstants::HEIGHT_450 => $this->t('450 px'),
      VvjcConstants::HEIGHT_500 => $this->t('500 px'),
      VvjcConstants::HEIGHT_550 => $this->t('550 px'),
    ];

    $form['dimensions_section']['large_screen_height'] = [
      '#type' => 'select',
      '#title' => $this->t('Large Screen Height'),
      '#options' => $heights_large,
      '#default_value' => $this->options['large_screen_height'],
      '#description' => $this->t('The height applied uniformly to all carousel items on large screens.'),
      '#required' => TRUE,
    ];

    $heights_small = $heights_large;
    unset($heights_small[VvjcConstants::HEIGHT_550]);

    $form['dimensions_section']['small_screen_height'] = [
      '#type' => 'select',
      '#title' => $this->t('Small Screen Height'),
      '#options' => $heights_small,
      '#default_value' => $this->options['small_screen_height'],
      '#description' => $this->t('The height applied uniformly to all carousel items on small screens.'),
      '#required' => TRUE,
    ];

    $form['dimensions_section']['perspective'] = [
      '#type' => 'number',
      '#title' => $this->t('Perspective (px)'),
      '#default_value' => $this->options['perspective'],
      '#min' => VvjcConstants::MIN_PERSPECTIVE,
      '#step' => VvjcConstants::PERSPECTIVE_STEP,
      '#description' => $this->t('The 3D perspective depth. By default, this adjusts with width selection. You can modify this value if the carousel circle appears too broad. Zero uses the default.'),
      '#required' => TRUE,
    ];
  }

  /**
   * Behavior section — autoplay interval, hover/swipe/keyboard.
   *
   * @param array<int|string, mixed> $form
   *   The form, modified in place.
   */
  protected function buildBehaviorSection(array &$form): void {
    $form['behavior_section'] = [
      '#type' => 'details',
      '#title' => $this->t('Behavior Settings'),
      '#open' => TRUE,
      '#weight' => -30,
    ];

    $form['behavior_section']['time_in_seconds'] = [
      '#type' => 'select',
      '#title' => $this->t('Auto-rotate Interval'),
      '#options' => [
        VvjcConstants::TIME_NONE => $this->t('None'),
        VvjcConstants::TIME_2000 => $this->t('2 s'),
        VvjcConstants::TIME_3000 => $this->t('3 s'),
        VvjcConstants::TIME_4000 => $this->t('4 s'),
        VvjcConstants::TIME_5000 => $this->t('5 s'),
        VvjcConstants::TIME_6000 => $this->t('6 s'),
        VvjcConstants::TIME_7000 => $this->t('7 s'),
        VvjcConstants::TIME_8000 => $this->t('8 s'),
        VvjcConstants::TIME_9000 => $this->t('9 s'),
        VvjcConstants::TIME_10000 => $this->t('10 s'),
        VvjcConstants::TIME_11000 => $this->t('11 s'),
        VvjcConstants::TIME_12000 => $this->t('12 s'),
        VvjcConstants::TIME_13000 => $this->t('13 s'),
        VvjcConstants::TIME_14000 => $this->t('14 s'),
        VvjcConstants::TIME_15000 => $this->t('15 s'),
      ],
      '#default_value' => $this->options['time_in_seconds'],
      '#description' => $this->t('Choose the rotation interval for auto-advancing slides. Select "None" to disable automatic rotation.'),
      '#required' => TRUE,
    ];

    $form['behavior_section']['enable_pause_on_hover'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Pause on Hover'),
      '#default_value' => $this->options['enable_pause_on_hover'],
      '#description' => $this->t('Pause the carousel rotation when the user hovers over it.'),
    ];

    $form['behavior_section']['enable_touch_swipe'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable Touch/Swipe Gestures'),
      '#default_value' => $this->options['enable_touch_swipe'],
      '#description' => $this->t('Allow users to navigate the carousel by swiping on touch devices.'),
    ];

    $form['behavior_section']['enable_keyboard_nav'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable Keyboard Navigation'),
      '#default_value' => $this->options['enable_keyboard_nav'],
      '#description' => $this->t('Enable keyboard controls: Arrow keys to navigate, Space to play/pause, Home for first slide, End for last slide.'),
    ];
  }

  /**
   * Controls section — arrows, play/pause, counter, progress, dots.
   *
   * @param array<int|string, mixed> $form
   *   The form, modified in place.
   */
  protected function buildControlsSection(array &$form): void {
    $form['controls_section'] = [
      '#type' => 'details',
      '#title' => $this->t('Controls & Navigation'),
      '#open' => TRUE,
      '#weight' => -25,
    ];

    $form['controls_section']['show_navigation_arrows'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show Navigation Arrows'),
      '#default_value' => $this->options['show_navigation_arrows'],
      '#description' => $this->t('Display previous and next arrow buttons for manual navigation.'),
    ];

    $form['controls_section']['show_play_pause'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show Play/Pause Button'),
      '#default_value' => $this->options['show_play_pause'],
      '#description' => $this->t('Display a button to control carousel auto-rotation.'),
    ];

    $form['controls_section']['show_slide_counter'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show Slide Counter'),
      '#default_value' => $this->options['show_slide_counter'],
      '#description' => $this->t('Display current slide number (e.g., "3 of 10").'),
    ];

    $form['controls_section']['show_progress_bar'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show Progress Bar'),
      '#default_value' => $this->options['show_progress_bar'],
      '#description' => $this->t('Display a visual progress indicator showing time until next slide. Note: Requires auto-rotation to be enabled.'),
      '#states' => [
        'disabled' => [
          ':input[name="style_options[behavior_section][time_in_seconds]"]' => ['value' => VvjcConstants::TIME_NONE],
        ],
      ],
    ];

    $form['controls_section']['show_dots_navigation'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show Dots Navigation'),
      '#default_value' => $this->options['show_dots_navigation'],
      '#description' => $this->t('Display clickable dot indicators for each slide, allowing direct navigation to any slide.<strong> Note: This feature required by Deep Linking.</strong>'),
    ];

    $form['controls_section']['scrollable_dots_width'] = [
      '#type' => 'number',
      '#title' => $this->t('Scrollable dots width (px)'),
      '#default_value' => $this->options['scrollable_dots_width'] ?? VvjcConstants::DEFAULT_SCROLLABLE_DOTS_WIDTH,
      '#min' => 0,
      '#max' => VvjcConstants::MAX_SCROLLABLE_DOTS_WIDTH,
      '#step' => 1,
      '#field_suffix' => 'px',
      '#description' => $this->t('Set a maximum width for the dots navigation to make it scrollable. Set to 0 to disable. Range: @min-@max px.', [
        '@min' => VvjcConstants::MIN_SCROLLABLE_DOTS_WIDTH,
        '@max' => VvjcConstants::MAX_SCROLLABLE_DOTS_WIDTH,
      ]),
      '#states' => [
        'visible' => [
          ':input[name="style_options[controls_section][show_dots_navigation]"]' => ['checked' => TRUE],
        ],
      ],
    ];
  }

  /**
   * Accessibility section — screen-reader, reduced-motion.
   *
   * @param array<int|string, mixed> $form
   *   The form, modified in place.
   */
  protected function buildAccessibilitySection(array &$form): void {
    $form['accessibility_section'] = [
      '#type' => 'details',
      '#title' => $this->t('Accessibility Options'),
      '#open' => TRUE,
      '#weight' => -22,
    ];

    $form['accessibility_section']['enable_screen_reader'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable Screen Reader Announcements'),
      '#default_value' => $this->options['enable_screen_reader'],
      '#description' => $this->t('Announce slide changes to screen reader users via ARIA live regions.'),
    ];

    $form['accessibility_section']['pause_on_reduced_motion'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Respect Reduced Motion Preference'),
      '#default_value' => $this->options['pause_on_reduced_motion'],
      '#description' => $this->t('Automatically pause carousel rotation for users who prefer reduced motion (accessibility setting).'),
    ];
  }

  /**
   * Style section — background color + opacity + disable.
   *
   * @param array<int|string, mixed> $form
   *   The form, modified in place.
   */
  protected function buildStyleSection(array &$form): void {
    $form['style_section'] = [
      '#type' => 'details',
      '#title' => $this->t('Style Settings'),
      '#open' => TRUE,
      '#weight' => -20,
    ];

    $form['style_section']['background_color'] = [
      '#type' => 'color',
      '#title' => $this->t('Background Color'),
      '#default_value' => $this->options['background_color'],
      '#description' => $this->t('Choose a background color. This color will be applied to each carousel item.'),
      '#empty_value' => '',
      '#states' => [
        'disabled' => [
          ':input[name="style_options[style_section][disable_background]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $raw_opacity = $this->options['background_color_opacity'] ?? VvjcConstants::DEFAULT_BACKGROUND_OPACITY;
    $opacity_display = is_scalar($raw_opacity) ? (string) $raw_opacity : '';

    $form['style_section']['background_color_opacity'] = [
      '#type' => 'range',
      '#title' => $this->t('Background Color Opacity'),
      '#default_value' => $this->options['background_color_opacity'],
      '#min' => VvjcConstants::MIN_OPACITY,
      '#max' => VvjcConstants::MAX_OPACITY,
      '#step' => VvjcConstants::OPACITY_STEP,
      '#description' => $this->t('Set the opacity level for the background color.'),
      '#suffix' => '<span id="background-opacity-value">' . $opacity_display . '</span>',
      '#attributes' => [
        'oninput' => 'document.getElementById("background-opacity-value").innerText = this.value;',
      ],
      '#states' => [
        'disabled' => [
          ':input[name="style_options[style_section][disable_background]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['style_section']['disable_background'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Disable Background Color'),
      '#default_value' => $this->options['disable_background'],
      '#description' => $this->t('Check this to disable background color completely.'),
    ];
  }

  /**
   * Responsive section — breakpoint at which layout shifts.
   *
   * @param array<int|string, mixed> $form
   *   The form, modified in place.
   */
  protected function buildResponsiveSection(array &$form): void {
    $form['responsive_section'] = [
      '#type' => 'details',
      '#title' => $this->t('Responsive Settings'),
      '#open' => FALSE,
      '#weight' => -10,
    ];

    $form['responsive_section']['available_breakpoints'] = [
      '#type' => 'select',
      '#title' => $this->t('Responsive Breakpoint'),
      '#options' => [
        '576' => $this->t('576 px / 36 rem'),
        '768' => $this->t('768 px / 48 rem'),
        '992' => $this->t('992 px / 62 rem'),
        '1200' => $this->t('1200 px / 75 rem'),
        '1400' => $this->t('1400 px / 87.5 rem'),
      ],
      '#default_value' => $this->options['available_breakpoints'],
      '#description' => $this->t('Choose a breakpoint for the carousel. This defines the width at which the carousel will adjust its layout.'),
      '#required' => TRUE,
    ];
  }

  /**
   * {@inheritdoc}
   *
   * Add the breakpoint-specific responsive library on top of the
   * shared library list.
   *
   * @return list<string>
   *   Library identifiers.
   */
  protected function buildLibraryList(): array {
    $libraries = parent::buildLibraryList();
    $raw_breakpoint = $this->options['available_breakpoints'] ?? VvjcConstants::DEFAULT_BREAKPOINT;
    $breakpoint = is_scalar($raw_breakpoint) ? (string) $raw_breakpoint : VvjcConstants::DEFAULT_BREAKPOINT;
    $libraries[] = 'vvjc/vvjc__' . $breakpoint;
    return $libraries;
  }

  /**
   * {@inheritdoc}
   *
   * @param array<int|string, mixed> $form
   *   The Views style options form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  public function validateOptionsForm(&$form, FormStateInterface $form_state): void {
    parent::validateOptionsForm($form, $form_state);

    // Cross-field rule: deep linking requires dots navigation.
    $deeplink_values = $form_state->getValue(['style_options', 'deeplink_section']);
    $controls_values = $form_state->getValue(['style_options', 'controls_section']);
    $enable_deeplink = is_array($deeplink_values) && !empty($deeplink_values['enable_deeplink']);
    $show_dots = is_array($controls_values) && !empty($controls_values['show_dots_navigation']);

    if ($enable_deeplink && !$show_dots) {
      $deeplink_form = $form['deeplink_section'] ?? NULL;
      $deeplink_el = is_array($deeplink_form) ? ($deeplink_form['enable_deeplink'] ?? NULL) : NULL;
      if (is_array($deeplink_el)) {
        $form_state->setError(
          $deeplink_el,
          $this->t('Deep Linking requires Dots Navigation to be enabled.'),
        );
      }
    }
  }

  /**
   * {@inheritdoc}
   *
   * @param array<int|string, mixed> $form
   *   The Views style options form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  public function submitOptionsForm(&$form, FormStateInterface $form_state): void {
    $values = $form_state->getValue('style_options');
    if (!is_array($values)) {
      $values = [];
    }
    $form_state->setValue('style_options', $this->flattenFormValues($values));
    parent::submitOptionsForm($form, $form_state);
  }

  /**
   * Flatten the sectioned form values back into the persisted shape.
   *
   * @param array<int|string, mixed> $values
   *   Submitted form values keyed by section then by option name.
   *
   * @return array<string, mixed>
   *   Flattened option array.
   */
  protected function flattenFormValues(array $values): array {
    $flattened = [];

    $dimensions = $values['dimensions_section'] ?? NULL;
    if (is_array($dimensions)) {
      $flattened['max_width'] = $dimensions['max_width'] ?? VvjcConstants::DEFAULT_MAX_WIDTH;
      $flattened['large_screen_height'] = $dimensions['large_screen_height'] ?? VvjcConstants::DEFAULT_LARGE_SCREEN_HEIGHT;
      $flattened['small_screen_height'] = $dimensions['small_screen_height'] ?? VvjcConstants::DEFAULT_SMALL_SCREEN_HEIGHT;
      $flattened['perspective'] = $dimensions['perspective'] ?? VvjcConstants::DEFAULT_PERSPECTIVE;
    }

    $deeplink = $values['deeplink_section'] ?? NULL;
    if (is_array($deeplink)) {
      $flattened['enable_deeplink'] = $deeplink['enable_deeplink'] ?? FALSE;
      $flattened['deeplink_identifier'] = $deeplink['deeplink_identifier'] ?? '';
    }

    $behavior = $values['behavior_section'] ?? NULL;
    if (is_array($behavior)) {
      $flattened['time_in_seconds'] = $behavior['time_in_seconds'] ?? VvjcConstants::DEFAULT_TIME;
      $flattened['enable_pause_on_hover'] = $behavior['enable_pause_on_hover'] ?? TRUE;
      $flattened['enable_touch_swipe'] = $behavior['enable_touch_swipe'] ?? TRUE;
      $flattened['enable_keyboard_nav'] = $behavior['enable_keyboard_nav'] ?? TRUE;
    }

    $controls = $values['controls_section'] ?? NULL;
    if (is_array($controls)) {
      $flattened['show_navigation_arrows'] = $controls['show_navigation_arrows'] ?? TRUE;
      $flattened['show_play_pause'] = $controls['show_play_pause'] ?? TRUE;
      $flattened['show_slide_counter'] = $controls['show_slide_counter'] ?? TRUE;
      $flattened['show_progress_bar'] = $controls['show_progress_bar'] ?? FALSE;
      $flattened['show_dots_navigation'] = $controls['show_dots_navigation'] ?? FALSE;
      $flattened['scrollable_dots_width'] = $controls['scrollable_dots_width'] ?? VvjcConstants::DEFAULT_SCROLLABLE_DOTS_WIDTH;
    }

    $accessibility = $values['accessibility_section'] ?? NULL;
    if (is_array($accessibility)) {
      $flattened['enable_screen_reader'] = $accessibility['enable_screen_reader'] ?? TRUE;
      $flattened['pause_on_reduced_motion'] = $accessibility['pause_on_reduced_motion'] ?? TRUE;
    }

    $style = $values['style_section'] ?? NULL;
    if (is_array($style)) {
      $flattened['background_color'] = $style['background_color'] ?? VvjcConstants::DEFAULT_BACKGROUND_COLOR;
      $flattened['background_color_opacity'] = $style['background_color_opacity'] ?? VvjcConstants::DEFAULT_BACKGROUND_OPACITY;
      $flattened['disable_background'] = $style['disable_background'] ?? VvjcConstants::DEFAULT_DISABLE_BACKGROUND;
    }

    $responsive = $values['responsive_section'] ?? NULL;
    if (is_array($responsive)) {
      $flattened['available_breakpoints'] = $responsive['available_breakpoints'] ?? VvjcConstants::DEFAULT_BREAKPOINT;
    }

    $flattened['unique_id'] = $this->options['unique_id'] ?? $this->generateUniqueId();

    return $flattened;
  }

  /**
   * {@inheritdoc}
   *
   * Each Views row is rendered as a 3D card via the generic row plugin, so
   * vvjc works with ANY row style (Fields or Content/entity rows) exactly as
   * v1 did — the shipped example uses `entity:node` teaser rows. Opt out of
   * the base's Fields-row enforcement (which would force-switch the row and
   * block validation).
   */
  protected function requiresFieldsRow(): bool {
    return FALSE;
  }

  /**
   * {@inheritdoc}
   *
   * Surfaces a performance note (limit to ~30 items) rather than the base's
   * generic Fields-row note — matching v1.
   */
  protected function buildWarningMessage(array &$form): void {
    $example_id = $this->getModuleSlug() . '_example';
    if ($this->view->storage->id() === $example_id) {
      return;
    }

    $form['warning_message'] = [
      '#type' => 'markup',
      '#markup' => '<div class="messages messages--warning">' . $this->t(
        'Note: It is recommended to limit the number of items to 30 for optimal performance. To see an example, check the @example view by clicking <a href="@url">here</a> to edit it.',
        [
          '@example' => $example_id,
          '@url' => Url::fromRoute('entity.view.edit_form', ['view' => $example_id])->toString(),
        ],
      ) . '</div>',
      '#weight' => -50,
    ];
  }

}
