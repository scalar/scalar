import { QueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockToast = vi.fn()

vi.mock('@scalar/use-toasts', () => ({
  useToasts: () => ({ toast: mockToast }),
}))

describe('query-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports a QueryClient instance', async () => {
    const { queryClient } = await import('./query-client')
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('calls toast with the error message when meta.errorMessage is set', async () => {
    const { queryClient } = await import('./query-client')
    const onError = queryClient.getQueryCache().config.onError

    onError?.(new Error('test error'), {
      meta: { errorMessage: 'Something went wrong' },
    } as any)

    expect(mockToast).toHaveBeenCalledOnce()
    expect(mockToast).toHaveBeenCalledWith('Something went wrong', 'error')
  })

  it('does not call toast when meta.errorMessage is not set', async () => {
    const { queryClient } = await import('./query-client')
    const onError = queryClient.getQueryCache().config.onError

    onError?.(new Error('test error'), {
      meta: {},
    } as any)

    expect(mockToast).not.toHaveBeenCalled()
  })

  it('does not call toast when meta is undefined', async () => {
    const { queryClient } = await import('./query-client')
    const onError = queryClient.getQueryCache().config.onError

    onError?.(new Error('test error'), {
      meta: undefined,
    } as any)

    expect(mockToast).not.toHaveBeenCalled()
  })
})
