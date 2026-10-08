import { type LoadingState, useLoadingState } from '@scalar/components/loading'
import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import { isValidUrl } from '@scalar/helpers/url/is-valid-url'
import { makeUrlAbsolute } from '@scalar/helpers/url/make-url-absolute'
import type { ExternalUrls } from '@scalar/types/api-reference'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type ComputedRef, type MaybeRefOrGetter, computed, ref, toValue } from 'vue'

import { useLocalization } from '@/features/localization'
import { uploadTempDocument } from '@/helpers/upload-temp-document'

type RegisterLinkOptions = {
  externalUrls: MaybeRefOrGetter<ExternalUrls>
  url: MaybeRefOrGetter<string | undefined>
  workspace: MaybeRefOrGetter<WorkspaceStore | undefined>
}

/** Builds the dashboard register link; string concatenation keeps a path prefix on a custom dashboardUrl */
export const createRegisterUrl = (
  dashboardUrl: string,
  documentUrl: string,
  params: Record<string, string> = {},
): string => {
  const link = new URL(`${dashboardUrl.replace(/\/$/, '')}/register`)
  link.searchParams.set('url', documentUrl)
  Object.entries(params).forEach(([key, value]) => link.searchParams.set(key, value))
  return link.toString()
}

/**
 * Resolves the dashboard register link for the active document.
 *
 * A public document URL can be linked to directly. Inline documents and local URLs (which the
 * dashboard could never fetch) are uploaded as a temporary copy first, and that copy is reused
 * for every later click within the session.
 */
export const useRegisterLink = ({
  externalUrls,
  url,
  workspace,
}: RegisterLinkOptions): {
  loader: LoadingState
  /** Defined when no upload is needed, so the call to action can be a real <a> */
  href: ComputedRef<string | undefined>
  /** Resolves (uploading if needed) and opens the register page in a new tab */
  open: (params?: Record<string, string>) => Promise<void>
} => {
  const { toast } = useToasts()
  const { translate } = useLocalization()
  const loader = useLoadingState()

  /** A temporary copy survives repeated clicks within the session */
  const uploadedUrl = ref<string>()

  /** Only a public absolute URL can be fetched by the dashboard; localhost and inline documents need a temporary copy */
  const shareableUrl = computed((): string | undefined => {
    const candidate = toValue(url)
    const absolute = candidate ? makeUrlAbsolute(candidate) : undefined

    if (absolute && isValidUrl(absolute) && !isLocalUrl(absolute)) {
      return absolute
    }

    return uploadedUrl.value
  })

  const href = computed((): string | undefined =>
    shareableUrl.value ? createRegisterUrl(toValue(externalUrls).dashboardUrl, shareableUrl.value) : undefined,
  )

  const open = async (params: Record<string, string> = {}): Promise<void> => {
    if (loader.isLoading) {
      return
    }

    const dashboardUrl = toValue(externalUrls).dashboardUrl

    if (shareableUrl.value) {
      window.open(createRegisterUrl(dashboardUrl, shareableUrl.value, params), '_blank', 'noopener')
      return
    }

    const exported = toValue(workspace)?.exportActiveDocument('json')

    if (!exported) {
      toast(translate('developerTools.unableToExportDocument'), 'error')
      // The failure animation is decorative, so the caller does not wait for it
      void loader.invalidate()
      return
    }

    // Open the tab synchronously, inside the user gesture, so Safari's popup blocker does not eat it after
    // the await. 'noopener' as a feature returns null, so detach the opener by hand instead.
    const tab = window.open('about:blank', '_blank')
    if (tab) {
      tab.opener = null
    }

    loader.start()

    try {
      uploadedUrl.value = await uploadTempDocument(exported, toValue(externalUrls))
      const target = createRegisterUrl(dashboardUrl, uploadedUrl.value, params)

      if (tab) {
        tab.location.href = target
      } else {
        // The pre-open was blocked; try again now that the link is known. Chrome keeps the activation
        // alive for a few seconds, so this can still succeed. Without the 'noopener' feature the
        // return value is a real signal (with it, window.open returns null even for a tab that opened).
        const fallback = window.open(target, '_blank')

        if (fallback) {
          fallback.opener = null
        } else {
          // Blocked for good: the uploaded copy is cached, so the next click on the call to action opens it
          toast(translate('exploreScalar.popupBlocked'), 'error')
        }
      }

      // The success animation plays on its own; the tab has already been sent on its way
      void loader.validate()
    } catch (error) {
      tab?.close()
      toast(error instanceof Error ? error.message : translate('developerTools.unknownError'), 'error')
      void loader.invalidate()
    }
  }

  return { loader, href, open }
}
