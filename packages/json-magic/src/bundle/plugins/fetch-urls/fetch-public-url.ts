import { Agent, fetch } from 'undici'

import { type FetchBudget, createFetchBudget, readBoundedBody, withAbort } from './fetch-budget'
import { resolvePublicHost } from './is-blocked-host'

/** Fetches through a connection pinned to validated addresses while preserving the host and TLS name. */
export const fetchPublicUrl = async (
  url: string,
  headers?: HeadersInit,
  budget: FetchBudget = createFetchBudget(),
  signal: AbortSignal = budget.start(),
): Promise<Response> => {
  const target = new URL(url)
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are supported')
  }

  const resolution = resolvePublicHost(target.hostname)
  const addresses = await withAbort(resolution, signal)
  signal.throwIfAborted()
  if (!addresses) {
    throw new Error('Refused to fetch a private or internal address')
  }

  // Never resolve the hostname again when connecting. A later DNS answer could point at a private IP.
  const dispatcher = new Agent({
    connect: {
      lookup: (_hostname, options, callback) => {
        if (options.all) {
          callback(null, addresses)
        } else {
          callback(null, addresses[0].address, addresses[0].family)
        }
      },
    },
  })

  try {
    const response = await fetch(target, {
      headers: Object.fromEntries(new Headers(headers)),
      redirect: 'error',
      dispatcher,
      signal,
    })
    const body =
      !response.ok || [204, 205].includes(response.status) ? null : await readBoundedBody(response.body, budget, signal)

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
    })
  } finally {
    await dispatcher.destroy()
  }
}
