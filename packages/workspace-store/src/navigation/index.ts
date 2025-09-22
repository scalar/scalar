// biome-ignore lint/performance/noBarrelFile: Entry point for /navigation
export { DEFAULT_INTRODUCTION_SLUG } from './helpers/traverse-description'
export { traverseDocument as createNavigation } from './helpers/traverse-document'
export type { TraverseSpecOptions as createNavigationOptions } from './types'
