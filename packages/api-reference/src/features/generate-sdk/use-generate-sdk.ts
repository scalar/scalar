import { type ModalState, useModal } from '@scalar/components/modal'
import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import {
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
  computed,
  inject,
  ref,
  toValue,
} from 'vue'

export type GenerateSdkContext = {
  /**
   * Whether the Generate SDK buttons should render at all.
   *
   * They hand the active document to Scalar, which only makes sense while the reference is being
   * developed locally ("offline mode"). Deployed references never show them, and neither does a
   * document that already documents its own SDKs.
   */
  enabled: ComputedRef<boolean>
  /** State of the Explore Scalar dialog the buttons open; ApiReference renders that dialog once */
  dialog: ModalState
  /** Open the Explore Scalar dialog */
  open: () => void
}

type UseGenerateSdkOptions = {
  /** Override the local-only check (e.g. for tests or docs config) */
  enabled?: ComputedRef<boolean>
  /** Whether the active document already lists SDK installation instructions. Hides every button. */
  hasSdk?: MaybeRefOrGetter<boolean>
}

export const GENERATE_SDK_CONTEXT_SYMBOL: InjectionKey<GenerateSdkContext> = Symbol()

/**
 * Module-level fallback so buttons rendered across async component boundaries can still resolve
 * the context when `inject` comes back empty. Set when ApiReference calls useGenerateSdk().
 */
const contextRef: Ref<GenerateSdkContext | null> = ref(null)

/**
 * Create the Generate SDK context.
 *
 * Call once from the API Reference root and provide it under `GENERATE_SDK_CONTEXT_SYMBOL`.
 * Every button opens the same Explore Scalar dialog, which takes care of uploading the document
 * and signing up, so the page only ever holds one copy of it.
 */
export const useGenerateSdk = (options: UseGenerateSdkOptions = {}): GenerateSdkContext => {
  const isLocal = options.enabled ?? computed(() => typeof window !== 'undefined' && isLocalUrl(window.location.href))

  // Offering to generate an SDK makes no sense once the document already ships one
  const enabled = computed(() => isLocal.value && !toValue(options.hasSdk))

  const dialog = useModal()

  const context: GenerateSdkContext = { enabled, dialog, open: () => dialog.show() }
  contextRef.value = context

  return context
}

/**
 * Inject the Generate SDK context provided by ApiReference.
 *
 * Returns undefined when no reference root has created it, so buttons rendered on their own
 * (e.g. in Storybook or tests) simply do not show up.
 */
export const useGenerateSdkContext = (): ComputedRef<GenerateSdkContext | undefined> => {
  const injected = inject(GENERATE_SDK_CONTEXT_SYMBOL, undefined)
  return computed((): GenerateSdkContext | undefined => injected ?? contextRef.value ?? undefined)
}
