import plugin from 'tailwindcss/plugin'

/**
 * Platform Variants
 */
export const platformVariants = ['mac', 'windows', 'linux'] as const

/**
 * Add support for `desktop` and platform modifiers
 *
 * @example <div class="desktop:rounded-lg">...</div>
 * @example <div class="mac:hidden">...</div>
 *
 * Modified from `@todesktop/tailwind-variants`
 * @see https://github.com/todesktop/tailwind-variants
 */
export const desktopVariants = plugin(function ({ addVariant }) {
  // Add support for `desktop` modifier
  // Usage: <div class="desktop:rounded-lg">...</div>
  addVariant('desktop', () => '.app-platform-desktop &')

  // Add support for `mac`, `windows` and `linux` modifiers
  // Usage: <div class="mac:hidden">...</div>
  platformVariants.forEach((variant) => addVariant(variant, `.app-platform-${variant} &`))
})
