'use client'

import { ApiReference as VueComponent } from '@scalar/api-reference'
import Layout from '@theme/Layout'
import React from 'react'
import { applyVueInReact } from 'veaury'

const ApiReference = applyVueInReact(VueComponent)

function ApiDoc({ layoutProps, specProps }) {
  // const defaultTitle = specProps.spec?.info?.title || 'API Docs';
  // const defaultDescription =
  //   specProps.spec?.info?.description || 'Open API Reference Docs for the API';

  const configuration = {
    proxy: 'https://api.scalar.com/request-proxy',
    spec: {
      content: specProps?.spec ?? null,
      url: specProps?.url ?? '',
      // url: 'https://petstore3.swagger.io/api/v3/openapi.json',
    },
  }

  return (
    <>
      {/* title={defaultTitle}
      description={defaultDescription} */}
      <Layout>
        <ApiReference configuration={configuration} />
      </Layout>
    </>
  )
}

export default ApiDoc
