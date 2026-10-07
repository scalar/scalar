import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import { isValidUrl } from '@scalar/helpers/url/is-valid-url'
import type { ExternalUrls } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
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

import { uploadTempDocument } from '@/helpers/upload-temp-document'

/** Outcome of a Generate SDK attempt, so the UI can pick a localized message */
export type GenerateSdkResult =
  | { ok: true }
  | { ok: false; reason: 'export-failed' }
  | { ok: false; reason: 'upload-failed'; message?: string }

export type GenerateSdkContext = {
  /**
   * Whether the Generate SDK buttons should render at all.
   *
   * The flow uploads the active document to Scalar and opens the dashboard, which only makes
   * sense while the reference is being developed locally ("offline mode"). Deployed references
   * never show it.
   */
  enabled: ComputedRef<boolean>
  /** True while the active document is being uploaded */
  isGenerating: Ref<boolean>
  /** Upload the active document when needed and open the SDK registration page in a new tab */
  generate: () => Promise<GenerateSdkResult>
}

type UseGenerateSdkOptions = {
  workspace: WorkspaceStore
  externalUrls: MaybeRefOrGetter<ExternalUrls>
  /** Public URL of the active document, when it already has one. Skips the upload. */
  documentUrl?: MaybeRefOrGetter<string | undefined>
  /** Override the local-only check (e.g. for tests or docs config) */
  enabled?: ComputedRef<boolean>
}

export const GENERATE_SDK_CONTEXT_SYMBOL: InjectionKey<GenerateSdkContext> = Symbol()

/**
 * Module-level fallback so buttons rendered across async component boundaries can still resolve
 * the context when `inject` comes back empty. Set when ApiReference calls useGenerateSdk().
 */
const contextRef: Ref<GenerateSdkContext | null> = ref(null)

/** Build the dashboard registration link that kicks off SDK generation for a document */
export const buildGenerateSdkUrl = (dashboardUrl: string, documentUrl: string): string => {
  const url = new URL(`${dashboardUrl}/register`)
  url.searchParams.set('url', documentUrl)
  url.searchParams.set('createSDK', 'true')

  return url.toString()
}

/**
 * Create the Generate SDK context.
 *
 * Call once from the API Reference root and provide it under `GENERATE_SDK_CONTEXT_SYMBOL`.
 * Every button shares the same temporary document URL, so clicking a second button after the
 * first one uploaded the document opens the dashboard right away instead of uploading again.
 */
export const useGenerateSdk = (options: UseGenerateSdkOptions): GenerateSdkContext => {
  const isGenerating = ref(false)

  /** Temporary URL returned by the upload, reused across buttons */
  const tempDocumentUrl = ref<string>()

  const enabled = options.enabled ?? computed(() => typeof window !== 'undefined' && isLocalUrl(window.location.href))

  const openLink = (documentUrl: string) => {
    const { dashboardUrl } = toValue(options.externalUrls)
    window.open(buildGenerateSdkUrl(dashboardUrl, documentUrl), '_blank')
  }

  const generate = async (): Promise<GenerateSdkResult> => {
    if (isGenerating.value) {
      return { ok: true }
    }

    // A document that is already reachable online does not need to be uploaded
    const documentUrl = toValue(options.documentUrl)
    if (documentUrl && isValidUrl(documentUrl)) {
      openLink(documentUrl)
      return { ok: true }
    }

    if (tempDocumentUrl.value) {
      openLink(tempDocumentUrl.value)
      return { ok: true }
    }

    const document = options.workspace.exportActiveDocument('json')

    if (!document) {
      return { ok: false, reason: 'export-failed' }
    }

    isGenerating.value = true

    try {
      tempDocumentUrl.value = await uploadTempDocument(document, toValue(options.externalUrls))
      openLink(tempDocumentUrl.value)
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        reason: 'upload-failed',
        message: error instanceof Error ? error.message : undefined,
      }
    } finally {
      isGenerating.value = false
    }
  }

  const context: GenerateSdkContext = { enabled, isGenerating, generate }
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
