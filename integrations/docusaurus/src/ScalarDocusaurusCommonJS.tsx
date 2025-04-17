import type { ReferenceProps } from '@scalar/api-reference-react'
import BrowserOnly from '@docusaurus/BrowserOnly'
import '@scalar/api-reference-react/style.css'
import Layout from '@theme/Layout'
import React from 'react'
import './theme.css'

type Props = {
  route: ReferenceProps & {
    /** Not sure what the route type is for docusaurus, TODO: replace with that */
    id: string
  }
}

export const ScalarDocusaurus = ({ route }: Props) => {
  return (
    <Layout>
      <BrowserOnly>
        {() => {
          console.log(route)
          console.log('scalar', window.Scalar.creat)

          if (window.Scalar) {
            window.Scalar.createApiReference({
              configuration: route.configuration,
            })
          } else {
            console.error('window.Scalar is not defined')
          }

          return <div id={`scalar-api-reference-${route.id}`}>Hello</div>
          // const ApiReference = React.lazy(() => import('@scalar/api-reference-react').then(module => ({
          //   default: module.ApiReferenceReact
          // })))

          // return (
          //   <React.Suspense fallback={<div>Loading...</div>}>
          //     <ApiReference configuration={route.configuration} />
          //   </React.Suspense>
          // )
        }}
      </BrowserOnly>
    </Layout>
  )
}

export default ScalarDocusaurus
