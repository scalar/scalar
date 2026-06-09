// Side-effect CSS imports (used by the playground). tsc picks these up from
// `vite/client`, but tsgo does not auto-include it here, so declare the module
// explicitly.
declare module '*.css' {}
