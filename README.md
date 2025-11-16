# Views Vanilla Javascript 3D Carousel

## Description

The **Views Vanilla Javascript 3D Carousel** module allows you to create 
dynamic and visually appealing 3D carousels for displaying various content 
items on your Drupal site. This module integrates seamlessly with the Views 
module, providing a new display style that you can choose when creating or 
editing views.

## Features

- Renders content items in a 3D carousel format.
- Customizable options for:
  - Time interval between slides.
  - Max width.
  - Screen height for different screen sizes.
  - Perspective.
- Breakpoints to ensure responsive design.
- Play/pause button with automatic scrolling options.

## Requirements

- Drupal 10
- Views module

## Installation

1. Download and enable the **Views Vanilla JavaScript 3D Carousel** module.
2. Clear the cache: `drush cr` or via the Drupal admin interface.

## Usage

1. Create or edit a view in the Views module.
2. In the **Format** section, select **3D Carousel** from the available display 
   styles.
3. Configure the various options available under the **Format Settings** to 
   customize the carousel according to your needs.
4. Set the number of items to display in the **Pager** settings, keeping in 
   mind that pagination does not work with this display style. It is 
   recommended to limit the number of items to a maximum of 30 for optimal 
   performance.

## Configuration Options

- **Max Width:** Choose the maximum width for the carousel (e.g., 300px, 400px, 
  500px, etc.).
- **Time in Seconds:** Set the time interval for each slide (e.g., 3 seconds, 5 
  seconds, etc.).
- **Large Screen Height:** Define the carousel's height for large screens 
  (e.g., 300px, 400px, etc.).
- **Small Screen Height:** Define the carousel's height for small screens 
  (e.g., 200px, 250px, etc.).
- **Perspective:** The perspective is set with the max width for the best 
  display/view, but if you want to override it, you can enter the number here 
  in pixels.
- **Available Breakpoints:** Choose the breakpoints to ensure the carousel is 
  responsive (e.g., 576px, 768px, 992px, etc.).


## Token Support in Views Text Areas

In Views headers, footers, or empty text areas—when using *Global: Text area* or
*Global: Unfiltered text*—there is an option called **"Use replacement tokens
from the first row."**

The default Twig-style tokens (e.g., `{{ title }}` or `{{ field_image }}`)
**will not work** with the VVJC style. Instead, use the custom tokens provided
by VVJC:

**Examples:**

- `{{ title }}` → `[vvjc:title]`  
- `{{ field_image }}` → `[vvjc:field_image]`

To strip any HTML from the output, you can append `:plain` to the token:

- `[vvjc:title:plain]`

These tokens pull data from the **first row** of the View result and are
designed to work seamlessly with the VVJC rendering system.

## Deep Linking

Enable deep linking to create shareable URLs that link directly to specific 
slides in your 3D carousel.

### Setup

1. Navigate to your view's **Format Settings**
2. Expand the **Deep Linking Settings** section
3. Check **Enable Deep Linking**
4. Enter a **URL Identifier** (e.g., "products", "gallery", "team")
   - The identifier will be automatically cleaned: converted to lowercase, 
     spaces replaced with hyphens, special characters removed
   - Must start with a letter and contain only lowercase letters, numbers, and 
     hyphens
5. Ensure **Show Dots Navigation** is enabled in the Controls & Navigation 
   section (required for deep linking)

### URL Format

When deep linking is enabled, URLs are generated in the following format:

```
#carousel3d-identifier-N
```

**Examples:**
- `#carousel3d-products-1` (first slide)
- `#carousel3d-gallery-5` (fifth slide)
- `#carousel3d-team-3` (third slide)

### Features

- **Shareable Links**: Users can copy the URL to share a specific slide
- **Browser Navigation**: Back/forward buttons work with slide navigation
- **Initial Load**: Page loads directly to the specified slide when URL hash is 
  present
- **Multiple Carousels**: Each carousel on a page can have its own unique 
  identifier

## JavaScript API

Control VVJC carousels programmatically from your own JavaScript code.

