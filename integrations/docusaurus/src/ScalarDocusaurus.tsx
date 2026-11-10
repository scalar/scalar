import type { RouteConfig } from '@docusaurus/types'
import Layout from '@theme/Layout'
import React, { useEffect, useRef } from 'react'

import { mountReference } from './mount-reference'

import './theme.css'

type Props = {
  route: RouteConfig & {
    /**
     * The API reference configuration, pre-serialized in the plugin (Node) to a JavaScript object
     * literal string. We cannot receive it as a plain object because Docusaurus JSON-serializes route
     * props, which drops function-valued options like `onBeforeRequest`. See issue #6933.
     */
    configuration: string
    /** Standalone bundle URL configured for this route. */
    cdn: string
  }
}

export const ScalarDocusaurus = ({ route }: Props) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) {
      return
    }

    return mountReference(ref.current, route.configuration, route.cdn)
  }, [route.configuration, route.cdn])

  return (
    <Layout>
      <div ref={ref} />
    </Layout>
  )
}

export default ScalarDocusaurus
