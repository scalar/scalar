import BrowserOnly from '@docusaurus/BrowserOnly'
import { type ReferenceProps } from '@scalar/api-reference-react'
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
          const ApiReferenceReact =
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            require('@scalar/api-reference-react').ApiReferenceReact
          return <ApiReferenceReact configuration={route.configuration} />
        }}
      </BrowserOnly>
    </Layout>
  )
}

export default ScalarDocusaurus
