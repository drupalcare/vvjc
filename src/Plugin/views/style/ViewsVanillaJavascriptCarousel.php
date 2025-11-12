<?php

declare(strict_types=1);

namespace Drupal\vvjc\Plugin\views\style;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\views\Plugin\views\style\StylePluginBase;
use Drupal\vvjc\VvjcConstants;

/**
 * Style plugin to render items in a 3D carousel.
 *
 * @ingroup views_style_plugins
 *
 * @ViewsStyle(
 *   id = "views_vvjc",
 *   title = @Translation("Views Vanilla JavaScript 3D Carousel"),
 *   help = @Translation("Render items in a 3D carousel."),
 *   theme = "views_view_vvjc",
 *   display_types = { "normal" }
 * )
 */
class ViewsVanillaJavascriptCarousel extends StylePluginBase {

  /**
   * Does the style plugin use a row plugin.
   *
   * @var bool
   */
  protected $usesRowPlugin = TRUE;

  /**
   * {@inheritdoc}
   */
  protected $usesRowClass = TRUE;

  /**
   * Cached unique ID for this view display.
   *
   * @var int|null
   */
  protected ?int $cachedUniqueId = NULL;

  /**
   * {@inheritdoc}
   */
  protected function defineOptions(): array {
    $options = parent::defineOptions();
    $options['max_width'] = ['default' => VvjcConstants::DEFAULT_MAX_WIDTH];
    $options['time_in_seconds'] = ['default' => VvjcConstants::DEFAULT_TIME];
    $options['large_screen_height'] = ['default' => VvjcConstants::DEFAULT_LARGE_SCREEN_HEIGHT];
    $options['small_screen_height'] = ['default' => VvjcConstants::DEFAULT_SMALL_SCREEN_HEIGHT];
    $options['available_breakpoints'] = ['default' => VvjcConstants::DEFAULT_BREAKPOINT];
    $options['perspective'] = ['default' => VvjcConstants::DEFAULT_PERSPECTIVE];
    $options['unique_id'] = ['default' => $this->generateUniqueId()];
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
    return $options;
  }

  /**
   * {@inheritdoc}
   */
  public function buildOptionsForm(&$form, FormStateInterface $form_state): void {
    parent::buildOptionsForm($form, $form_state);

    $this->setDefaultElementWeights($form);
    $this->buildWarningMessage($form);
    $this->buildDimensionsSection($form);
    $this->buildBehaviorSection($form);
    $this->buildControlsSection($form);
    $this->buildAccessibilitySection($form);
    $this->buildStyleSection($form);
    $this->buildResponsiveSection($form);
    $this->buildTokenDocumentation($form);
  }

  /**
   * Set weights for default Drupal form elements.
   */
  protected function setDefaultElementWeights(array &$form): void {
    $default_elements = [
      'grouping' => -100,
      'row_class' => -90,
      'default_row_class' => -85,
      'uses_fields' => -80,
      'class' => -75,
      'wrapper_class' => -70,
    ];

    foreach ($default_elements as $element_key => $weight) {
      if (isset($form[$element_key])) {
        $form[$element_key]['#weight'] = $weight;
      }
    }
  }

  /**
   * Build warning message section.
   */
  protected function buildWarningMessage(array &$form): void {
    // Don't show the message if we're already editing the example view.
    if ($this->view->storage->id() === 'vvjc_example') {
      return;
    }

    $form['warning_message'] = [
      '#type' => 'markup',
      '#markup' => '<div class="messages messages--warning">' . $this->t(
        'Note: It is recommended to limit the number of items to 30 for optimal performance. To see an example, check the vvjc_example view by clicking <a href="@url">here</a> to edit it.', [
          '@url' => Url::fromRoute('entity.view.edit_form', ['view' => 'vvjc_example'])->toString(),
        ]
      ) . '</div>',
      '#weight' => -50,
    ];
  }

