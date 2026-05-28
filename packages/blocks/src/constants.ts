/** The version number taken from the package.json. Consumers can override at build time via define (e.g. OVERRIDE_PACKAGE_VERSION: JSON.stringify('1.2.3')). */
export const APP_VERSION = typeof OVERRIDE_PACKAGE_VERSION !== 'undefined' ? OVERRIDE_PACKAGE_VERSION : PACKAGE_VERSION
