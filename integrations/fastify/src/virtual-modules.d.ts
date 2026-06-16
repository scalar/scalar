/**
 * Virtual module that resolves to the contents of the `@scalar/api-reference`
 * standalone build. It is provided by a small plugin in `vite.config.ts` and
 * inlined into the output at build time.
 */
declare module 'virtual:scalar-standalone-js' {
  const content: string
  export default content
}
