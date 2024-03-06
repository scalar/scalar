import {
  ApiReferenceReact,
  type ReferenceProps,
} from '@scalar/api-reference-react'
import Layout from '@theme/Layout'
import React from 'react'

type Props = {
  route: ReferenceProps
}

export const ScalarDocusaurus = ({ route }: Props) => (
  <Layout>
    <ApiReferenceReact configuration={route.configuration} />
  </Layout>
)

export default ScalarDocusaurus
