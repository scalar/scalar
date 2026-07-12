/**
 * Client transport registry.
 *
 * Plugins can register custom transports that replace the built-in request execution
 * engine (the global `fetch` for HTTP today, channel transports for AsyncAPI protocols
 * later). A transport is selected by the type of the current document and the protocol
 * of the target server, so a plugin can, for example, take over `https` requests only
 * for AsyncAPI documents, or serve a protocol the client has no built-in support for.
 */

/** Document flavors a transport registration can be scoped to. */
export type TransportDocumentType = 'openapi' | 'asyncapi'

/** Context passed to a transport when it executes a request. */
export type ClientTransportContext = {
  /** The type of the document the request originates from. */
  documentType: TransportDocumentType
  /** Normalized protocol of the target server (lowercase, no trailing colon), e.g. `http`, `https`. */
  protocol: string
}

/**
 * A one-shot request/response transport.
 *
 * Receives the exact fetch `Request` the client built and returns a standard `Response`,
 * so the entire downstream pipeline (streaming detection, cookie handling, response body
 * decoding, plugin hooks) keeps working unchanged. Transports own their I/O: requests
 * executed through a transport are never routed through the CORS proxy.
 */
export type HttpTransport = {
  kind: 'http'
  send: (request: Request, context: ClientTransportContext) => Response | Promise<Response>
}

/**
 * A transport registration on a client plugin.
 *
 * The `kind` discriminator on the transport leaves room for future variants
 * (for example a session-based channel transport for MQTT or Kafka) without
 * changing the registration shape.
 */
export type ClientTransport = {
  /** Restrict the transport to a document flavor. Matches all document types when omitted. */
  documentType?: TransportDocumentType
  /** Protocols this transport serves. Case-insensitive, a trailing `:` is ignored. */
  protocols: string[]
  /** The transport implementation. */
  transport: HttpTransport
}

/** The subset of a client plugin the transport resolver cares about. */
type PluginWithTransports = {
  transports?: ClientTransport[]
}

/**
 * Normalizes a protocol identifier for comparison: trimmed, lowercased, and without a
 * trailing colon (so both `https` and the `https:` form produced by `URL.protocol` match).
 *
 * Returns `undefined` when the protocol is missing or blank, so callers can treat
 * "no protocol" distinctly instead of comparing against an empty string.
 */
export const normalizeTransportProtocol = (protocol: string | undefined): string | undefined => {
  const normalized = protocol?.trim().toLowerCase().replace(/:$/, '')
  return normalized ? normalized : undefined
}

/**
 * Resolves the HTTP transport to execute a request with.
 *
 * Plugins are scanned in registration order and the first transport matching both the
 * document type and the protocol wins. Returns `undefined` when no plugin claims the
 * combination, in which case the caller falls back to the built-in engine (global fetch).
 */
export const resolveHttpTransport = ({
  documentType,
  protocol,
  plugins,
}: {
  documentType: TransportDocumentType
  protocol: string
  plugins: PluginWithTransports[]
}): HttpTransport | undefined => {
  const normalizedProtocol = normalizeTransportProtocol(protocol)

  if (!normalizedProtocol) {
    return undefined
  }

  for (const plugin of plugins) {
    for (const registration of plugin.transports ?? []) {
      if (registration.documentType && registration.documentType !== documentType) {
        continue
      }

      if (registration.transport.kind !== 'http') {
        continue
      }

      if (registration.protocols.some((p) => normalizeTransportProtocol(p) === normalizedProtocol)) {
        return registration.transport
      }
    }
  }

  return undefined
}
