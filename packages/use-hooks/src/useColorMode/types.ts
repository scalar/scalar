/** Possible color modes */
export type ColorMode = 'light' | 'dark' | 'system'

/** Options for the useColorMode hook */
export type UseColorModeOptions = {
  /**
   * The key to use for the local storage item.
   * @default 'colorMode'
   */
  localstorageKey?: string
}
