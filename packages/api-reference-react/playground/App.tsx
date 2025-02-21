import type { ReferenceProps } from '../src'

import ScalarGalaxy from '@scalar/galaxy/3.1.json'
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
        spec: {
          content: ScalarGalaxy,
        },
        authentication: auth,
      }}
    />
  )
}

export default App
