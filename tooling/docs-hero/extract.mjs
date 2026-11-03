/* Pulls the style block and the page markup out of one of the landing
   artworks so it can be laid out again at the size a hero card wants.

     node tooling/docs-hero/extract.mjs <artwork-name>

   writes that artwork's css and body to out/, which is how you look at
   what a face is actually being laid out from. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/* found from this file rather than from where it was run, so the bake is
   the same from the repository root as it is from this folder */
const ASSETS = fileURLToPath(new URL('../../documentation/assets', import.meta.url))
const PREVIEW = fileURLToPath(new URL('./out', import.meta.url))

export const parts = (name) => {
  const svg = readFileSync(`${ASSETS}/${name}.svg`, 'utf8')
  const style = svg.match(/<style[^>]*>([\s\S]*?)<\/style>/)
  if (!style) {
    throw new Error(`no style block in ${name}`)
  }
  /* everything inside the foreignObject, minus the style block */
  const inner = svg.match(/<foreignObject[^>]*>([\s\S]*)<\/foreignObject>/)
  if (!inner) {
    throw new Error(`no foreignObject in ${name}`)
  }
  const body = inner[1].replace(/<style[^>]*>[\s\S]*?<\/style>/, '')
  return { css: style[1], body }
}

if (process.argv[2] && !process.argv[2].startsWith('--')) {
  const name = process.argv[2]
  const { css, body } = parts(name)
  mkdirSync(PREVIEW, { recursive: true })
  writeFileSync(`${PREVIEW}/${name}.css`, css)
  writeFileSync(`${PREVIEW}/${name}.html`, body)
  console.log(name, '→ css', css.length, 'body', body.length)
  /* the outermost wrappers, so I know what to re-style */
  const tags = [...body.matchAll(/<div[^>]*class="([^"]+)"/g)].slice(0, 12).map((m) => m[1])
  console.log('first wrappers:', tags.join(' | '))
}
