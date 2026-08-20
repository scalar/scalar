import { useLoadingState } from '@scalar/components/loading'
import { isValidUrl } from '@scalar/helpers/url/is-valid-url'
import type { ExternalUrls } from '@scalar/types/api-reference'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type Ref, nextTick } from 'vue'

import { useLocalization } from '@/features/localization'
import { uploadTempDocument } from '@/helpers/upload-temp-document'

/** The MCP configuration slice the install links are built from. */
export type McpLinkConfiguration = {
  name?: string
  url?: string
}

/**
 * Base64-encode a UTF-8 string. `btoa` operates on Latin1 and throws on any
 * multibyte character (for example a Unicode MCP server name), so encode the
 * string to UTF-8 bytes first. The MCP config is small, so spreading the byte
 * array into `fromCharCode` is safe.
 */
const base64Utf8 = (value: string): string => btoa(String.fromCharCode(...new TextEncoder().encode(value)))

type UseMcpActionsOptions = {
  config?: McpLinkConfiguration
  externalUrls: ExternalUrls
  workspace: WorkspaceStore
  /** Caches the uploaded temp document URL across register link generations. */
  docUrl: Ref<string | undefined>
}

type UseMcpActionsReturn = {
  /** Whether an MCP server is already configured for this reference. */
  hasConfig: boolean
  /** Deep link installing the configured MCP server in Cursor. */
  cursorLink: string
  /** Deep link installing the configured MCP server in VS Code. */
  vscodeLink: string
  /** Copies the configured MCP server URL to the clipboard. */
  copyMcpUrl: () => void
  /** Uploads the active document and opens the dashboard MCP registration flow. */
  generateRegisterLink: () => Promise<void>
}

/**
 * Shared MCP actions for the reference: install deep links for the configured
 * server, and the register flow that creates one when none is configured yet.
 * Used by the sidebar's OpenMCPButton and the agent panel's MCP menu.
 */
export const useMcpActions = (options: UseMcpActionsOptions): UseMcpActionsReturn => {
  const { copyToClipboard } = useClipboard()
  const { translate } = useLocalization()
  const { toast } = useToasts()

  const loader = useLoadingState()

  const hasConfig = Boolean(options.config?.name || options.config?.url)

  const encoded = base64Utf8(JSON.stringify(options.config ?? {}))

  const name = encodeURIComponent(options.config?.name ?? '')
  const cursorLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=${name}&config=${encoded}`
  const vscodeLink = `vscode:mcp/install?${encodeURIComponent(JSON.stringify(options.config ?? {}))}`

  const copyMcpUrl = (): void => {
    copyToClipboard(options.config?.url ?? '')
  }

  /** Generate and open the registration link */
  const generateRegisterLink = async (): Promise<void> => {
    if (loader.isLoading || !options.workspace) {
      return
    }

    // If we have already have a document URL that is valid
    if (options.docUrl.value && isValidUrl(options.docUrl.value)) {
      openRegisterLink(options.docUrl.value)
      return
    }

    loader.start()

    const document = options.workspace.exportActiveDocument('json')

    if (!document) {
      toast(translate('developerTools.unableToExportDocument'), 'error')
      await loader.invalidate()
      return
    }

    try {
      options.docUrl.value = await uploadTempDocument(document, options.externalUrls)
      await loader.validate()
      openRegisterLink(options.docUrl.value)

      await nextTick()

      await loader.clear()
    } catch (error) {
      const message = error instanceof Error ? error.message : translate('developerTools.unknownError')
      toast(message, 'error')
      await loader.invalidate()
    }
  }

  /** Open the registration link in a new tab */
  const openRegisterLink = (documentUrl: string): void => {
    try {
      const url = new URL(`${options.externalUrls.dashboardUrl}/register`)
      url.searchParams.set('url', documentUrl)
      url.searchParams.set('createMcp', 'true')

      // `noopener,noreferrer`: the opened dashboard tab must not reach back
      // into this window through `window.opener`.
      window.open(url.toString(), '_blank', 'noopener,noreferrer')
    } catch {
      // A missing or malformed `dashboardUrl` makes `new URL` throw — surface
      // it instead of leaving the click silently dead.
      toast(translate('developerTools.unknownError'), 'error')
    }
  }

  return {
    hasConfig,
    cursorLink,
    vscodeLink,
    copyMcpUrl,
    generateRegisterLink,
  }
}