### Navigation Methods

```javascript
// Navigate to a specific slide (1-based index)
Drupal.vvjc.goToSlide('products', 3);

// Navigate to next slide
Drupal.vvjc.nextSlide('products');

// Navigate to previous slide
Drupal.vvjc.prevSlide('products');
```

### Information Methods

```javascript
// Get current slide number (1-based)
const current = Drupal.vvjc.getCurrentSlide('products');
// Returns: 3

// Get total number of slides
const total = Drupal.vvjc.getTotalSlides('products');
// Returns: 10
```

### Playback Control

```javascript
// Pause auto-rotation
Drupal.vvjc.pause('products');

// Resume auto-rotation
Drupal.vvjc.resume('products');

// Pause all carousels on the page
Drupal.vvjc.pauseAll();

// Resume all carousels on the page
Drupal.vvjc.resumeAll();
```

### Instance Access

```javascript
// Get carousel instance by identifier or selector
const carousel = Drupal.vvjc.getInstance('products');
// or
const carousel = Drupal.vvjc.getInstance('.vvjc-items');

// Get all active carousel instances on the page
const allCarousels = Drupal.vvjc.getAllInstances();
```

### Complete Example: Custom Thumbnail Navigation

```html
<!-- Custom thumbnail navigation -->
<div class="custom-thumbs">
  <button onclick="Drupal.vvjc.goToSlide('products', 1)">
    <img src="thumb1.jpg" alt="Product 1">
  </button>
  <button onclick="Drupal.vvjc.goToSlide('products', 2)">
    <img src="thumb2.jpg" alt="Product 2">
  </button>
  <button onclick="Drupal.vvjc.goToSlide('products', 3)">
    <img src="thumb3.jpg" alt="Product 3">
  </button>
</div>

<script>
(function(Drupal) {
  'use strict';
  
  Drupal.behaviors.customCarouselControls = {
    attach: function(context, settings) {
      // Custom external controls
      const carousel = Drupal.vvjc.getInstance('products');
      
      if (carousel) {
        console.log('Total slides:', Drupal.vvjc.getTotalSlides('products'));
        
        // Pause on custom button click
        document.querySelector('.custom-pause').addEventListener('click', function() {
          Drupal.vvjc.pause('products');
        });
        
        // Go to random slide
        document.querySelector('.random-slide').addEventListener('click', function() {
          const total = Drupal.vvjc.getTotalSlides('products');
          const random = Math.floor(Math.random() * total) + 1;
          Drupal.vvjc.goToSlide('products', random);
        });
      }
    }
  };
})(Drupal);
</script>
```

### Using with Deep Link Identifiers

The API methods accept either:
- **Deep link identifier**: `'products'`, `'gallery'`, `'team'`
- **CSS selector**: `'.vvjc-items'`, `'#vvjc-items-12345678'`

When using deep link identifiers, make sure the identifier matches what you 
configured in the View's Format Settings.

### Return Values

- Navigation methods (`goToSlide`, `nextSlide`, `prevSlide`, `pause`, `resume`) 
  return `true` on success, `false` on failure
- Information methods (`getCurrentSlide`, `getTotalSlides`) return the requested 
  value or `null` if carousel not found
- All methods provide helpful console warnings for debugging when errors occur

## Important Note on Pagination

To ensure the best performance and user experience, it is recommended to set a 
 fixed number of items to display. The ideal number is up to 30 items.
  Exceeding this number may affect the carousel's performance and load times.

## Troubleshooting

If you encounter any issues or have suggestions for improvements, please open 
an issue in the module's issue queue on Drupal.org.

## Maintainers

- [Alaa Haddad](https://www.drupal.org/u/flashwebcenter)

## License

This project is licensed under the 
[GNU General Public License, version 2 or later](http://www.gnu.org/licenses/gpl-2.0.html).

---

This file follows the Drupal best practices for module documentation, ensuring 
that users have a clear understanding of the module's purpose, features, and 
usage. It also includes important notes on pagination to guide users in setting 
up the module correctly.
