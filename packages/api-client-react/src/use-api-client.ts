'use client'

import type { RoutePayload } from '@scalar/api-client/v2/features/modal'
import { useEffect, useRef, useState } from 'react'

import type { AddDocumentInput, ApiClient, ReactApiClientConfiguration } from './create-api-client'
import { getOrCreateApiClient } from './create-api-client'
import './style.css'

globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

export type UseApiClientModalOptions = {
  /** Configuration for the Api Client (url or inline content) */
  configuration?: ReactApiClientConfiguration & AddDocumentInput
  /** Choose a request to initially route to */
  initialRequest?: RoutePayload
}

/**
 * Returns the singleton Api Client controller.
 *
 * On first call the Vue app is lazily created and appended to document.body where it
 * lives for the lifetime of the page — it is never unmounted, so it survives client-side
 * navigation without losing state.
 *
 * Subsequent calls from any component share the same instance.
 */
export const useApiClient = ({ configuration, initialRequest }: UseApiClientModalOptions = {}): ApiClient | null => {
  const [controller, setController] = useState<ApiClient | null>(null)
  const initialRequestRef = useRef(initialRequest)
  const configurationRef = useRef(configuration)

  // Keep refs current without re-running the effect
  initialRequestRef.current = initialRequest
  configurationRef.current = configuration

  useEffect(() => {
    let cancelled = false

    void getOrCreateApiClient(configurationRef.current ?? {}).then((ctrl) => {
      if (cancelled) {
        return
      }

      setController(ctrl)

      const cfg = configurationRef.current
      if (cfg?.content || cfg?.url) {
        ctrl.addDocument(cfg)
      }

      if (initialRequestRef.current) {
        ctrl.route(initialRequestRef.current)
      }
    })

    return () => {
      cancelled = true
    }

    // Only run once per mount — configuration/initialRequest changes are handled via refs
  }, [])

  return controller
}
