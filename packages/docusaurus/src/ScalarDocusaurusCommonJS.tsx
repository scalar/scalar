// Workaround to handle commonjs failing with older react version
import BrowserOnly from '@docusaurus/BrowserOnly'
import type { ReferenceProps } from '@scalar/api-reference-react'
import Layout from '@theme/Layout'
import React, { Component } from 'react'

import './theme.css'

type Props = {
  route: ReferenceProps
}

class ScalarDocusaurusCommonJS extends Component<Props> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  observer: any = null

  constructor(props: Props) {
    super(props)
    this.mutationCallback = this.mutationCallback.bind(this)
    if (typeof window !== 'undefined') {
      this.observer = new MutationObserver(this.mutationCallback)
    }
  }

  componentWillUnmount() {
    // Clean up app
    document.dispatchEvent(new Event('scalar:destroy-references'))
    this.observer?.disconnect()
  }

  mutationCallback(mutations: MutationRecord[]) {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const container = document.getElementById('api-reference-container')

        if (
          container &&
          this.props.route.configuration &&
          !document.getElementById('api-reference')
        ) {
          console.log(`Loading Scalar script...`)
          // Deep copy the configuration
          const config = JSON.parse(
            JSON.stringify(this.props.route.configuration),
          )

          // Create and append a script element to mount the Scalar app
          const apiReferenceScript = document.createElement('script')
          apiReferenceScript.id = 'api-reference'
          apiReferenceScript.type = 'application/json'

          container.appendChild(apiReferenceScript)

          // Check if we've already loaded the Scalar script
          const loaded = document.body.getAttribute('data-scalar-loaded')

          if (loaded) {
            console.log(`Scalar script already loaded, reloading app `)
            document.dispatchEvent(new Event('scalar:reload-references'))
            document.dispatchEvent(
              new CustomEvent('scalar:update-references-config', {
                detail: { configuration: config },
              }),
            )
          } else {
            // Execute content function if it exists
            if (typeof config.spec?.content === 'function') {
              config.spec.content = config.spec.content()
            }

            // Convert the document to a string
            const documentString = config?.spec?.content
              ? typeof config?.spec?.content === 'string'
                ? config.spec.content
                : JSON.stringify(config.spec.content)
              : ''

            // Delete content from configuration
            if (config?.spec?.content) {
              delete config.spec.content
            }

            // Convert the configuration to a string
            const configString = JSON.stringify(config ?? {})
              .split('"')
              .join('&quot;')
            apiReferenceScript.dataset.configuration = configString
            apiReferenceScript.innerHTML = documentString

            // Creating and appending the script element
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'
            script.async = true
            script.onload = () => {
              console.log('Scalar script loaded successfully')
              document.body.setAttribute('data-scalar-loaded', 'true')
            }
            script.onerror = (error) => {
              console.error('Error loading Scalar script:', error)
            }
            container.appendChild(script)
          }

          // Stop observing once the container is found and script is added
          this.observer?.disconnect()
        }
      }
    })
  }

  setupAPIReference = () => {
    if (typeof window !== 'undefined') {
      this.observer = new MutationObserver(this.mutationCallback)
      this.observer.observe(document.body, { childList: true, subtree: true })
    }
  }

  render() {
    return (
      <Layout>
        <BrowserOnly>
          {() => {
            if (typeof window !== 'undefined') {
              this.setupAPIReference()
            }
            return <div id="api-reference-container"></div>
          }}
        </BrowserOnly>
      </Layout>
    )
  }
}

export default ScalarDocusaurusCommonJS
