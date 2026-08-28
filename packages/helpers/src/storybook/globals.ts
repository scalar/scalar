import { type DarkLightMode, applyColorMode, getSystemColorMode } from '../theme/color-mode'
import { type ThemeVariantId, applyThemeVariant, defaultThemeVariant, themeVariants } from './themes'

/**
 * The color mode stories render under unless the toolbar asks for another one.
 *
 * This follows the operating system, so Storybook opens in whichever mode the rest of the machine
 * is already in. It is resolved once when the preview loads rather than watched, since the toolbar
 * is there to override it either way.
 *
 * Snapshot tests never see this. They set the mode classes themselves for every screenshot they
 * take, light ones included, so the baselines do not depend on the preference of whatever machine
 * is running them.
 */
export const defaultColorMode: DarkLightMode = getSystemColorMode()

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
