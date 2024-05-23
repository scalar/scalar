import { createScalarReferences } from '@scalar/api-reference'
import content from '@scalar/galaxy/latest.yaml?raw'

const el = document.getElementById('root')
console.log(el)

const references = createScalarReferences(el, {
  spec: { content },
})

/** Change the title to show dynamic updates */
const galaxy: string = content
const universe = content.replace(
  'title: Scalar Galaxy',
  'title: Scalar Universe',
)
let activeContent = galaxy

setInterval(() => {
  activeContent = activeContent === galaxy ? universe : galaxy
  references.updateSpec({
    content: activeContent,
  })
}, 1500)

let isDark = false
setInterval(() => {
  isDark = !isDark
  references.updateConfig({ darkMode: isDark })
}, 3000)
