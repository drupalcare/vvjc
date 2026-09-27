<?php

declare(strict_types=1);

namespace Drupal\Tests\vvjc\FunctionalJavascript;

use Drupal\node\Entity\Node;
use Drupal\Tests\vvj_core\FunctionalJavascript\VvjPatternJavascriptTestBase;
use Drupal\views\Entity\View;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Browser smoke tests for the vvjc example view custom element.
 */
#[Group('vvjc')]
#[Group('vvj_javascript')]
#[RunTestsInSeparateProcesses]
final class VvjcJavascriptSmokeTest extends VvjPatternJavascriptTestBase {

  /**
   * {@inheritdoc}
   *
   * @var list<string>
   */
  protected static $modules = [
    'node',
    'block',
    'views',
    'field',
    'file',
    'filter',
    'text',
    'vvj_core',
    'vvjc',
  ];

  /**
   * {@inheritdoc}
   */
  protected function vvjExampleViewId(): string {
    return 'vvjc_example';
  }

  /**
   * {@inheritdoc}
   */
  protected function vvjCustomElementTag(): string {
    return 'vvjc-carousel';
  }

  /**
   * Keyboard focus is not dropped when the ring hides its last arrow.
   *
   * The arrow at an end becomes `visibility: hidden`, which cannot keep
   * focus; before the fix a keyboard user reaching the last slide landed on
   * <body>. A real WebDriver click gives the button focus, as Enter would.
   */
  public function testRingMovesFocusOffTheHiddenArrow(): void {
    $this->setExampleStyleOptions(['time_in_seconds' => '0']);
    $this->drupalGet('<front>');
    $this->waitForCarousel();

    $next = $this->getSession()->getPage()->find('css', 'vvjc-carousel .next-arrow');
    $this->assertNotNull($next);
    // Three slides: two steps reach the end.
    $next->click();
    $next->click();

    $this->assertJsCondition("document.querySelector('vvjc-carousel').getCurrentSlide() === 3");
    $this->assertJsCondition("document.querySelector('vvjc-carousel .next-arrow').classList.contains('vvjc-hidden')");
    $this->assertJsCondition("document.activeElement === document.querySelector('vvjc-carousel .prev-arrow')");
  }

  /**
   * A one-slide ring with autoplay keeps a valid, active slide.
   *
   * Before the guard, the ring's ping-pong turned index 0 into -1 on the
   * first autoplay tick and left no slide active.
   */
  public function testOneSlideRingSurvivesAutoplay(): void {
    $this->keepOnlyOneNode();
    $this->setExampleStyleOptions(['time_in_seconds' => '2000']);
    $this->drupalGet('<front>');
    $this->waitForCarousel();

    // Let at least one autoplay tick pass.
    $this->getSession()->wait(2600);

    $this->assertJsCondition("document.querySelector('vvjc-carousel')._currentIndex === 0");
    $this->assertJsCondition("document.querySelectorAll('vvjc-carousel .vvjc-item.active').length === 1");
  }

  /**
   * A coverflow carries its markers, wraps, and never hides an arrow.
   */
  public function testCoverflowWrapsAndKeepsBothArrows(): void {
    $this->setExampleStyleOptions(['time_in_seconds' => '0', 'carousel_style' => 'coverflow']);
    $this->drupalGet('<front>');
    $this->assertSession()->elementExists('css', 'vvjc-carousel.vvjc--coverflow [data-vvjc-style="coverflow"]');
    $this->waitForCarousel();

    $prev = $this->getSession()->getPage()->find('css', 'vvjc-carousel .prev-arrow');
    $this->assertNotNull($prev);
    // From the first card, Prev wraps to the last.
    $prev->click();

    $this->assertJsCondition("document.querySelector('vvjc-carousel').getCurrentSlide() === 3");
    $this->assertJsCondition("!document.querySelector('vvjc-carousel .prev-arrow').classList.contains('vvjc-hidden')");
    $this->assertJsCondition("!document.querySelector('vvjc-carousel .next-arrow').classList.contains('vvjc-hidden')");
  }

  /**
   * A one-card coverflow hides both arrows, since neither can do anything.
   */
  public function testOneCardCoverflowHidesBothArrows(): void {
    $this->keepOnlyOneNode();
    $this->setExampleStyleOptions(['time_in_seconds' => '0', 'carousel_style' => 'coverflow']);
    $this->drupalGet('<front>');
    $this->waitForCarousel();

    $this->assertJsCondition("document.querySelector('vvjc-carousel .prev-arrow').classList.contains('vvjc-hidden')");
    $this->assertJsCondition("document.querySelector('vvjc-carousel .next-arrow').classList.contains('vvjc-hidden')");
  }

  /**
   * Waits until the carousel element has hydrated.
   */
  private function waitForCarousel(): void {
    $this->assertSession()->elementExists('css', 'vvjc-carousel');
    $this->assertJsCondition("document.querySelector('vvjc-carousel')._isHydrated === true", 10000);
  }

  /**
   * Merges style options into the example view's default display.
   *
   * @param array<string, mixed> $options
   *   Options to set.
   */
  private function setExampleStyleOptions(array $options): void {
    $view = View::load('vvjc_example');
    $this->assertNotNull($view);
    $displays = $view->get('display');
    $this->assertIsArray($displays);
    $default = $displays['default'] ?? NULL;
    $this->assertIsArray($default);
    $display_options = $default['display_options'] ?? NULL;
    $this->assertIsArray($display_options);
    $style = $display_options['style'] ?? [];
    $this->assertIsArray($style);
    $current = $style['options'] ?? [];
    $this->assertIsArray($current);

    $style['options'] = $options + $current;
    $display_options['style'] = $style;
    $default['display_options'] = $display_options;
    $displays['default'] = $default;
    $view->set('display', $displays);
    $view->save();
  }

  /**
   * Deletes all but the first article, leaving a one-slide view.
   */
  private function keepOnlyOneNode(): void {
    $nodes = Node::loadMultiple();
    array_shift($nodes);
    foreach ($nodes as $node) {
      $node->delete();
    }
  }

}
