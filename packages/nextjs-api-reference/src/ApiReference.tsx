import type { ReferenceConfiguration } from '@scalar/api-reference'
import Script from 'next/script'
import React from 'react'

import { nextjsThemeCss } from './theme'

export type ApiReferenceProps = {
  config: ReferenceConfiguration
}

/**
 * Next.js wrapper for an Api Reference
 *
 * {@link https://github.com/scalar/scalar?tab=readme-ov-file#configuration Configuration}
 */
export const ApiReference = ({ config: _config = {} }: ApiReferenceProps) => {
  const { spec, ...config } = _config

  // If no spec is passed, show a warning.
  if (!spec?.content && !spec?.url) {
    throw new Error(
      '[@scalar/nextjs-api-reference] You didn’t provide a spec.content or spec.url. Please provide one of these options.',
    )
  }

  const content = spec?.content
    ? typeof spec?.content === 'function'
      ? JSON.stringify(spec?.content())
      : JSON.stringify(spec?.content)
    : ''

  // Add the default CSS
  if (!config?.customCss && !config?.theme) {
    config.customCss = nextjsThemeCss
  }

  return (
    <>
      <style>{'body { margin: 0; }'}</style>
      {/* @ts-expect-error Script is fine to use here*/}
      <Script
        id="api-reference"
        type="application/json"
        data-configuration={JSON.stringify(config)}>
        {content}
      </Script>
      {/* @ts-expect-error Script is fine to use here*/}
      <Script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference" />
    </>
  )
}
