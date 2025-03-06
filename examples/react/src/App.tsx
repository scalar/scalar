import { ApiReferenceReact } from '@scalar/api-reference-react'
import ScalarGalaxy from '@scalar/galaxy/3.1.json'
import { generate } from 'random-words'
import React, { useEffect, useState } from 'react'

function App() {
  const [spec, setSpec] = useState({ ...ScalarGalaxy })

  useEffect(() => {
    // Update the document periodically to test reactivity
    const changeInt = setInterval(() => {
      setSpec({
        ...ScalarGalaxy,
        info: {
          ...ScalarGalaxy.info,
          title: (generate(2) as string[]).join(' '),
        },
      })
    }, 2000)

    return () => clearInterval(changeInt)
  }, []) // Empty dependency array ensures the effect runs only once

  return (
    <ApiReferenceReact
      configuration={{
        content: spec,
      }}
    />
  )
}

export default App
