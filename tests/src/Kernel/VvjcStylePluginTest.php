<?php

declare(strict_types=1);

namespace Drupal\Tests\vvjc\Kernel;

use Drupal\Core\Render\RendererInterface;
use Drupal\KernelTests\KernelTestBase;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\views\Views;
use Drupal\vvjc\Plugin\views\style\Carousel3D;
use Drupal\vvjc\VvjcConstants;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Verifies the views_vvjc style plugin loads and provides expected defaults.
 */
#[Group('vvjc')]
#[RunTestsInSeparateProcesses]
final class VvjcStylePluginTest extends KernelTestBase {

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
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('user');
    $this->installEntitySchema('node');
    $this->installSchema('node', ['node_access']);
    $this->installConfig(['filter', 'node']);
    NodeType::create([
      'type' => 'article',
      'name' => 'Article',
      'display_submitted' => FALSE,
    ])->save();
    $this->installConfig(['vvjc']);
  }

  /**
   * The style plugin is registered with the expected class and theme.
   */
  public function testStylePluginIsRegistered(): void {
    /** @var \Drupal\views\Plugin\ViewsPluginManager $manager */
    $manager = $this->container->get('plugin.manager.views.style');
    $definition = $manager->getDefinition('views_vvjc');
    $this->assertIsArray($definition);

    $this->assertSame(Carousel3D::class, $definition['class']);
    $this->assertSame('views_view_vvjc', $definition['theme']);
  }

  /**
   * The example view loads and initializes the style plugin.
   */
  public function testExampleViewLoadsWithStyle(): void {
    $view = Views::getView('vvjc_example');
    $this->assertNotNull($view, 'vvjc_example view ships as optional config.');

    $view->setDisplay('default');
    $view->initStyle();

    $this->assertInstanceOf(Carousel3D::class, $view->style_plugin);
    $this->assertSame('views_vvjc', $view->style_plugin->getPluginId());
  }

  /**
   * The style plugin defines the expected option defaults.
   */
  public function testStyleDefinesExpectedOptionDefaults(): void {
    $view = Views::getView('vvjc_example');
    $this->assertNotNull($view);
    $view->setDisplay('default');
    $view->initStyle();

    $options = $view->style_plugin->options;

    $this->assertArrayHasKey('perspective', $options);
    $this->assertArrayHasKey('time_in_seconds', $options);
    $this->assertArrayHasKey('max_width', $options);
    $this->assertArrayHasKey('unique_id', $options);
    $this->assertArrayHasKey('enable_deeplink', $options);
    $this->assertArrayHasKey('deeplink_identifier', $options);
  }

  /**
   * Rendering produces cache metadata and attaches the pattern library.
   */
  public function testRenderProducesCacheableOutput(): void {
    $view = Views::getView('vvjc_example');
    $this->assertNotNull($view);
    $view->setDisplay('default');
    $view->execute();

    $build = $view->style_plugin->render();
    $this->assertIsArray($build);

    $this->assertArrayHasKey('#cache', $build);
    $cache = $build['#cache'];
    $this->assertIsArray($cache);
    $this->assertArrayHasKey('tags', $cache);
    $this->assertArrayHasKey('contexts', $cache);
    $this->assertArrayHasKey('max-age', $cache);

    $this->assertArrayHasKey('#attached', $build);
    $attached = $build['#attached'];
    $this->assertIsArray($attached);
    $this->assertArrayHasKey('library', $attached);
    $library = $attached['library'];
    $this->assertIsArray($library);
    $this->assertContains('vvjc/vvjc', $library);
  }

  /**
   * A view saved before the option existed renders as the ring.
   */
  public function testCarouselStyleDefaultsToRing(): void {
    $view = Views::getView('vvjc_example');
    $this->assertNotNull($view);
    $view->setDisplay('default');
    $view->initStyle();

    $this->assertSame(VvjcConstants::STYLE_RING, $view->style_plugin->options['carousel_style']);
  }

  /**
   * Only a coverflow attaches the coverflow stylesheet.
   */
  public function testCoverflowLibraryAttachesOnlyForCoverflow(): void {
    foreach ([VvjcConstants::STYLE_RING => FALSE, VvjcConstants::STYLE_COVERFLOW => TRUE] as $style => $expected) {
      $view = Views::getView('vvjc_example');
      $this->assertNotNull($view);
      $view->setDisplay('default');
      $view->initStyle();
      $view->style_plugin->options['carousel_style'] = $style;
      $view->execute();

      $build = $view->style_plugin->render();
      $this->assertIsArray($build);
      $attached = $build['#attached'] ?? [];
      $this->assertIsArray($attached);
      $libraries = $attached['library'] ?? [];
      $this->assertIsArray($libraries);
      // CONTROL: the base library is always there, so an empty list cannot
      // pass the ring case by accident.
      $this->assertContains('vvjc/vvjc', $libraries, $style);
      $this->assertSame($expected, in_array('vvjc/vvjc-coverflow', $libraries, TRUE), $style);
    }
  }

  /**
   * A forged or stale style value is never stored.
   *
   * The select only offers ring and coverflow, but a POST can carry anything,
   * and the template and script know only those two.
   */
  public function testFlattenRejectsUnknownStyle(): void {
    $view = Views::getView('vvjc_example');
    $this->assertNotNull($view);
    $view->setDisplay('default');
    $view->initStyle();
    $flatten = new \ReflectionMethod($view->style_plugin, 'flattenFormValues');

    foreach (['evil' => VvjcConstants::STYLE_RING, VvjcConstants::STYLE_COVERFLOW => VvjcConstants::STYLE_COVERFLOW] as $submitted => $expected) {
      $flattened = $flatten->invoke($view->style_plugin, ['dimensions_section' => ['carousel_style' => $submitted]]);
      $this->assertIsArray($flattened);
      $this->assertSame($expected, $flattened['carousel_style'] ?? NULL, $submitted);
    }
  }

  /**
   * The coverflow markers appear on a coverflow and never on a ring.
   */
  public function testCoverflowMarkersAppearOnlyOnCoverflow(): void {
    // Teaser rows print the node date, which needs system's date formats.
    $this->installConfig(['system']);
    Node::create(['type' => 'article', 'title' => 'One', 'status' => 1])->save();
    Node::create(['type' => 'article', 'title' => 'Two', 'status' => 1])->save();

    foreach ([VvjcConstants::STYLE_RING => FALSE, VvjcConstants::STYLE_COVERFLOW => TRUE] as $style => $expected) {
      $view = Views::getView('vvjc_example');
      $this->assertNotNull($view);
      $view->setDisplay('default');
      $view->initStyle();
      $view->style_plugin->options['carousel_style'] = $style;
      $build = $view->preview();
      $this->assertIsArray($build);
      $renderer = $this->container->get('renderer');
      $this->assertInstanceOf(RendererInterface::class, $renderer);
      $html = (string) $renderer->renderInIsolation($build);

      // CONTROL: the carousel rendered at all, or both checks pass on nothing.
      $this->assertStringContainsString('<vvjc-carousel', $html, $style);
      $this->assertSame($expected, str_contains($html, 'data-vvjc-style="coverflow"'), $style);
      $this->assertSame($expected, str_contains($html, 'vvjc--coverflow'), $style);
    }
  }

}
