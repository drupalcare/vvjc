# Security policy

Views Vanilla JavaScript 3D Carousel follows the Drupal Security Team's process for handling security issues.

## Reporting a vulnerability

**Do not** report security issues in the public issue queue. Report them privately through the Drupal Security Team:

- <https://www.drupal.org/security-team/report-issue>

Include the module version, the Drupal core version and clear steps to reproduce. See also:

- <https://www.drupal.org/security-team>
- <https://www.drupal.org/drupal-security-team/security-advisory-process-and-permissions-policy>

## Supported versions

Security coverage applies to the latest stable release once the project opts into Security Advisory coverage on
drupal.org. Development, alpha and beta releases are not covered by security advisories.

## Where this module handles untrusted input

- **Custom SVG icons** pasted into the view's format settings are sanitized by `vvj_core.svg_sanitizer` when the form
  is saved and again when the view is rendered.
- **Token text** in Views headers and footers (`[vvjc:field]`) is resolved by `vvj_core.token_resolver` from the
  view's own first row.

The module defines no permissions of its own.
