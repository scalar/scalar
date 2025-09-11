import type { z } from 'zod'

import { type Events, type analyticsEventData, analyticsEventEnum, analyticsEvents } from '@/events'

export const analyticsFactory = (
  /**
   * Base URL for the API. For Scalar services all services live
   * at a root path of the baseUrl
   *
   * ex. https://services.scalar.com/core/<endpointName>
   *     or
   *     http://localhost:9999/core/<endpointName>
   */
  baseUrl: string,
  /**
   * Getter function to retrieve the active auth token
   * This will be run on each request
   */
  getAuthToken: () => string | null,
) => {
  async function capture<E extends Events>(
    event: E,
    ...[data]: z.input<(typeof analyticsEventData)[E]> extends undefined
      ? []
      : [z.input<(typeof analyticsEventData)[E]>]
  ) {
    if (import.meta.env.DEV) {
      return
    }

    if (!analyticsEvents.includes(event)) {
      throw new Error('[Analytics]: Invalid event submission')
    }

    const authToken = getAuthToken()

    await fetch(`${baseUrl}/analytics/send`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(authToken ? { 'authorization': `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        event,
        data,
      }),
    })
  }

  return {
    capture,
  }
}

export { analyticsEventEnum }
