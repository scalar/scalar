import type { ApiReferenceConfiguration } from '@scalar/api-reference'
import { PETSTORE_URL_2_0 } from '@scalar/helpers/url/oas-document-fixtures'
import { generate } from 'random-words'
import { useEffect, useState } from 'react'

import { ApiReferenceReact } from '../src'

function App() {
  const [auth, setAuth] = useState<Required<ApiReferenceConfiguration>['authentication']>({})

  const apiKeys = ['apiKeyHeader', 'apiKeyQuery', 'apiKeyCookie', 'basicAuth', 'bearerAuth']

  useEffect(() => {
    // Update the document periodically to test reactivity
    const changeInt = setInterval(() => {
      setAuth({
        preferredSecurityScheme: apiKeys[Math.floor(Math.random() * apiKeys.length)],
        securitySchemes: {
          apiKeyHeader: {
            token: (generate(2) as string[]).join('_'),
          },
          basicAuth: {
            username: (generate(2) as string[]).join('_'),
            password: (generate(2) as string[]).join('_'),
          },
          bearerAuth: {
            token: (generate(2) as string[]).join('_'),
          },
        },
      })
    }, 10000)

    return () => clearInterval(changeInt)
  }, [])

  return (
    <ApiReferenceReact
      configuration={[
        {
          url: PETSTORE_URL_2_0,
        },
        {
          title: 'Scalar Galaxy', // optional, would fallback to 'API #1'
          slug: 'scalar-galaxy', // optional, would be auto-generated from the title or the index
          url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
          authentication: auth,
        },
      ]}
    />
  )
}

export default App
