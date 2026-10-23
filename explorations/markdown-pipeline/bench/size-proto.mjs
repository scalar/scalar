import { HERE, PROTOTYPE_SRC } from './paths.mjs'
import { SINK, fmt, measure } from './size.mjs'

const P = PROTOTYPE_SRC
const cwd = HERE
for (const [n, src] of [
  ['prototype htmlFromMarkdown', `import { htmlFromMarkdown } from '${P}'; ${SINK}htmlFromMarkdown`],
  [
    'prototype full API',
    `import { htmlFromMarkdown, getHeadings, splitContent, textFromNode, isHeading } from '${P}'; ${SINK}[htmlFromMarkdown, getHeadings, splitContent, textFromNode, isHeading]`,
  ],
])
  console.log(fmt(await measure(n, src, { cwd })))
