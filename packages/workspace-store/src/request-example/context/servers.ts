import { combineUrlAndPath } from '@scalar/helpers/url/merge-urls'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import {
  getServerUrlBase,
  resolveServerUrlTemplate,
  withServerUrlBase,
} from '@/request-example/builder/helpers/resolve-server-url'
import type { WorkspaceDocument } from '@/schemas'
import type { XScalarSelectedServer } from '@/schemas/extensions/server/x-scalar-selected-server'
import { isOpenApiDocument } from '@/schemas/type-guards'

/** Bases available for resolving a relative server URL. */
export type ServerProcessingOptions = {
  baseServerUrl?: string
  documentUrl?: string
  /** Configured server overrides can be hosts without an explicit scheme. */
  allowSchemelessHost?: boolean
}

type ServerSelectionTarget = XScalarSelectedServer & { servers?: ServerObject[] }

type OperationServerScope =
  | { type: 'document'; target?: ServerSelectionTarget; servers?: ServerObject[] }
  | { type: 'path' | 'operation'; target: ServerSelectionTarget; servers: ServerObject[] }

/** Picks the owner of the effective server list and its selection key. */
export const getOperationServerScope = ({
  configuredServers,
  document,
  pathItem,
  operation,
}: {
  configuredServers?: ServerObject[]
  document?: ServerSelectionTarget
  pathItem?: ServerSelectionTarget
  operation?: ServerSelectionTarget | null
}): OperationServerScope => {
  if (configuredServers != null) {
    return { type: 'document', target: document, servers: configuredServers }
  }
  if (operation?.servers != null) {
    return { type: 'operation', target: operation, servers: operation.servers }
  }
  if (pathItem?.servers != null) {
    return { type: 'path', target: pathItem, servers: pathItem.servers }
  }
  return { type: 'document', target: document, servers: document?.servers }
}

/** Keeps credentials used to fetch an API description out of derived server URLs. */
const getDocumentBase = (documentUrl: string | undefined): string | undefined => {
  if (!documentUrl) {
    return undefined
  }

  try {
    const base = new URL(documentUrl)
    if (base.protocol !== 'http:' && base.protocol !== 'https:') {
      return undefined
    }
    base.username = ''
    base.password = ''
    return base.href
  } catch {
    return undefined
  }
}

/** Prepares a server for resolution while keeping its authored URL as the selection key. */
export const prepareServer = (
  server: ServerObject | null,
  { baseServerUrl, documentUrl, allowSchemelessHost }: ServerProcessingOptions = {},
): ServerObject | null => {
  if (!server) {
    return null
  }

  const documentBase = getDocumentBase(documentUrl)
  const origin = globalThis.window?.location?.origin
  const url = baseServerUrl || documentBase || (origin !== 'null' ? origin : undefined)
  if (!url) {
    return server
  }

  const fallbackSource = documentBase ? 'document' : 'browser'
  return withServerUrlBase(server, {
    url,
    source: baseServerUrl ? 'configuration' : fallbackSource,
    allowSchemelessHost,
  })
}

/** Associates server choices with their URL base without changing the stored templates. */
export const getServers = (servers: ServerObject[] | undefined, options?: ServerProcessingOptions): ServerObject[] =>
  Array.isArray(servers)
    ? servers.flatMap((server) => {
        const prepared = prepareServer(getResolvedRef(server) ?? null, options)
        return typeof prepared?.url === 'string' ? [prepared] : []
      })
    : []

/** Finds an exact authored key first, then accepts an unambiguous legacy URL. */
export const findSelectedServer = (servers: ServerObject[], selectedServerUrl?: string): ServerObject | null => {
  if (selectedServerUrl == null) {
    return servers[0] ?? null
  }
  if (selectedServerUrl === '') {
    return null
  }

  const exact = servers.find((server) => server.url === selectedServerUrl)
  if (exact) {
    return exact
  }

  const matches = servers.filter((server) => {
    const base = getServerUrlBase(server)
    if (!base || !server.url.startsWith('/')) {
      return false
    }
    // Older clients joined rooted templates against the origin and collapsed consecutive slashes.
    const legacyBase = base.source === 'document' ? new URL(base.url).origin : base.url
    return (
      resolveServerUrlTemplate(server) === selectedServerUrl ||
      combineUrlAndPath(legacyBase, server.url) === selectedServerUrl ||
      (!server.url.startsWith('//') && combineUrlAndPath('/', server.url) === selectedServerUrl)
    )
  })
  return matches.length === 1 ? (matches[0] ?? null) : null
}

/** Finds the selected server without changing the saved selection. */
export const getSelectedServer = (
  document: WorkspaceDocument | null,
  localScope: XScalarSelectedServer | null,
  configServers: ServerObject[] | null,
  servers: ServerObject[],
): ServerObject | null => {
  const documentSelection = isOpenApiDocument(document) ? document['x-scalar-selected-server'] : undefined
  const selected =
    configServers == null ? (localScope?.['x-scalar-selected-server'] ?? documentSelection) : documentSelection
  return findSelectedServer(servers, selected)
}

/** Prepares the selected server from one scope without mutating the API description. */
export const prepareServerSelection = (
  scope: ServerSelectionTarget,
  options: ServerProcessingOptions,
): ServerObject | null => findSelectedServer(getServers(scope.servers, options), scope['x-scalar-selected-server'])
