import { galaxySpec } from '@scalar/galaxy'
import { generate } from 'random-words'
import { useEffect, useState } from 'react'

import { ApiReferenceReact, ReferenceProps } from '../src'

function App() {
  const [spec, setSpec] = useState({ ...galaxySpec })
  const [auth, setAuth] = useState<
    Required<ReferenceProps>['configuration']['authentication']
  >({})

  useEffect(() => {
    // Update the spec periodically to test reactivity
    const changeInt = setInterval(() => {
      setSpec({
        ...galaxySpec,
        info: {
          ...galaxySpec.info,
          title: (generate(2) as string[]).join(' '),
        },
      })
    }, 2000)

    return () => clearInterval(changeInt)
  }, []) // Empty dependency array ensures the effect runs only once

  const apiKeys = [
    'apiKeyHeader',
    'apiKeyQuery',
    'apiKeyCookie',
    'basicAuth',
    'bearerAuth',
  ]

  useEffect(() => {
    // Update the spec periodically to test reactivity
    const changeInt = setInterval(() => {
      setAuth({
        preferredSecurityScheme:
          apiKeys[Math.floor(Math.random() * apiKeys.length)],
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
          content: spec,
        },
        authentication: auth,
      }}
    />
  )
}

export default App
