/**
 * Declare ?raw imports as string modules.
 * This allows importing files as raw text strings.
 */
declare module '*?raw' {
  const content: string
  export default content
}
