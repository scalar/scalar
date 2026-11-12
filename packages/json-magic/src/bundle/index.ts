export { resolveReferencePath } from '@/helpers/resolve-reference-path'

export type {
  Config as BundleConfig,
  DocumentLoadContext,
  LifecyclePlugin,
  LoaderPlugin,
  Plugin,
  ResolveResult,
  TargetProcessContext,
  TargetTransformation,
} from './bundle'
export {
  bundle,
  extensions,
  isLocalRef,
  prefixInternalRef,
  prefixInternalRefRecursive,
  resolveAndCopyReferences,
} from './bundle'
export type { BundleResult, ReferenceDiagnostic } from './bundle-with-diagnostics'
export { bundleWithDiagnostics } from './bundle-with-diagnostics'
export type { DocumentIdentity, DocumentResolver } from './document-references'
