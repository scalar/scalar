'use client'

import { ApiReference as VueComponent } from '@scalar/api-reference'
import React from 'react'
import { applyVueInReact } from 'veaury'

const ApiReference = applyVueInReact(VueComponent)

function ApiDoc({ layoutProps, specProps }) {
  // const defaultTitle = specProps.spec?.info?.title || 'API Docs';
  // const defaultDescription =
  //   specProps.spec?.info?.description || 'Open API Reference Docs for the API';

  return (
    <>
      <ApiReference configuration={{ isEditable: true }} />
    </>
  )
}

export default ApiDoc
