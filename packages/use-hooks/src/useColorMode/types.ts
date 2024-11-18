/** Possible color modes */
export type ColorMode = 'light' | 'dark' | 'system'

/** Specific dark/light mode */
export type DarkLightMode = 'light' | 'dark'

/** Options for the useColorMode hook */
export type UseColorModeOptions = {
  /** The initial color mode to use */
  initialColorMode?: ColorMode
  /** Override the color mode */
  overrideColorMode?: ColorMode
}
