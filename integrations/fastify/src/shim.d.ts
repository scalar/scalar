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
