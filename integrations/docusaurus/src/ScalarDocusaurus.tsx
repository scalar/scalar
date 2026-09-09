import type { CreateApiReference } from '@scalar/types'
import Layout from '@theme/Layout'
import React, { useEffect, useId, useRef } from 'react'

import './theme.css'

type Props = {
  route: {
    /**
     * The API reference configuration, pre-serialized in the plugin (Node) to a JavaScript object
     * literal string. We cannot receive it as a plain object because Docusaurus JSON-serializes route
     * props, which drops function-valued options like `onBeforeRequest`. See issue #6933.
     */
    configuration: string
    /** Not sure where the route type is for docusaurus, couldn't find one with an ID, TODO: replace with that */
    id: string
  }
}

// Register the createApiReference function in the global Scalar object (new)
declare global {
  interface Window {
    Scalar: {
      createApiReference: CreateApiReference
    }
  }
}

export const ScalarDocusaurus = ({ route }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!window.Scalar || !ref.current) {
      return
    }

    // Inject the init call as a real <script> so the browser parses the serialized configuration —
    // including any functions — as live JavaScript. Passing it as a prop is not an option, because
    // functions do not survive Docusaurus' JSON serialization of route props (see #6933).
    const script = document.createElement('script')
    script.textContent = `window.Scalar.createApiReference(document.getElementById(${JSON.stringify(id)}), ${route.configuration})`
    document.body.appendChild(script)

    return () => {
      script.remove()
    }
  }, [id, route.configuration])

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
