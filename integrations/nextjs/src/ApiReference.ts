import { renderApiReference } from '@scalar/client-side-rendering'

import { customTheme } from './custom-theme'
import type { ApiReferenceConfiguration, ApiReferenceConfigurationFactory, ApiReferenceOptions } from './types'

/** Render a fresh response so headers and request-specific configuration are never shared. */
const renderResponse = (configuration: Partial<ApiReferenceConfiguration>, options: ApiReferenceOptions): Response => {
  const { cdn, pageTitle, nonce, ...config } = { _integration: 'nextjs' as const, ...configuration }
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'text/html; charset=utf-8')

  return new Response(renderApiReference({ config, pageTitle, cdn, nonce }, customTheme), { headers })
}

/** Serve a standalone reference using static configuration. */
export function ApiReference(
  configuration: Partial<ApiReferenceConfiguration>,
  options?: ApiReferenceOptions,
): () => Response
/** Resolve configuration for each request. Rejections propagate to Next.js error handling. */
export function ApiReference(
  configuration: ApiReferenceConfigurationFactory,
  options?: ApiReferenceOptions,
): (request: Request) => Promise<Response>
export function ApiReference(
  configuration: Partial<ApiReferenceConfiguration> | ApiReferenceConfigurationFactory,
  options: ApiReferenceOptions = {},
): (() => Response) | ((request: Request) => Promise<Response>) {
  if (typeof configuration === 'function') {
    return async (request: Request): Promise<Response> => renderResponse(await configuration(request), options)
  }

  const staticConfiguration = { ...configuration }
  return (): Response => renderResponse(staticConfiguration, options)
}
