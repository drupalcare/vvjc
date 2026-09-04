<?php

declare(strict_types=1);

namespace Drupal\Tests\vvjc\Functional;

use Drupal\Tests\BrowserTestBase;
use Drupal\node\Entity\NodeType;
use Drupal\user\Entity\User;
use Drupal\views\Views;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Confirms vvjc installs, ships its example view, and appears in Views UI.
 */
#[Group('vvjc')]
#[RunTestsInSeparateProcesses]
final class VvjcInstallTest extends BrowserTestBase {

  /**
   * {@inheritdoc}
   *
   * @var list<string>
   */
  protected static $modules = [
    // `help` serves /admin/help/{name}; without it testHelpPageRenders can
    // only ever 404, whatever this module does.
    'help',
    'node',
    'views',
    'views_ui',
    'vvjc',
  ];

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * {@inheritdoc}
   *
   * WHY THIS FIXTURE EXISTS. The example view lists `node.type.article` among
   * its config dependencies, and optional config is installed only once its
   * dependencies already exist. On Drupal 12 nothing supplies that type in a
   * test: `node.type.article` left the standard profile for a recipe, and the
   * testing profile never had it. The view therefore never installed and both
   * install tests failed on a module that is itself correct.
   *
   * Measured on d12a.local 2026-09-04. `core.entity_view_mode.node.teaser`,
   * the view's other config dependency, does ship with the node module and
   * needs nothing here.
   */
  protected function setUp(): void {
    parent::setUp();

    NodeType::create(['type' => 'article', 'name' => 'Article'])->save();
    $this->container->get('config.installer')->installOptionalConfig();
  }

  /**
   * The module installs and ships its example view as optional config.
   */
  public function testModuleInstallsAndShipsExampleView(): void {
    $this->assertTrue(
      $this->container->get('module_handler')->moduleExists('vvjc'),
    );
    $view = Views::getView('vvjc_example');
    $this->assertNotNull($view, 'Example view installs as optional config.');
  }

  /**
   * The style is reachable through the Views UI edit form.
   */
  public function testStyleAppearsInViewsUi(): void {
    $admin = $this->drupalCreateUser([
      'administer views',
      'access administration pages',
    ]);
    $this->assertInstanceOf(User::class, $admin);
    $this->drupalLogin($admin);

    $this->drupalGet('admin/structure/views/view/vvjc_example/edit');
    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->pageTextContains('VVJC Example');
  }

  /**
   * The module help page renders with the expected summary text.
   */
  public function testHelpPageRenders(): void {
    $admin = $this->drupalCreateUser([
      'access administration pages',
      // The route requires `access help pages`, not merely
      // `access administration pages` — checked against core's
      // help.routing.yml rather than assumed.
      'access help pages',
    ]);
    $this->assertInstanceOf(User::class, $admin);
    $this->drupalLogin($admin);

    $this->drupalGet('admin/help/vvjc');
    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->responseContains('Views Vanilla JavaScript 3D Carousel');
  }

}
