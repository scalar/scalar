import type { ReferenceProps } from '@scalar/api-reference-react'
import BrowserOnly from '@docusaurus/BrowserOnly'
import '@scalar/api-reference-react/style.css'
import Layout from '@theme/Layout'
import React from 'react'
import './theme.css'

type Props = {
  route: ReferenceProps
}

export const ScalarDocusaurus = ({ route }: Props) => {
  return (
    <Layout>
      <BrowserOnly>
        {() => {
          const ApiReference = React.lazy(() =>
            import('@scalar/api-reference-react').then((module) => ({
              default: module.ApiReferenceReact,
            })),
          )

          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <ApiReference configuration={route.configuration} />
            </React.Suspense>
          )
        }}
      </BrowserOnly>
    </Layout>
  )
}

export default ScalarDocusaurus
