import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { arch, cpus, platform } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { createFixture, scenarios } from './fixtures.mjs'

const script = fileURLToPath(import.meta.url)

if (process.argv[2] === '--worker') {
  const [, , , modulePath, scenarioName] = process.argv
  const scenario = scenarios.find((entry) => entry.name === scenarioName)
  const api = await import(pathToFileURL(resolve(modulePath)).href)
  const fixture = createFixture(scenario)
  global.gc?.()
  const cpuMilliseconds = (start) => {
    const usage = process.cpuUsage(start)
    return (usage.user + usage.system) / 1000
  }
  const preparationCpuAt = process.cpuUsage()
  const preparedAt = performance.now()
  const renderer = await api.createOpenApiMarkdownRenderer(fixture)
  const preparationMs = performance.now() - preparedAt
  const preparationCpuMs = cpuMilliseconds(preparationCpuAt)
  const render = async () => {
    const selectors =
      scenario.mode === 'full'
        ? [undefined]
        : Array.from({ length: scenario.mode === 'operation' ? 1 : scenario.operations }, (_, index) => ({
            operation: { path: `/resources/${index}`, method: 'post' },
          }))
    const results = { bytes: 0, headings: 0, examples: 0 }
    for (const selector of selectors) {
      const markdown = await renderer.render(selector)
      results.bytes += Buffer.byteLength(markdown)
      results.headings += [...markdown.matchAll(/^#{1,6} /gm)].length
      results.examples += [...markdown.matchAll(/^\s*\*\*Example:\*\*/gm)].length
    }
    return results
  }
  const firstCpuAt = process.cpuUsage()
  const firstAt = performance.now()
  const output = await render()
  const firstRenderMs = performance.now() - firstAt
  const firstRenderCpuMs = cpuMilliseconds(firstCpuAt)
  await render()
  const warmCpuAt = process.cpuUsage()
  const warmAt = performance.now()
  const warm = await render()
  const warmRenderMs = performance.now() - warmAt
  const warmRenderCpuMs = cpuMilliseconds(warmCpuAt)
  if (JSON.stringify(output) !== JSON.stringify(warm)) throw new Error('Output changed between repeated renders')
  process.stdout.write(
    `${JSON.stringify({ preparationMs, preparationCpuMs, firstRenderMs, firstRenderCpuMs, warmRenderMs, warmRenderCpuMs, peakRssMiB: process.resourceUsage().maxRSS / 1024, ...output })}\n`,
  )
} else {
  const [, , oldModule, newModule, outputDirectory = 'benchmarks/results'] = process.argv
  if (!oldModule || !newModule)
    throw new Error('Usage: node benchmarks/compare.mjs OLD_MODULE NEW_MODULE [OUTPUT_DIRECTORY]')
  const samples = 5
  const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
  const results = []
  for (const scenario of scenarios) {
    const raw = { old: [], new: [] }
    for (let sample = 0; sample < samples; sample++) {
      // Alternate order to reduce bias from temperature and background load. Each sample
      // uses a fresh process, then measures its first and warmed renderer separately.
      for (const name of sample % 2 ? ['new', 'old'] : ['old', 'new']) {
        const output = execFileSync(
          process.execPath,
          ['--expose-gc', script, '--worker', resolve(name === 'old' ? oldModule : newModule), scenario.name],
          { encoding: 'utf8', maxBuffer: 1024 * 1024 },
        )
        raw[name].push(JSON.parse(output.trim().split('\n').at(-1)))
      }
    }
    const summary = Object.fromEntries(
      ['old', 'new'].map((name) => [
        name,
        Object.fromEntries(
          Object.keys(raw[name][0]).map((metric) => [metric, median(raw[name].map((sample) => sample[metric]))]),
        ),
      ]),
    )
    if (summary.old.headings !== summary.new.headings || summary.old.examples !== summary.new.examples)
      throw new Error(`Content count mismatch: ${scenario.name}`)
    results.push({ scenario, summary, raw })
    console.log(JSON.stringify({ scenario: scenario.name, ...summary }))
  }
  mkdirSync(outputDirectory, { recursive: true })
  writeFileSync(
    resolve(outputDirectory, 'comparison.json'),
    `${JSON.stringify({ node: process.version, platform: platform(), architecture: arch(), cpu: cpus()[0]?.model, samples, baseline: 'f3c39a6723', results }, null, 2)}\n`,
  )
}
