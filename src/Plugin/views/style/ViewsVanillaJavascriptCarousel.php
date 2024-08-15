<?php

namespace Drupal\vvjc\Plugin\views\style;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\views\Plugin\views\style\StylePluginBase;

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
   * Sets default options for the plugin.
   *
   * @return array
   *   An array of default options.
   *
   * @throws \Random\RandomException
   */
  protected function defineOptions(): array {
    $options = parent::defineOptions();
    $options['max_width'] = ['default' => '500'];
    $options['time_in_seconds'] = ['default' => 5000];
    $options['large_screen_height'] = ['default' => 400];
    $options['small_screen_height'] = ['default' => 350];
    $options['available_breakpoints'] = ['default' => '992'];
    $options['perspective'] = ['default' => ''];
    $options['unique_id'] = ['default' => $this->generateUniqueId()];
    $options['background_color'] = ['default' => '#000000'];
    $options['background_color_opacity'] = ['default' => 0.4];
    $options['disable_background'] = ['default' => FALSE];
    return $options;
  }

  /**
   * Builds the options form for the plugin.
   *
   * @param array $form
   *   The form definition array.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The current state of the form.
   */
  public function buildOptionsForm(&$form, FormStateInterface $form_state): void {
    parent::buildOptionsForm($form, $form_state);

    // Add a warning message at the top of the settings form.
    $form['warning_message'] = [
      '#type' => 'markup',
      '#markup' => '<div class="messages messages--warning">' . $this->t(
        'Note: It is recommended to limit the number of items to 30 for optimal performance. To see an example, check the vvjc_example view by clicking <a href="@url">here</a> to edit it.', [
          '@url' => Url::fromRoute('entity.view.edit_form', ['view' => 'vvjc_example'])->toString(),
        ]
      ) . '</div>',
    ];

    $form['available_breakpoints'] = [
      '#type' => 'select',
      '#title' => $this->t('Available Breakpoints'),
      '#options' => [
        '576' => $this->t('576px / 36rem'),
        '768' => $this->t('768px / 48rem'),
        '992' => $this->t('992px / 62rem'),
        '1200' => $this->t('1200px / 75rem'),
        '1400' => $this->t('1400px / 87.5rem'),
      ],
      '#default_value' => $this->options['available_breakpoints'],
      '#description' => $this->t('Choose a breakpoint for the carousel. This defines the width at which the carousel will adjust its layout.'),
      '#required' => TRUE,
    ];

    $form['max_width'] = [
      '#type' => 'select',
      '#title' => $this->t('Max Width'),
      '#options' => [
        '300' => $this->t('300 px'),
        '400' => $this->t('400 px'),
        '500' => $this->t('500 px'),
        '600' => $this->t('600 px'),
        '700' => $this->t('700 px'),
        '800' => $this->t('800 px'),
        '900' => $this->t('900 px'),
        '1000' => $this->t('1000 px'),
      ],
      '#default_value' => $this->options['max_width'],
      '#description' => $this->t('Choose a breakpoint for the carousel. This defines the width at which the carousel will adjust its layout.'),
      '#required' => TRUE,
    ];

    $form['large_screen_height'] = [
      '#type' => 'select',
      '#title' => $this->t('Large Screen Height'),
      '#options' => [
        '100' => $this->t('100 px'),
        '150' => $this->t('150 px'),
        '200' => $this->t('200 px'),
        '250' => $this->t('250 px'),
        '300' => $this->t('300 px'),
        '350' => $this->t('350 px'),
        '400' => $this->t('400 px'),
        '450' => $this->t('450 px'),
        '500' => $this->t('500 px'),
        '550' => $this->t('550 px'),
      ],
      '#default_value' => $this->options['large_screen_height'],
      '#description' => $this->t('The selected breakpoint will determine the height applied uniformly to all carousel items.'),
      '#required' => TRUE,
    ];

    $form['small_screen_height'] = [
      '#type' => 'select',
      '#title' => $this->t('Small Screen Height'),
      '#options' => [
        '100' => $this->t('100 px'),
        '150' => $this->t('150 px'),
        '200' => $this->t('200 px'),
        '250' => $this->t('250 px'),
        '300' => $this->t('300 px'),
        '350' => $this->t('350 px'),
        '400' => $this->t('400 px'),
        '450' => $this->t('450 px'),
        '500' => $this->t('500 px'),
      ],
      '#default_value' => $this->options['small_screen_height'],
      '#description' => $this->t('The selected breakpoint will determine the height applied uniformly to all carousel items.'),
      '#required' => TRUE,
    ];

    $form['time_in_seconds'] = [
      '#type' => 'select',
      '#title' => $this->t('Time In Seconds'),
      '#options' => [
        '0' => $this->t('None'),
        '3000' => $this->t('3 s'),
        '4000' => $this->t('4 s'),
        '5000' => $this->t('5 s'),
        '6000' => $this->t('6 s'),
        '7000' => $this->t('7 s'),
        '8000' => $this->t('8 s'),
        '9000' => $this->t('9 s'),
        '10000' => $this->t('10 s'),
        '11000' => $this->t('11 s'),
        '12000' => $this->t('12 s'),
        '13000' => $this->t('13 s'),
        '14000' => $this->t('14 s'),
        '15000' => $this->t('15 s'),
      ],
      '#default_value' => $this->options['time_in_seconds'],
      '#description' => $this->t('By default, the 3D carousel scrolls every 5 seconds. You can modify this interval. If set between 3-15 seconds, a play/pause button appears and the carousel pauses on mouse hover. To stop the carousel, set the field value to none.'),
      '#required' => TRUE,
    ];

    $form['perspective'] = [
      '#type' => 'number',
      '#title' => $this->t('Perspective'),
      '#default_value' => $this->options['perspective'],
      '#min' => 0,
      '#step' => 10,
      '#description' => $this->t('The details of perspective may change based on the quantity of items in the 3D carousel. By default, this setting adjusts with each width selection. You can modify this value in pixels if the carousel circle appears too broad.'),
      '#required' => FALSE,
    ];

    // Add the background color field.
    $form['background_color'] = [
      '#type' => 'color',
      '#title' => $this->t('Background Color'),
      '#default_value' => $this->options['background_color'],
      '#description' => $this->t('Choose a background color. This color will be applied to each carousel item.'),
    // Allow for empty value.
      '#empty_value' => '',
      '#states' => [
        'disabled' => [
          ':input[name="style_options[disable_background]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    // Add the background color opacity field.
    $form['background_color_opacity'] = [
      '#type' => 'range',
      '#title' => $this->t('Background Color Opacity'),
      '#default_value' => $this->options['background_color_opacity'],
      '#min' => 0,
      '#max' => 1,
      '#step' => 0.1,
      '#description' => $this->t('Set the opacity level for the background color.'),
      '#suffix' => '<span id="background-opacity-value">' . $this->options['background_color_opacity'] . '</span>',
      '#attributes' => [
        'oninput' => 'document.getElementById("background-opacity-value").innerText = this.value;',
      ],
      '#states' => [
        'disabled' => [
          ':input[name="style_options[disable_background]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    // Add the disable background checkbox.
    $form['disable_background'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Disable Background Color'),
      '#default_value' => $this->options['disable_background'],
      '#description' => $this->t('Check this to disable background color completely.'),
    ];
  }

  /**
   * Generates a unique numeric ID for the view display.
   *
   * @return int
   *   An 8-digit unique numeric ID.
   *
   * @throws \Random\RandomException
   */
  protected function generateUniqueId(): int {
    return random_int(10000000, 99999999);
  }

  /**
   * Renders the view with the 3D carousel style.
   *
   * @return array
   *   A render array for the 3D carousel.
   */
  public function render(): array {
    $rows = [];
    foreach ($this->view->result as $row) {
      $rows[] = $this->view->rowPlugin->render($row);
    }

    $libraries = [
      'vvjc/vvjc',
      'vvjc/vvjc__' . $this->options['available_breakpoints'],
    ];

    return [
      '#theme' => $this->themeFunctions(),
      '#view' => $this->view,
      '#options' => $this->options,
      '#rows' => $rows,
      '#unique_id' => $this->options['unique_id'],
      '#attached' => [
        'library' => $libraries,
      ],
    ];
  }

}