  /**
   * Build dimensions configuration section.
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

    $form['dimensions_section']['large_screen_height'] = [
      '#type' => 'select',
      '#title' => $this->t('Large Screen Height'),
      '#options' => [
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
      ],
      '#default_value' => $this->options['large_screen_height'],
      '#description' => $this->t('The height applied uniformly to all carousel items on large screens.'),
      '#required' => TRUE,
    ];

    $form['dimensions_section']['small_screen_height'] = [
      '#type' => 'select',
      '#title' => $this->t('Small Screen Height'),
      '#options' => [
        VvjcConstants::HEIGHT_100 => $this->t('100 px'),
        VvjcConstants::HEIGHT_150 => $this->t('150 px'),
        VvjcConstants::HEIGHT_200 => $this->t('200 px'),
        VvjcConstants::HEIGHT_250 => $this->t('250 px'),
        VvjcConstants::HEIGHT_300 => $this->t('300 px'),
        VvjcConstants::HEIGHT_350 => $this->t('350 px'),
        VvjcConstants::HEIGHT_400 => $this->t('400 px'),
        VvjcConstants::HEIGHT_450 => $this->t('450 px'),
        VvjcConstants::HEIGHT_500 => $this->t('500 px'),
      ],
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
   * Build behavior configuration section.
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
   * Build controls configuration section.
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
      '#description' => $this->t('Display clickable dot indicators for each slide, allowing direct navigation to any slide.'),
    ];
  }

  /**
   * Build accessibility configuration section.
   */
  protected function buildAccessibilitySection(array &$form): void {
    $form['accessibility_section'] = [
      '#type' => 'details',
      '#title' => $this->t('Accessibility Options'),
      '#open' => FALSE,
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
   * Build style configuration section.
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

    $form['style_section']['background_color_opacity'] = [
      '#type' => 'range',
      '#title' => $this->t('Background Color Opacity'),
      '#default_value' => $this->options['background_color_opacity'],
      '#min' => VvjcConstants::MIN_OPACITY,
      '#max' => VvjcConstants::MAX_OPACITY,
      '#step' => VvjcConstants::OPACITY_STEP,
      '#description' => $this->t('Set the opacity level for the background color.'),
      '#suffix' => '<span id="background-opacity-value">' . $this->options['background_color_opacity'] . '</span>',
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
   * Build responsive configuration section.
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
        VvjcConstants::BREAKPOINT_576 => $this->t('576px / 36rem'),
        VvjcConstants::BREAKPOINT_768 => $this->t('768px / 48rem'),
        VvjcConstants::BREAKPOINT_992 => $this->t('992px / 62rem'),
        VvjcConstants::BREAKPOINT_1200 => $this->t('1200px / 75rem'),
        VvjcConstants::BREAKPOINT_1400 => $this->t('1400px / 87.5rem'),
      ],
      '#default_value' => $this->options['available_breakpoints'],
      '#description' => $this->t('Choose a breakpoint for the carousel. This defines the width at which the carousel will adjust its layout.'),
      '#required' => TRUE,
    ];
  }

