import { type ModalState, useModal } from '@scalar/components/modal'
import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import { type ComputedRef, type InjectionKey, type MaybeRefOrGetter, computed, inject, toValue } from 'vue'

export type GenerateSdkContext = {
  /**
   * Whether the Generate SDK buttons should render at all.
   *
   * They hand the active document to Scalar, which only makes sense while the reference is being
   * developed locally ("offline mode"). Deployed references never show them, and neither does a
   * document that is still loading, is not an OpenAPI document, or already documents its own SDKs.
   */
  enabled: ComputedRef<boolean>
  /** State of the Explore Scalar dialog the buttons open; ApiReference renders that dialog once */
  dialog: ModalState
  /** Open the Explore Scalar dialog */
  open: () => void
}

type UseGenerateSdkOptions = {
  /**
   * Whether an OpenAPI document has loaded. Until it has, there is nothing to generate from and no
   * way to tell whether it already lists SDKs, so the buttons stay hidden.
   */
  hasDocument: MaybeRefOrGetter<boolean>
  /** Whether the active document already lists SDK installation instructions. Hides every button. */
  hasSdk: MaybeRefOrGetter<boolean>
  /** Override the local-only check (e.g. for tests or docs config) */
  enabled?: ComputedRef<boolean>
}

export const GENERATE_SDK_CONTEXT_SYMBOL: InjectionKey<GenerateSdkContext> = Symbol()

/**
 * Create the Generate SDK context.
 *
 * Call once from the API Reference root and provide it under `GENERATE_SDK_CONTEXT_SYMBOL`.
 * Every button opens the same Explore Scalar dialog, which takes care of uploading the document
 * and signing up, so the page only ever holds one copy of it.
 */
export const useGenerateSdk = (options: UseGenerateSdkOptions): GenerateSdkContext => {
  const isLocal = options.enabled ?? computed(() => typeof window !== 'undefined' && isLocalUrl(window.location.href))

  // Offering to generate an SDK only makes sense for a loaded document that does not ship one yet
  const enabled = computed(() => isLocal.value && toValue(options.hasDocument) && !toValue(options.hasSdk))

  const dialog = useModal()

  return { enabled, dialog, open: () => dialog.show() }
}

/**
 * Inject the Generate SDK context provided by ApiReference.
 *
 * Returns undefined outside a reference root, so buttons rendered on their own (e.g. in Storybook,
 * tests or a standalone block) never show up and never borrow another reference's state.
 */
export const useGenerateSdkContext = (): ComputedRef<GenerateSdkContext | undefined> => {
  const injected = inject(GENERATE_SDK_CONTEXT_SYMBOL, undefined)
  return computed((): GenerateSdkContext | undefined => injected)
}
