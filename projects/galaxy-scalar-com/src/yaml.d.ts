/**
 * Raw `.yaml` files are imported as strings via wrangler's "Text" module rule
 * (configured in wrangler.jsonc). This ambient declaration lets `tsc` resolve
 * those imports.
 */
declare module '*.yaml' {
  const content: string
  export default content
}
