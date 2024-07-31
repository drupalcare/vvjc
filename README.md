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

1. Download and enable the **Views 3D Carousel** module.
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

## Important Note on Pagination

**Pagination does not work for the 3D Carousel display style.** To ensure the 
best performance and user experience, it is recommended to set a fixed number 
of items to display. The ideal number is up to 30 items. Exceeding this number 
may affect the carousel's performance and load times.

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
