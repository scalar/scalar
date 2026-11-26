import { type InjectionKey, hasInjectionContext, inject } from 'vue'

/**
 * The DOM root a Scalar instance renders into: the document, or a shadow root when it is
 * embedded in a web component
 *
 * Provide it wherever a Scalar app is mounted into a shadow root. A separately mounted app
 * (like the API client modal) does not inherit provides, so it has to provide it again,
 * for example from `mountingElement.getRootNode()`.
 */
export const DOCUMENT_ROOT_SYMBOL: InjectionKey<Document | ShadowRoot> = Symbol('scalar-document-root')

/**
 * Gets the DOM root this component renders into
 *
 * Use it for document-level lookups (`getElementById`, `querySelector`, `activeElement`) and
 * for overlay targets, so they also work inside a shadow root. It is available during setup,
 * before the component has an element. Code that already holds an element can use
 * `el.getRootNode()` instead.
 *
 * Falls back to `document` when nothing provides a root, and returns `undefined` during SSR.
 *
 * We do not fall back to Vue's `useShadowRoot()`. It only finds the shadow root in the
 * custom element's own root component, which is where the root is provided anyway, and it
 * logs a warning everywhere else.
 */
export const useDocumentRoot = (): Document | ShadowRoot | undefined => {
  const fallback = typeof document === 'undefined' ? undefined : document

  return hasInjectionContext() ? inject(DOCUMENT_ROOT_SYMBOL, fallback) : fallback
}
