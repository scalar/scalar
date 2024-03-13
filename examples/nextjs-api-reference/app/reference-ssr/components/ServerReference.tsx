import { ApiReference, type ReferenceProps } from '@scalar/api-reference'
import React from 'react'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

export const ServerReference = async (props: ReferenceProps) => {
  const app = createSSRApp(ApiReference, props)
  const rendered = await renderToString(app)
  console.log(rendered)

  return <div dangerouslySetInnerHTML={{ __html: rendered }} />
}
