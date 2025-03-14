import type { ReferenceProps } from '../src'

import { generate } from 'random-words'
import { useEffect, useState } from 'react'

import { ApiReferenceReact } from '../src'

function App() {
  const [auth, setAuth] = useState<Required<ReferenceProps>['configuration']['authentication']>({})

  const apiKeys = ['apiKeyHeader', 'apiKeyQuery', 'apiKeyCookie', 'basicAuth', 'bearerAuth']

  useEffect(() => {
    // Update the document periodically to test reactivity
    const changeInt = setInterval(() => {
      setAuth({
        preferredSecurityScheme: apiKeys[Math.floor(Math.random() * apiKeys.length)],
        http: {
          basic: {
            username: (generate(2) as string[]).join('_'),
            password: (generate(2) as string[]).join('_'),
          },
          bearer: {
            token: (generate(2) as string[]).join('_'),
          },
        },
        apiKey: {
          token: (generate(2) as string[]).join('_'),
        },
      })
    }, 10000)

    return () => clearInterval(changeInt)
  }, [])

  return (
    <ApiReferenceReact
      configuration={{
        sources: [
          {
            url: 'https://petstore.swagger.io/v2/swagger.json',
          },
          {
            title: 'Scalar Galaxy', // optional, would fallback to 'API #1'
            slug: 'scalar-galaxy', // optional, would be auto-generated from the title or the index
            url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
          },
        ],
        // Avoid CORS issues
        proxyUrl: 'https://proxy.scalar.com',
        authentication: auth,
      }}
    />
  )
}

export default App
