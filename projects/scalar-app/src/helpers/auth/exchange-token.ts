import type { ErrorResponse } from '@scalar/helpers/errors/normalize-error'
import { coerce, validate } from '@scalar/validation'

import { env } from '@/environment'

import { type TokenResponse, tokenResponseSchema } from './schema'

/** Exchange a short lived exchange token for access and refresh tokens */
export const exchangeToken = async (token: string): Promise<ErrorResponse<TokenResponse>> => {
  try {
    const response = await fetch(`${env.VITE_SERVICES_URL}/core/login/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ exchangeToken: token }),
    })

    if (!response.ok) {
      throw new Error('Could not exchange token')
    }

    const json = await response.json()

    if (!validate(tokenResponseSchema, json)) {
      throw new Error('Invalid token response')
    }

    const data = coerce(tokenResponseSchema, json)

    return [null, data]
  } catch (err) {
    console.error('[exchangeToken]:', err)
    return [err instanceof Error ? err : new Error('Could not exchange token'), null]
  }
}
