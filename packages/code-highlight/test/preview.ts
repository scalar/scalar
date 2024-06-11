/**
 * Simple demo page for all Scalar code highlighting functions
 */
import '@scalar/themes/base.css'
import '@scalar/themes/fonts.css'

import { syntaxHighlight } from '../src/code'
// @ts-expect-error vite not looking for raw types
import codeExampleLarge from '../src/constants.ts?raw'
import '../src/css/code.css'
import '../src/css/markdown.css'
import { htmlFromMarkdown } from '../src/markdown'
// @ts-expect-error vite not looking for raw types
import markdownFile from './markdown-test.md?raw'

/** Create a section break header */
function createHeader(text: string) {
  const header = document.createElement('h2')
  header.classList.add('section-header')
  header.innerHTML = text
  document.body.appendChild(header)
}

// ---------------------------------------------------------------------------
// Codeblock example

createHeader('Basic Codeblock')
const code = document.createElement('div')
code.innerHTML = await syntaxHighlight(
  `const boo = 'booooooo'
function scare() {
    console.log(boo)
}
`,
)
document.body.appendChild(code)

createHeader('Longer Codeblock')
const codeLong = document.createElement('div')
codeLong.innerHTML = await syntaxHighlight(codeExampleLarge, {
  lang: 'ts',
  lineNumbers: true,
})
document.body.appendChild(codeLong)

// ---------------------------------------------------------------------------
// Markdown render example

createHeader('Markdown')
const markdown = document.createElement('div')
markdown.classList.add('markdown')
markdown.innerHTML = await htmlFromMarkdown(markdownFile)
document.body.appendChild(markdown)
