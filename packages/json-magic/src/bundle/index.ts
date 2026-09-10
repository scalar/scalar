export { resolveReferencePath } from '@/helpers/resolve-reference-path'

export type { LifecyclePlugin, LoaderPlugin, Plugin, ResolveResult } from './bundle'
export {
  bundle,
  extensions,
  isLocalRef,
  prefixInternalRef,
  prefixInternalRefRecursive,
  resolveAndCopyReferences,
} from './bundle'
