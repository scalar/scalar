import type { ExternalType } from './more-testing-types'

/**
 * Load user by id
 * Route level docs for GET.
 *
 * @summary Get user details
 * @description Returns API description from tags
 */
export async function GET(_request: Request, { params }: { params: { id: string; version: number; mode: ExternalType } }) {
  if (params.id === 'blocked') {
    return Response.json({ error: 'forbidden' } as const, { status: 403 as const })
  }

  return Response.json(
    {
      userId: params.id,
      version: params.version,
      mode: params.mode,
    },
    { status: 200 as const },
  )
}

/**
 * Create user
 *
 * This endpoint creates records.
 */
export const POST = async () => {
  if (Math.random() > 0.5) {
    return Response.json({ created: true } as const, { status: 201 as const })
  }

  return Response.json({ created: false } as const, { status: 400 as const })
}

export const PUT = async function () {
  return Response.json({ updated: true } as const, { status: 204 as const })
}

export const PATCH = async () => {
  return Response.json('patched', { status: 202 as const })
}

export function DELETE() {
  return Response.json('deleted')
}

export function TRACE() {
  return Response.json('trace is unsupported')
}

export const helper = () => Response.json({ notAMethod: true } as const)
