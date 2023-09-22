import { ApiReference as VueComponent } from '@scalar/api-reference'
import { applyVueInReact } from 'veaury'

const ApiReference = applyVueInReact(VueComponent)

function App() {
  return (
    <>
      {/* Explanation: https://github.com/devilwjp/veaury#typescript-jsx-types-conflict-caused-by-vue-and-react-at-the-same-time
      // @ts-ignore */}
      <ApiReference isEditable={true}></ApiReference>
    </>
  )
}

export default App
