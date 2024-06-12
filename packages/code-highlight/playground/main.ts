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
import { htmlFromMarkdown } from '../src/markdown/markdown'
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
code.innerHTML = syntaxHighlight(
  `const boo = 'booooooo'
function scare() {
    console.log(boo)
}
`,
)
document.body.appendChild(code)

createHeader('HTML Codeblock')
const codeHtml = document.createElement('div')
codeHtml.innerHTML = syntaxHighlight(
  `<div>Some <b>html</b> content is also highlight</div>
`,
)
document.body.appendChild(codeHtml)

createHeader('Longer Codeblock with Credential Masking')
const codeLong = document.createElement('div')
codeLong.innerHTML = syntaxHighlight(codeExampleLarge, {
  lang: 'ts',
  lineNumbers: true,
  maskCredentials: [''],
})
document.body.appendChild(codeLong)

// ---------------------------------------------------------------------------
// Markdown render example

createHeader('Markdown')
const markdown = document.createElement('div')
markdown.classList.add('markdown')
markdown.innerHTML = await htmlFromMarkdown(markdownFile)
document.body.appendChild(markdown)
