'use client'

import { ApiReferenceReact } from '@scalar/api-reference-react'

export default function ApiReferencePage() {
  return (
    <ApiReferenceReact
      configuration={{
        url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
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
