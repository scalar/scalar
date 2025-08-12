'use client'

import { ApiReferenceReact } from '@scalar/api-reference-react'

export default function ApiReferencePage() {
  return (
    <ApiReferenceReact
      configuration={{
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=yaml',
        withDefaultFonts: false,
        hideModels: true,
        tagsSorter: 'alpha',
        searchHotKey: 'k',
        hideDarkModeToggle: true,
        hideDownloadButton: true,
        hiddenClients: true,
        defaultHttpClient: {
          targetKey: 'shell',
          clientKey: 'curl',
        },
        operationsSorter: 'alpha',
      }}
    />
  )
}
