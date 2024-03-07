import { ApiReferenceReact } from '@scalar/api-reference-react'

function App() {
  return (
    <>
      {/* Explanation: https://github.com/devilwjp/veaury#typescript-jsx-types-conflict-caused-by-vue-and-react-at-the-same-time
      // @ts-ignore */}
      <ApiReferenceReact
        configuration={{
          spec: {
            content: {
              openapi: '3.1.0',
              info: { title: 'Example' },
              paths: {},
            },
          },
        }}
      />
    </>
  )
}

export default App
