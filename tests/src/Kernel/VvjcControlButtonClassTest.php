<?php

declare(strict_types=1);

namespace Drupal\Tests\vvjc\Kernel;

use Drupal\Component\Utility\Html;
use Drupal\KernelTests\KernelTestBase;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\views\Views;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Every 3D carousel control carries the `control-btn` class.
 *
 * WHY THIS EXISTS. A theme that styles every `<button>` (or `.button`)
 * globally repaints the carousel's arrows, play/pause control and dots.
 * `control-btn` is the agreed opt-out hook (owner decision 2026-10-07): such a
 * theme excludes `.control-btn`, so the controls keep this module's own design.
 * Losing the class from one control reverts that control to the theme's button
 * look, and nothing else would notice.
 *
 * @license SPDX-License-Identifier: GPL-2.0-or-later
 */
#[Group('vvjc')]
#[RunTestsInSeparateProcesses]
final class VvjcControlButtonClassTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   *
   * @var list<string>
   */
  protected static $modules = [
    'system',
    'user',
    'field',
    'filter',
    'text',
    'node',
    'views',
    'vvj_core',
    'vvjc',
  ];

  /**
   * Style options that switch every control on.
   *
   * @var array<string, mixed>
   */
  private const ALL_CONTROLS = [
    'time_in_seconds' => 5000,
    'show_navigation_arrows' => TRUE,
    'show_play_pause' => TRUE,
    'show_dots_navigation' => TRUE,
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('user');
    $this->installEntitySchema('node');
    $this->installSchema('node', ['node_access']);
    // `system` supplies the date formats the node teaser's timestamp needs.
    $this->installConfig(['system', 'filter', 'node']);
    NodeType::create([
      'type' => 'article',
      'name' => 'Article',
      'display_submitted' => FALSE,
    ])->save();
    $this->installConfig(['vvjc']);
    foreach (range(1, 3) as $i) {
      Node::create([
        'type' => 'article',
        'title' => 'Control probe ' . $i,
        'status' => 1,
      ])->save();
    }
  }

  /**
   * Arrows, play/pause and button dots each carry `control-btn`.
   */
  public function testControlButtonsCarryControlBtn(): void {
    $xpath = $this->renderExample(self::ALL_CONTROLS);
    $this->assertControlsCarryControlBtn($xpath, 'button', [
      'prev-arrow',
      'next-arrow',
      'pause',
      'dots-numbers-button',
    ]);

    // Every button in this template is a control, so a new button added
    // without the class goes red here too.
    $buttons = $xpath->query('//button');
    $this->assertNotFalse($buttons);
    $this->assertGreaterThan(0, $buttons->length);
    foreach ($buttons as $button) {
      assert($button instanceof \DOMElement);
      $this->assertContains('control-btn', $this->classesOf($button), 'Button "' . $button->getAttribute('class') . '" carries control-btn.');
    }
  }

  /**
   * With deep linking on, the dots are anchors, and they carry it too.
   */
  public function testDeepLinkDotsCarryControlBtn(): void {
    $xpath = $this->renderExample(self::ALL_CONTROLS + [
      'enable_deeplink' => TRUE,
      'deeplink_identifier' => 'probe',
    ]);
    $this->assertControlsCarryControlBtn($xpath, 'a', ['dots-numbers-button']);
  }

  /**
   * Asserts each named control renders and carries `control-btn`.
   *
   * Each control is located by its own class first, so an empty match fails
   * as "not rendered" rather than passing as "nothing lacks the class".
   *
   * @param \DOMXPath $xpath
   *   The rendered document.
   * @param string $tag
   *   The element name the controls render as.
   * @param list<string> $controls
   *   Each control's own class.
   */
  private function assertControlsCarryControlBtn(\DOMXPath $xpath, string $tag, array $controls): void {
    foreach ($controls as $class) {
      $nodes = $xpath->query('//' . $tag . '[contains(concat(" ", normalize-space(@class), " "), " ' . $class . ' ")]');
      $this->assertNotFalse($nodes);
      $this->assertGreaterThan(0, $nodes->length, "The $class control rendered as <$tag>.");
      foreach ($nodes as $node) {
        assert($node instanceof \DOMElement);
        $classes = $this->classesOf($node);
        $this->assertContains('control-btn', $classes, "The $class control carries control-btn.");
        $this->assertContains($class, $classes, "The $class control keeps its own class.");
      }
    }
  }

  /**
   * Returns an element's class tokens.
   *
   * @return list<string>
   *   The tokens.
   */
  private function classesOf(\DOMElement $element): array {
    return preg_split('/\s+/', trim($element->getAttribute('class'))) ?: [];
  }

  /**
   * Renders the example view's default display with style option overrides.
   *
   * @param array<string, mixed> $overrides
   *   Style options to set before rendering.
   *
   * @return \DOMXPath
   *   The rendered HTML, parsed.
   */
  private function renderExample(array $overrides): \DOMXPath {
    $view = Views::getView('vvjc_example');
    $this->assertNotNull($view, 'The example view ships as optional config.');
    $view->setDisplay('default');
    $style = $view->display_handler->getOption('style');
    $this->assertIsArray($style);
    $options = is_array($style['options'] ?? NULL) ? $style['options'] : [];
    $style['options'] = $overrides + $options;
    $view->display_handler->setOption('style', $style);

    $build = $view->preview('default');
    $this->assertIsArray($build);
    $this->assertNotEmpty($view->result, 'The view returned rows.');
    $html = (string) $this->container->get('renderer')->renderInIsolation($build);
    return new \DOMXPath(Html::load($html));
  }

}
