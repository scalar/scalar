import type { ApiReferenceInstance, CreateApiReference } from '@scalar/types/api-reference'

declare global {
  interface Window {
    Scalar?: {
      createApiReference: CreateApiReference
      releaseUnusedStyles?: () => void
    }
  }
}

type Bundle = NonNullable<Window['Scalar']>

const bundles = new Map<string, Promise<Bundle>>()

/** Share downloads across route mounts, retaining each CDN bundle's factory. */
const loadBundle = (url: string): Promise<Bundle> => {
  const existing = bundles.get(url)
  if (existing) {
    return existing
  }

  const promise = new Promise<Bundle>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.onload = () => {
      script.remove()
      if (window.Scalar?.createApiReference) {
        resolve(window.Scalar)
      } else {
        reject(new Error(`Scalar did not initialize from ${url}`))
      }
    }
    script.onerror = () => {
      script.remove()
      reject(new Error(`Unable to load Scalar from ${url}`))
    }
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    // A subsequent visit can retry a failed download.
    bundles.delete(url)
    throw error
  })
  bundles.set(url, promise)
  return promise
}

type InitializationScript = HTMLScriptElement & {
  createReference: CreateApiReference
  container: HTMLElement
  reference?: ApiReferenceInstance
}

/** Mount only for this route and release its instance when React cleans up the effect. */
export const mountReference = (container: HTMLElement, configuration: string, cdn: string): (() => void) => {
  let disposed = false
  let destroy: (() => void) | undefined

  void loadBundle(cdn)
    .then(({ createApiReference: createReference, releaseUnusedStyles }) => {
      if (disposed) {
        releaseUnusedStyles?.()
        return
      }

      // A real script preserves serialized callbacks without requiring unsafe-eval under CSP.
      // Keep the instance on the script so React can own its teardown without a global registry.
      const script = document.createElement('script') as InitializationScript
      script.createReference = createReference
      script.container = container
      script.textContent = `document.currentScript.reference = document.currentScript.createReference(document.currentScript.container, ${configuration})`
      document.body.appendChild(script)
      const reference = script.reference
      script.remove()
      destroy = () => {
        reference?.destroy()
        releaseUnusedStyles?.()
      }
    })
    .catch((error: unknown) => {
      if (!disposed) {
        console.error(error)
      }
    })

  return () => {
    disposed = true
    destroy?.()
    destroy = undefined
  }
}
