import { createMagicProxy, getRaw } from '@scalar/json-magic/magic-proxy'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

import { getAsyncApiSecuritySchemes } from './get-asyncapi-security-schemes'

/** Serve a separate document for each mock origin without mutating the loaded API description. */
export const getAsyncApiDocument = (document: AsyncApiDocument, url: string): AsyncApiDocument => {
  const origin = new URL(url)
  const copy = createMagicProxy(structuredClone(getRaw(document))) as AsyncApiDocument
  for (const rawServer of Object.values(copy.servers ?? {})) {
    const server = getResolvedRef(rawServer)
    if (!server) continue
    const protocol = server.protocol.toLowerCase()
    if (!['ws', 'wss', 'http', 'https', 'sse'].includes(protocol)) continue
    server.host = origin.host
    server.protocol =
      protocol === 'ws' || protocol === 'wss'
        ? origin.protocol === 'https:'
          ? 'wss'
          : 'ws'
        : protocol === 'sse'
          ? 'sse'
          : origin.protocol.slice(0, -1)
  }
  const rebase = (value: string): string => {
    const endpoint = new URL(value, origin)
    return new URL(`${endpoint.pathname}${endpoint.search}${endpoint.hash}`, origin).href
  }
  for (const scheme of getAsyncApiSecuritySchemes(copy)) {
    if (scheme?.type === 'openIdConnect' && scheme.openIdConnectUrl)
      scheme.openIdConnectUrl = rebase(scheme.openIdConnectUrl)
    if (scheme?.type !== 'oauth2') continue
    for (const rawFlow of Object.values(getResolvedRef(scheme.flows) ?? {})) {
      const flow = getResolvedRef(rawFlow)
      if (!flow) continue
      if (flow.authorizationUrl) flow.authorizationUrl = rebase(flow.authorizationUrl)
      if (flow.tokenUrl) flow.tokenUrl = rebase(flow.tokenUrl)
      if (flow.refreshUrl) flow.refreshUrl = rebase(flow.refreshUrl)
    }
  }
  return getRaw(copy)
}
