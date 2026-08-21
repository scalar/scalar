/**
 * A single named phase reported by the server via the `Server-Timing` header.
 */
export type RequestTimingPhase = {
  /** The metric name, for example `dns`, `connect`, `tls`, or `ttfb`. */
  name: string
  /** The phase duration in milliseconds. */
  duration: number
  /** An optional human-readable description sent by the server. */
  description?: string
}

/**
 * Structured request timing parsed from a `Server-Timing` header.
 *
 * The Scalar proxy measures the network phases (DNS, connect, TLS, time to
 * first byte) between the proxy and the target server, because browsers do not
 * expose these for cross-origin requests. It reports them here so the client
 * can draw a request timing waterfall.
 */
export type RequestTiming = {
  /** The named phases, in the order the server reported them. */
  phases: RequestTimingPhase[]
  /**
   * Whether an existing connection was reused. When true, the DNS, connect,
   * and TLS phases legitimately did not happen and are absent.
   */
  reused: boolean
}

/**
 * Parse a `Server-Timing` header value into structured timing phases.
 *
 * The header follows the format `name;dur=123.4;desc="text", name2;dur=5.6`.
 * Bare tokens without a `dur` (such as the proxy's `reused` marker) are treated
 * as flags rather than measured phases.
 *
 * @param header - The raw `Server-Timing` header value, or null when absent.
 * @returns Structured timing, or null when there is nothing usable to show.
 */
export const parseServerTiming = (header: string | null | undefined): RequestTiming | null => {
  if (!header) {
    return null
  }

  const phases: RequestTimingPhase[] = []
  let reused = false

  // Each metric is comma-separated; its parameters are semicolon-separated.
  for (const entry of header.split(',')) {
    const parts = entry.split(';')
    const name = parts[0]?.trim()

    if (!name) {
      continue
    }

    // The `reused` marker is a bare flag with no duration.
    if (name === 'reused') {
      reused = true
      continue
    }

    let duration: number | undefined
    let description: string | undefined

    for (const param of parts.slice(1)) {
      const separatorIndex = param.indexOf('=')

      if (separatorIndex === -1) {
        continue
      }

      const key = param.slice(0, separatorIndex).trim()
      // Strip surrounding quotes that descriptions may carry.
      const value = param
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^"|"$/g, '')

      if (key === 'dur') {
        const parsed = Number.parseFloat(value)

        if (Number.isFinite(parsed)) {
          duration = parsed
        }
      } else if (key === 'desc') {
        description = value
      }
    }

    // Only keep entries that carry a measured duration.
    if (duration !== undefined) {
      phases.push({ name, duration, ...(description ? { description } : {}) })
    }
  }

  if (phases.length === 0 && !reused) {
    return null
  }

  return { phases, reused }
}
