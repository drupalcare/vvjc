<?php

namespace Drupal\vvjc\Plugin\views\style;

use Drupal\Core\Form\FormStateInterface;
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
   */
  protected function defineOptions() {
    $options = parent::defineOptions();
    $options['max_width'] = ['default' => '500'];
    $options['time_in_seconds'] = ['default' => 5000];
    $options['large_screen_height'] = ['default' => 300];
    $options['small_screen_height'] = ['default' => 200];
    $options['available_breakpoints'] = ['default' => 'vvjc__992'];
    $options['perspective'] = ['default' => ''];
    $options['unique_id'] = ['default' => $this->generateUniqueId()];
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
  public function buildOptionsForm(&$form, FormStateInterface $form_state) {
    parent::buildOptionsForm($form, $form_state);

    // Add a warning message at the top of the settings form.
    $form['warning_message'] = [
      '#type' => 'markup',
      '#markup' => '<div class="messages messages--warning">' . $this->t('Note: Pagination does not work for this display style. It is recommended to limit the number of items to 30 for optimal performance.') . '</div>',
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

    $form['available_breakpoints'] = [
      '#type' => 'select',
      '#title' => $this->t('Available Breakpoints'),
      '#options' => [
        'vvjc__576' => $this->t('576px / 36rem'),
        'vvjc__768' => $this->t('768px / 48rem'),
        'vvjc__992' => $this->t('992px / 62rem'),
        'vvjc__1200' => $this->t('1200px / 75rem'),
        'vvjc__1400' => $this->t('1400px / 87.5rem'),
      ],
      '#default_value' => $this->options['available_breakpoints'],
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

    $form['perspective'] = [
      '#type' => 'number',
      '#title' => $this->t('Perspective'),
      '#default_value' => $this->options['perspective'],
      '#min' => 0,
      '#description' => $this->t('The details of perspective may change based on the quantity of items in the 3D carousel. By default, this setting adjusts with each width selection. You can modify this value in pixels if the carousel circle appears too broad.'),
      '#required' => FALSE,
    ];
  }

  /**
   * Generates a unique numeric ID for the view display.
   *
   * @return int
   *   An 8-digit unique numeric ID.
   */
  protected function generateUniqueId() {
    return random_int(10000000, 99999999);
  }

  /**
   * Renders the view with the 3D carousel style.
   *
   * @return array
   *   A render array for the 3D carousel.
   */
  public function render() {
    $rows = [];
    foreach ($this->view->result as $row) {
      $rows[] = $this->view->rowPlugin->render($row);
    }

    return [
      '#theme' => $this->themeFunctions(),
      '#view' => $this->view,
      '#options' => $this->options,
      '#rows' => $rows,
      '#unique_id' => $this->options['unique_id'],
      '#attached' => [
        'library' => [
          'vvjc/vvjc',
        ],
      ],
    ];
  }

}
