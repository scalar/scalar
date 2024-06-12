/**
 * Simple demo page for all Scalar code highlighting functions
 */
import { getThemeById } from '@scalar/themes'
import '@scalar/themes/base.css'
import '@scalar/themes/fonts.css'
import '@scalar/themes/style.css'

import { syntaxHighlight } from '../src/code'
// @ts-expect-error vite not looking for raw types
import codeExampleLarge from '../src/constants.ts?raw'
import '../src/css/code.css'
import '../src/css/markdown.css'
import { standardLanguages } from '../src/languages'
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

document.getElementById('dark-mode-btn')?.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode')
  document.body.classList.toggle('light-mode')
})

const styleSheet = new CSSStyleSheet()
styleSheet.replaceSync(getThemeById('deepSpace'))
document.adoptedStyleSheets.push(styleSheet)

// ---------------------------------------------------------------------------
// Codeblock example

createHeader('Basic Codeblock')
const code = document.createElement('div')
code.innerHTML = syntaxHighlight(
  `const boo = 'booooooo'
function scare() {

    console.log(boo)
    window.alert('boo')

}

const template = \`\${date.now()} is Today!\`
const arr = new Array()
const date = new Date()
`,
  { languages: standardLanguages, lang: 'js' },
)
document.body.appendChild(code)

createHeader('HTML Codeblock')
const codeHtml = document.createElement('div')
codeHtml.innerHTML = syntaxHighlight(
  `<div id="wrap" class="my-name">
  Some <b>html</b> content is also highlighted
</div>
`,
  { lang: 'html', languages: standardLanguages },
)
document.body.appendChild(codeHtml)

createHeader('CSS Codeblock')
const cssHtml = document.createElement('div')
cssHtml.innerHTML = syntaxHighlight(
  `code.hljs * {
  font-size: var(--scalar-small) !important;
  font-family: var(--scalar-font-code) !important;
  text-align: left;
  white-space: pre;
  word-spacing: normal;
  word-break: normal;
  word-wrap: normal;
  line-height: 1.4;
  tab-size: 4;
}
code.hljs {
  display: inline-block;
  counter-reset: linenumber;
}
`,
  { lang: 'css', languages: standardLanguages },
)
document.body.appendChild(cssHtml)

createHeader('Longer Codeblock with Credential Masking')
const codeLong = document.createElement('div')
codeLong.innerHTML = syntaxHighlight(codeExampleLarge, {
  lang: 'typescript',
  languages: standardLanguages,
  lineNumbers: true,
  maskCredentials: ['javascript'],
})
document.body.appendChild(codeLong)

const kotlin = String.raw`val client = OkHttpClient()

val mediaType = MediaType.parse("application/json")
val body = RequestBody.create(mediaType, "{\n  \"name\": \"Marc\",\n  \"email\": \"marc@scalar.com\",\n  \"password\": \"i-love-scalar\"\n}")
val request = Request.Builder()
  .url("https://galaxy.scalar.com/user/signup")
  .post(body)
  .addHeader("Content-Type", "application/json")
  .build()

val response = client.newCall(request).execute()`

createHeader('Kotlin with escaped strings')
const codeKotlin = document.createElement('div')
codeKotlin.innerHTML = syntaxHighlight(kotlin, {
  lang: 'kotlin',
  languages: standardLanguages,
  lineNumbers: true,
  maskCredentials: [''],
})
document.body.appendChild(codeKotlin)

const shellString = String.raw`curl --request POST \
  --url https://galaxy.scalar.com/user/signup \
  --header 'Content-Type: application/json' \
  --data '{
  "name": "Marc",
  "email": "marc@scalar.com",
  "password": "i-love-scalar"
}'`

createHeader('Shell Highlighting')
const shell = document.createElement('div')
shell.innerHTML = syntaxHighlight(shellString, {
  lang: 'curl',
  languages: standardLanguages,
  lineNumbers: true,
  maskCredentials: [''],
})
document.body.appendChild(shell)

// ---------------------------------------------------------------------------
// Markdown render example

createHeader('Markdown')
const markdown = document.createElement('div')
markdown.classList.add('markdown')
markdown.innerHTML = await htmlFromMarkdown(markdownFile)
document.body.appendChild(markdown)
