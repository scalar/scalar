/** Lists the inputs of one bucket of a differential run, shortest first: `node bench/bucket.mjs <label> <bucket> [count]`. */
import { readFileSync } from 'node:fs'

import { bucketOf } from './classify.mjs'
import { OUT } from './paths.mjs'

const [label, bucket, count = '20'] = process.argv.slice(2)
const run = JSON.parse(readFileSync(`${OUT}${label}-diffs.json`, 'utf8'))
const list = run.different.filter((d) => bucketOf(d) === bucket).sort((a, b) => a.markdown.length - b.markdown.length)
console.log(`${list.length} in "${bucket}"`)
for (const d of list.slice(0, Number(count))) console.log(JSON.stringify(d.markdown.slice(0, 300)))
