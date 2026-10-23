import { rmSync, writeFileSync } from 'node:fs'

import { rolldown } from 'rolldown'

import { BASELINE, CODE_HIGHLIGHT, HERE } from './paths.mjs'

const CH = CODE_HIGHLIGHT
const stubs = HERE + 'stubs'
const alias = {
  '@/rehype-highlight/shared-lowlight': stubs + '/shared-lowlight.js',
  '@/rehype-highlight': stubs + '/rehype-highlight.js',
  '@/languages': stubs + '/languages.js',
  '@/rehype-alert': CH + '/src/rehype-alert/index.ts',
}
const file = `${CH}/.mdbench-node.js`
writeFileSync(file, `export * from '${CH}/src/markdown/markdown.ts'`)
const b = await rolldown({
  input: file,
  platform: 'node',
  logLevel: 'silent',
  plugins: [{ name: 'stub', resolveId: (id) => alias[id] ?? null }],
})
await b.write({ file: BASELINE, format: 'es' })
rmSync(file)
