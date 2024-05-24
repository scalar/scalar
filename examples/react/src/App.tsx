import { ApiReferenceReact } from '@scalar/api-reference-react'
import { galaxySpec } from '@scalar/galaxy'
import { generate } from 'random-words'
import React, { useEffect, useState } from 'react'

function App() {
  const [spec, setSpec] = useState({ ...galaxySpec })

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

  return (
    <ApiReferenceReact
      configuration={{
        spec: {
          content: spec,
        },
      }}
    />
  )
}

export default App
