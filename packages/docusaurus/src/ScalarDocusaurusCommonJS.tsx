// Workaround to handle commonjs failing with older react version
import type { ReferenceProps } from '@scalar/api-reference-react'
import Layout from '@theme/Layout'
import React, { useEffect } from 'react'

import './theme.css'

type Props = {
  route: ReferenceProps
}

const ScalarDocusaurusCommonJS = ({ route }: Props) => {
  useEffect(() => {
    const container = document.getElementById('api-reference-container')

    if (container && route.configuration) {
      const { spec, ...config } = route.configuration

      const apiReferenceScript = document.createElement('script')
      apiReferenceScript.id = 'api-reference'
      apiReferenceScript.type = 'application/json'

      const contentString = spec?.content
        ? typeof spec.content === 'function'
          ? JSON.stringify(spec.content())
          : JSON.stringify(spec.content)
        : ''

      const configString = JSON.stringify(config ?? {})
        .split('"')
        .join('&quot;')

      apiReferenceScript.dataset.configuration = configString
      apiReferenceScript.innerHTML = contentString

      container.appendChild(apiReferenceScript)

      // Creating and appending the script element
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'
      script.async = true
      script.onload = () => {
        console.log('Script loaded successfully')
      }
      script.onerror = (error) => {
        console.error('Error loading script:', error)
      }
      container.appendChild(script)
    } else {
      console.error('#api-reference-container not found')
    }
  }, [])

  return (
    <Layout>
      <div id="api-reference-container"></div>
    </Layout>
  )
}

export default ScalarDocusaurusCommonJS
