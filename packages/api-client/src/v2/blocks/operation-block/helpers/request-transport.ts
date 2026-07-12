import { buildSafeBodyRequest } from '@scalar/helpers/http/can-method-have-body'
import type {
  ClientPlugin,
  ClientTransportContext,
  HttpTransport,
  TransportDocumentType,
} from '@scalar/oas-utils/helpers'
import { normalizeTransportProtocol, resolveHttpTransport } from '@scalar/oas-utils/helpers'
import { type RequestFactory, resolveExecutableRequestUrl } from '@scalar/workspace-store/request-example'

import type { CustomFetch } from './send-request'

/**
 * Resolves the protocol of the target server for transport selection.
 *
 * Uses the fully resolved request URL (environment substitution applied, no proxy
 * rewriting) so server URL templates like `{protocol}://{host}` resolve correctly.
 * Relative URLs resolve against the current origin in the browser. Returns `undefined`
 * when no absolute URL can be derived, in which case no transport is selected.
 */
export const resolveTargetProtocol = (
  requestBuilder: RequestFactory,
  envVariables: Record<string, string>,
): string | undefined => {
  try {
    const url = resolveExecutableRequestUrl(requestBuilder, envVariables)
    return normalizeTransportProtocol(new URL(url, globalThis.location?.href).protocol)
  } catch {
    return undefined
  }
}

/**
 * Adapts a plugin transport to the `CustomFetch` signature used by `sendRequest`.
 *
 * The electron code path spreads the raw request payload (`url`, `init`) instead of
 * passing a `Request`, so the adapter rebuilds one with `buildSafeBodyRequest` to keep
 * the transport contract uniform.
 */
export const createTransportFetch =
  (transport: HttpTransport, context: ClientTransportContext): CustomFetch =>
  async (input, init) =>
    transport.send(input instanceof Request ? input : buildSafeBodyRequest(String(input), init ?? {}), context)

/**
 * Resolves a plugin-registered transport for the request being executed.
 *
 * Returns a `CustomFetch` wrapping the first plugin transport that matches the document
 * type and target protocol, or `undefined` when the built-in engine should be used.
 * When a transport matches, the caller is expected to disable the CORS proxy: the proxy
 * exists to work around browser fetch limitations that a custom client does not have,
 * and routing a custom transport through it would hand it the proxy URL instead of the
 * real target.
 */
export const resolveRequestTransportFetch = ({
  requestBuilder,
  envVariables,
  documentType,
  plugins,
}: {
  requestBuilder: RequestFactory
  envVariables: Record<string, string>
  documentType: TransportDocumentType
  plugins: ClientPlugin[]
}): CustomFetch | undefined => {
  const protocol = resolveTargetProtocol(requestBuilder, envVariables)

  if (!protocol) {
    return undefined
  }

  const transport = resolveHttpTransport({ documentType, protocol, plugins })

  if (!transport) {
    return undefined
  }

  return createTransportFetch(transport, { documentType, protocol })
}
