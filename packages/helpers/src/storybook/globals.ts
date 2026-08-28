import { type DarkLightMode, applyColorMode } from '../theme/color-mode'
import { type ThemeVariantId, applyThemeVariant, defaultThemeVariant, themeVariants } from './themes'

/** The color mode stories render under unless the toolbar asks for another one. */
export const defaultColorMode: DarkLightMode = 'light'

/**
 * The toolbar controls every Scalar Storybook shares.
 *
 * These are plain object literals rather than Storybook's `GlobalTypes`, so this package does not
 * have to depend on Storybook for a type. Each preview assigns them into its own `Preview` object,
 * which is where they get type checked.
 */
export const scalarGlobalTypes = {
  theme: {
    description: 'Scalar theme',
    toolbar: {
      title: 'Theme',
      icon: 'paintbrush',
      items: Object.entries(themeVariants).map(([value, { label }]) => ({ value, title: label })),
      dynamicTitle: true,
    },
  },
  colorMode: {
    description: 'Color mode',
    toolbar: {
      title: 'Color mode',
      icon: 'contrast',
      items: [
        { value: 'light', title: 'Light', icon: 'sun' },
        { value: 'dark', title: 'Dark', icon: 'moon' },
      ],
      dynamicTitle: true,
    },
  },
}

/**
 * The starting value for each global.
 *
 * Storybook drops any global that is not declared here, so this is also what lets a visual test
 * pick a theme or a color mode with `?globals=theme:laserwave;colorMode:dark` on the story URL.
 */
export const scalarInitialGlobals = {
  theme: defaultThemeVariant,
  colorMode: defaultColorMode,
}

/**
 * Applies the Scalar globals to the document.
 *
 * Call this from a decorator so it re-runs whenever the toolbar changes, rather than once when the
 * preview loads.
 */
export const applyScalarGlobals = (globals: Record<string, unknown>): void => {
  applyThemeVariant(globals.theme as ThemeVariantId)
  applyColorMode(globals.colorMode === 'dark' ? 'dark' : 'light')
}
