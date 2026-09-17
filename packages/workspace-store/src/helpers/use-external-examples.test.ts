import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

import { createExternalExampleResolver } from './external-examples'
import { useExternalExamples } from './use-external-examples'

describe('use-external-examples', () => {
  it('does not fetch hidden selections and ignores a previous selection finishing late', async () => {
    const releases = new Map<string, (response: Response) => void>()
    const fetch = vi.fn(
      (input: string | URL | Request) => new Promise<Response>((resolve) => releases.set(String(input), resolve)),
    )
    const resolver = createExternalExampleResolver({ fetch })
    const visible = ref(false)
    const selected = ref({ externalValue: 'https://example.com/first' })
    const scope = effectScope()
    const examples = scope.run(() =>
      useExternalExamples(
        () => [selected.value],
        () => visible.value,
        () => resolver,
      ),
    )!
    expect(fetch.mock.calls.length).toBe(0)
    selected.value = { externalValue: 'https://example.com/second' }
    await nextTick()
    expect(fetch.mock.calls.length).toBe(0)
    visible.value = true
    await nextTick()
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(['https://example.com/second'])
    selected.value = { externalValue: 'https://example.com/third' }
    await nextTick()
    releases.get('https://example.com/third')?.(Response.json({ selected: 3 }))
    await vi.waitFor(() => expect(examples.pending.value).toBe(false))
    releases.get('https://example.com/second')?.(Response.json({ selected: 2 }))
    await vi.waitFor(() => expect(resolver({ externalValue: 'https://example.com/second' }).status).toBe('loaded'))
    expect(examples.resolve(selected.value)?.value).toEqual({ selected: 3 })
    scope.stop()
  })

  it('keeps user edits when an older download finishes', async () => {
    let release: ((response: Response) => void) | undefined
    const pending = new Promise<Response>((resolve) => {
      release = resolve
    })
    const resolver = createExternalExampleResolver({ fetch: () => pending })
    const selected = ref<{ externalValue: string; value?: unknown }>({ externalValue: 'https://example.com/example' })
    const scope = effectScope()
    const examples = scope.run(() =>
      useExternalExamples(
        () => [selected.value],
        () => true,
        () => resolver,
      ),
    )!
    selected.value.value = { edited: true }
    release?.(Response.json({ downloaded: true }))
    await vi.waitFor(() => expect(resolver({ externalValue: selected.value.externalValue }).status).toBe('loaded'))
    expect(examples.resolve(selected.value)?.value).toEqual({ edited: true })
    expect(examples.pending.value).toBe(false)
    scope.stop()
  })
})
