import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

import { useGenerateSdk } from './use-generate-sdk'

/** A loaded OpenAPI document without SDKs, which is when the buttons are offered */
const ready = { hasDocument: true, hasSdk: false }

describe('use-generate-sdk', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('open', () => {
    it('opens the shared Explore Scalar dialog', () => {
      const { dialog, open } = useGenerateSdk(ready)

      expect(dialog.open).toBe(false)

      open()

      expect(dialog.open).toBe(true)
    })
  })

  describe('enabled', () => {
    it('is only enabled on local URLs by default', () => {
      vi.stubGlobal('location', { href: 'https://docs.example.com/reference' })
      expect(useGenerateSdk(ready).enabled.value).toBe(false)

      vi.stubGlobal('location', { href: 'http://localhost:5173/' })
      expect(useGenerateSdk(ready).enabled.value).toBe(true)
    })

    it('respects an explicit override', () => {
      vi.stubGlobal('location', { href: 'http://localhost:5173/' })
      const { enabled } = useGenerateSdk({ ...ready, enabled: computed(() => false) })

      expect(enabled.value).toBe(false)
    })

    it('is disabled while the document already lists SDKs', () => {
      vi.stubGlobal('location', { href: 'http://localhost:5173/' })
      const hasSdk = ref(true)
      const { enabled } = useGenerateSdk({ hasDocument: true, hasSdk })

      expect(enabled.value).toBe(false)

      hasSdk.value = false
      expect(enabled.value).toBe(true)
    })

    it('stays disabled until an OpenAPI document has loaded', () => {
      // Before the document arrives there is no way to tell whether it lists SDKs
      vi.stubGlobal('location', { href: 'http://localhost:5173/' })
      const hasDocument = ref(false)
      const { enabled } = useGenerateSdk({ hasDocument, hasSdk: false })

      expect(enabled.value).toBe(false)

      hasDocument.value = true
      expect(enabled.value).toBe(true)
    })

    it('stays disabled on deployed references without SDKs', () => {
      vi.stubGlobal('location', { href: 'https://docs.example.com/reference' })
      const { enabled } = useGenerateSdk(ready)

      expect(enabled.value).toBe(false)
    })
  })
})
