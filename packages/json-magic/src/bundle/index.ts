export { decodeUriFragment } from '@/helpers/decode-uri-fragment'
export { parseJsonPointer } from '@/helpers/parse-json-pointer'
export { resolveReferencePath } from '@/helpers/resolve-reference-path'

export type { Config as BundleConfig, LifecyclePlugin, LoaderPlugin, Plugin, ResolveResult } from './bundle'
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
export { childReferenceContext, isReferenceContext } from './reference-context'
