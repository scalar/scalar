import type { ApiReferenceInstance, CreateApiReference } from '@scalar/types'

declare global {
  interface Window {
    Scalar?: {
      createApiReference: CreateApiReference
    }
  }
}

const bundles = new Map<string, Promise<CreateApiReference>>()

/** Share downloads across route mounts, retaining each CDN bundle's factory. */
const loadBundle = (url: string): Promise<CreateApiReference> => {
  const existing = bundles.get(url)
  if (existing) {
    return existing
  }

  const promise = new Promise<CreateApiReference>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.onload = () => {
      script.remove()
      if (window.Scalar?.createApiReference) {
        resolve(window.Scalar.createApiReference)
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
  let reference: ApiReferenceInstance | undefined

  void loadBundle(cdn)
    .then((createReference) => {
      if (disposed) {
        // The download can finish after navigation. Balance the standalone style retain/release
        // without running the abandoned route's configuration or callbacks.
        createReference(document.createElement('div'), {}).destroy()
        return
      }

      // A real script preserves serialized callbacks without requiring unsafe-eval under CSP.
      // Keep the instance on the script so React can own its teardown without a global registry.
      const script = document.createElement('script') as InitializationScript
      script.createReference = createReference
      script.container = container
      script.textContent = `document.currentScript.reference = document.currentScript.createReference(document.currentScript.container, ${configuration})`
      document.body.appendChild(script)
      reference = script.reference
      script.remove()
    })
    .catch((error: unknown) => {
      if (!disposed) {
        console.error(error)
      }
    })

  return () => {
    disposed = true
    reference?.destroy()
    reference = undefined
  }
}
