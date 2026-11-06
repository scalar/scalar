import type { RouteConfig } from '@docusaurus/types'
import type { ApiReferenceInstance, CreateApiReference } from '@scalar/types'
import Layout from '@theme/Layout'
import React, { useEffect, useId, useRef } from 'react'

import './theme.css'

type Props = {
  route: RouteConfig & {
    /**
     * The API reference configuration, pre-serialized in the plugin (Node) to a JavaScript object
     * literal string. We cannot receive it as a plain object because Docusaurus JSON-serializes route
     * props, which drops function-valued options like `onBeforeRequest`. See issue #6933.
     */
    configuration: string
    /** URL of the standalone API Reference bundle */
    cdn: string
  }
}

declare global {
  interface Window {
    Scalar?: {
      createApiReference: CreateApiReference
    }
    /** Instances created by the injected init scripts, keyed by their mount element id */
    __scalarDocusaurusInstances?: Record<string, ApiReferenceInstance>
  }
}

const standaloneScripts = new Map<string, Promise<void>>()

/**
 * Load the standalone bundle once per URL, and only when an API reference route renders.
 *
 * The bundle injects document-level styles (including a `body` background) as soon as it runs.
 * Loading it on every page would leak those styles into pages that do not render a reference.
 */
const loadStandaloneScript = (src: string): Promise<void> => {
  const existing = standaloneScripts.get(src)
  if (existing) {
    return existing
  }

  const loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => {
      standaloneScripts.delete(src)
      script.remove()
      reject(new Error(`Failed to load ${src}`))
    }
    document.head.appendChild(script)
  })

  standaloneScripts.set(src, loading)

  return loading
}

export const ScalarDocusaurus = ({ route }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    let isCancelled = false
    let script: HTMLScriptElement | undefined

    loadStandaloneScript(route.cdn)
      .then(() => {
        if (isCancelled || !ref.current) {
          return
        }

        // Inject the init call as a real <script> so the browser parses the serialized configuration —
        // including any functions — as live JavaScript. Passing it as a prop is not an option, because
        // functions do not survive Docusaurus' JSON serialization of route props (see #6933).
        const elementId = JSON.stringify(id)
        script = document.createElement('script')
        script.textContent = `(window.__scalarDocusaurusInstances ??= {})[${elementId}] = window.Scalar.createApiReference(document.getElementById(${elementId}), ${route.configuration})`
        document.body.appendChild(script)
      })
      .catch((error: unknown) => {
        console.error('[@scalar/docusaurus] Could not load the API Reference:', error)
      })

    return () => {
      isCancelled = true
      script?.remove()

      // Destroying the instance also detaches the standalone styles once no reference is mounted,
      // so they do not stay behind after client-side navigation to another page.
      const instances = window.__scalarDocusaurusInstances
      instances?.[id]?.destroy()
      delete instances?.[id]
    }
  }, [id, route.cdn, route.configuration])

  return (
    <Layout>
      <div
        id={id}
        ref={ref}
      />
    </Layout>
  )
}

export default ScalarDocusaurus