  /**
   * Build token documentation section.
   */
  protected function buildTokenDocumentation(array &$form): void {
    $form['token_section'] = [
      '#type' => 'details',
      '#title' => $this->t('Token Documentation'),
      '#open' => FALSE,
      '#weight' => 100,
    ];

    $form['token_section']['description'] = [
      '#markup' => $this->t('<p>When using <em>Global: Text area</em> or <em>Global: Unfiltered text</em> in the Views header, footer, or empty text areas, the default Twig-style tokens (e.g., <code>{{ title }}</code>) will not work with the VVJC style plugin.</p>
        <p>Instead, use the custom VVJC token format to access field values from the <strong>first row</strong> of the View result:</p>
        <ul>
          <li><code>[vvjc:field_name]</code> — The rendered output of the field (e.g., linked title, image, formatted text).</li>
          <li><code>[vvjc:field_name:plain]</code> — A plain-text version of the field, with all HTML stripped.</li>
        </ul>
        <p>Examples:</p>
        <ul>
          <li><code>{{ title }}</code> ➜ <code>[vvjc:title]</code></li>
          <li><code>{{ field_image }}</code> ➜ <code>[vvjc:field_image]</code></li>
          <li><code>{{ body }}</code> ➜ <code>[vvjc:body:plain]</code></li>
        </ul>
        <p>These tokens offer safe and flexible field output for dynamic headings, summaries, and fallback messages in VVJC-enabled Views.</p>'),
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function submitOptionsForm(&$form, FormStateInterface $form_state): void {
    $values = $form_state->getValue('style_options');
    $flattened_values = $this->flattenFormValues($values);
    $form_state->setValue('style_options', $flattened_values);

    parent::submitOptionsForm($form, $form_state);
  }

  /**
   * Flatten nested form values to match original structure.
   */
  protected function flattenFormValues(array $values): array {
    $flattened = [];

    if (isset($values['dimensions_section'])) {
      $flattened['max_width'] = $values['dimensions_section']['max_width'] ?? VvjcConstants::DEFAULT_MAX_WIDTH;
      $flattened['large_screen_height'] = $values['dimensions_section']['large_screen_height'] ?? VvjcConstants::DEFAULT_LARGE_SCREEN_HEIGHT;
      $flattened['small_screen_height'] = $values['dimensions_section']['small_screen_height'] ?? VvjcConstants::DEFAULT_SMALL_SCREEN_HEIGHT;
      $flattened['perspective'] = $values['dimensions_section']['perspective'] ?? VvjcConstants::DEFAULT_PERSPECTIVE;
    }

    if (isset($values['behavior_section'])) {
      $flattened['time_in_seconds'] = $values['behavior_section']['time_in_seconds'] ?? VvjcConstants::DEFAULT_TIME;
      $flattened['enable_pause_on_hover'] = $values['behavior_section']['enable_pause_on_hover'] ?? TRUE;
      $flattened['enable_touch_swipe'] = $values['behavior_section']['enable_touch_swipe'] ?? TRUE;
      $flattened['enable_keyboard_nav'] = $values['behavior_section']['enable_keyboard_nav'] ?? TRUE;
    }

    if (isset($values['controls_section'])) {
      $flattened['show_navigation_arrows'] = $values['controls_section']['show_navigation_arrows'] ?? TRUE;
      $flattened['show_play_pause'] = $values['controls_section']['show_play_pause'] ?? TRUE;
      $flattened['show_slide_counter'] = $values['controls_section']['show_slide_counter'] ?? TRUE;
      $flattened['show_progress_bar'] = $values['controls_section']['show_progress_bar'] ?? FALSE;
      $flattened['show_dots_navigation'] = $values['controls_section']['show_dots_navigation'] ?? FALSE;
    }

    if (isset($values['accessibility_section'])) {
      $flattened['enable_screen_reader'] = $values['accessibility_section']['enable_screen_reader'] ?? TRUE;
      $flattened['pause_on_reduced_motion'] = $values['accessibility_section']['pause_on_reduced_motion'] ?? TRUE;
    }

    if (isset($values['style_section'])) {
      $flattened['background_color'] = $values['style_section']['background_color'] ?? VvjcConstants::DEFAULT_BACKGROUND_COLOR;
      $flattened['background_color_opacity'] = $values['style_section']['background_color_opacity'] ?? VvjcConstants::DEFAULT_BACKGROUND_OPACITY;
      $flattened['disable_background'] = $values['style_section']['disable_background'] ?? VvjcConstants::DEFAULT_DISABLE_BACKGROUND;
    }

    if (isset($values['responsive_section'])) {
      $flattened['available_breakpoints'] = $values['responsive_section']['available_breakpoints'] ?? VvjcConstants::DEFAULT_BREAKPOINT;
    }

    $flattened['unique_id'] = $this->options['unique_id'] ?? $this->generateUniqueId();

    return $flattened;
  }

  /**
   * Generates a unique numeric ID for the view display.
   *
   * @return int
   *   A unique ID between 10000000 and 99999999.
   *
   * @throws \Exception
   *   If an appropriate source of randomness cannot be found.
   */
  protected function generateUniqueId(): int {
    if ($this->cachedUniqueId !== NULL) {
      return $this->cachedUniqueId;
    }

    $this->cachedUniqueId = random_int(VvjcConstants::MIN_UNIQUE_ID, VvjcConstants::MAX_UNIQUE_ID);

    if ($this->cachedUniqueId < VvjcConstants::MIN_UNIQUE_ID) {
      $this->cachedUniqueId += VvjcConstants::MIN_UNIQUE_ID;
    }
    if ($this->cachedUniqueId > VvjcConstants::MAX_UNIQUE_ID) {
      $range = VvjcConstants::MAX_UNIQUE_ID - VvjcConstants::MIN_UNIQUE_ID + 1;
      $this->cachedUniqueId = $this->cachedUniqueId % $range + VvjcConstants::MIN_UNIQUE_ID;
    }

    return $this->cachedUniqueId;
  }

  /**
   * {@inheritdoc}
   */
  public function render(): array {
    $rows = [];

    if (!empty($this->view->result)) {
      foreach ($this->view->result as $row) {
        $rendered_row = $this->view->rowPlugin->render($row);
        if ($rendered_row !== NULL) {
          $rows[] = $rendered_row;
        }
      }
    }

    $libraries = $this->buildLibraryList();

    $build = [
      '#theme' => $this->themeFunctions(),
      '#view' => $this->view,
      '#options' => $this->options,
      '#rows' => $rows,
      '#unique_id' => $this->options['unique_id'] ?? $this->generateUniqueId(),
      '#attached' => [
        'library' => $libraries,
      ],
    ];

    return $build;
  }

  /**
   * Build the list of libraries to attach.
   *
   * @return array
   *   An array of library names to attach.
   */
  protected function buildLibraryList(): array {
    return [
      'vvjc/vvjc',
      'vvjc/vvjc__' . ($this->options['available_breakpoints'] ?? VvjcConstants::DEFAULT_BREAKPOINT),
    ];
  }

}
