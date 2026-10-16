import { type InjectionKey, hasInjectionContext, inject } from 'vue'

/** DOM tree containing this Scalar instance, shared with separately mounted client apps. */
export const DOCUMENT_ROOT_SYMBOL: InjectionKey<Document | ShadowRoot> = Symbol('scalar-document-root')

/** Resolve DOM queries and overlays within the embedding root, including during SSR. */
export const useDocumentRoot = (): Document | ShadowRoot | undefined => {
  const fallback = typeof document === 'undefined' ? undefined : document
  return hasInjectionContext() ? inject(DOCUMENT_ROOT_SYMBOL, fallback) : fallback
}
