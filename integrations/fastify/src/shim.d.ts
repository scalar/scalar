/**
 * Declare CSS files as string modules.
 * This matches how esbuild's text loader handles CSS imports.
 */
declare module '*.css' {
  const content: string
  export default content
}

/**
 * Declare JavaScript files as string modules.
 * This matches how esbuild's text loader handles JavaScript imports.
 */
declare module '*.js' {
  const content: string
  export default content
}

/**
 * Declare JavaScript files with ?raw suffix as string modules.
 * This is used by vite-node during development to import JS as raw text.
 */
declare module '*.js?raw' {
  const content: string
  export default content
}
