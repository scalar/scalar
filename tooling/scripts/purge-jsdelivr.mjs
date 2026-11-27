import { execFileSync } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const { VERSION: version, PACKAGE: pkg = '@scalar/api-reference' } = process.env
if (!version) {
  throw new Error('Missing VERSION')
}

// These are the unversioned and @latest URLs used by the installation docs.
const paths = [
  pkg,
  `${pkg}@latest/dist/browser/standalone.js`,
  `${pkg}/esm.js`,
  `${pkg}/dist/browser/standalone.esm.js`,
]
const cdnOrigin = process.env.CDN_ORIGIN ?? 'https://cdn.jsdelivr.net'
const purgeOrigin = process.env.PURGE_ORIGIN ?? 'https://purge.jsdelivr.net'
const requestTimeout = Number(process.env.REQUEST_TIMEOUT_SECONDS ?? 10) * 1000
const npmTimeout = Number(process.env.NPM_TIMEOUT_SECONDS ?? 2400) * 1000
const pollInterval = Number(process.env.NPM_POLL_SECONDS ?? 30) * 1000
const settleTime = Number(process.env.SETTLE_SECONDS ?? 90) * 1000
const verifyInterval = Number(process.env.VERIFY_INTERVAL_SECONDS ?? 60) * 1000
const attempts = Number(process.env.VERIFY_ATTEMPTS ?? 5)
const release = `${pkg}@${version}`

// npm applies its own semver and dist-tag rules. An older latest is pending,
// while a newer installable latest means another release superseded this one.
const npmLatest = (timeout) => {
  try {
    const output = execFileSync(
      process.env.NPM_COMMAND ?? 'npm',
      ['view', `${pkg}@>=${version}`, 'version', 'dist-tags.latest', '--json', '--prefer-online', '--fetch-retries=0'],
      { timeout, killSignal: 'SIGKILL', encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
    const versions = JSON.parse(output)
    return [versions].flat().find((entry) => entry.version === entry['dist-tags.latest'])?.version
  } catch {
    return undefined
  }
}

const waitForNpm = async () => {
  const deadline = Date.now() + npmTimeout
  for (let remaining = npmTimeout; remaining > 0; remaining = deadline - Date.now()) {
    const latest = npmLatest(Math.min(remaining, requestTimeout))
    if (latest) {
      return latest
    }
    await sleep(Math.max(0, Math.min(pollInterval, deadline - Date.now())))
  }
}

const superseded = (latest) => {
  if (latest && latest !== version) {
    console.log(`Skipping ${release} because npm latest is now ${latest}`)
    return true
  }
  return false
}

const request = (url, method = 'GET') => fetch(url, { method, signal: AbortSignal.timeout(requestTimeout) })

const isStale = async (path) => {
  try {
    // fetch follows redirects and exposes only the final response's headers.
    const response = await request(`${cdnOrigin}/npm/${path}`, 'HEAD')
    return !response.ok || response.headers.get('x-jsd-version') !== version
  } catch {
    return true
  }
}

// If jsDelivr queues the request, check that request on the next round.
// Resubmitting the same path can be throttled even when the first purge succeeded.
const pendingRequests = new Map()
const purge = async (path) => {
  const id = pendingRequests.get(path)
  try {
    const url = id ? `status/${encodeURIComponent(id)}` : `npm/${path}`
    const response = await request(`${purgeOrigin}/${url}`)
    if (!response.ok) {
      if (response.status === 404) {
        pendingRequests.delete(path)
      }
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }
    const result = await response.json()
    if (result.status !== 'finished') {
      if (typeof result.id === 'string' && result.id) {
        pendingRequests.set(path, result.id)
      }
      throw new Error(`purge status ${result.status}`)
    }
    pendingRequests.delete(path)
    const details = result.paths?.[`/npm/${path}`]
    const providers = details?.providers
    const results =
      providers && typeof providers === 'object' && !Array.isArray(providers) ? Object.values(providers) : []
    if (details?.throttled !== false || !results.length || !results.every((success) => success === true)) {
      throw new Error(`jsDelivr reported ${JSON.stringify(details) ?? 'no result for this path'}`)
    }
    console.log(`Purged ${path}`)
    return true
  } catch (error) {
    console.log(`Failed to purge ${path} (${error.message})`)
    return false
  }
}

const run = async () => {
  // A fresh response from this runner cannot confirm the other CDN providers.
  const required = new Set(process.env.PURGE_ALL === 'true' ? paths : [])
  const stalePaths = async () => {
    const stale = []
    for (const path of paths) {
      if (required.has(path) || (await isStale(path))) {
        stale.push(path)
      }
    }
    return stale
  }

  let stale = await stalePaths()
  if (!stale.length) {
    console.log(`jsDelivr already serves ${release}; nothing to purge`)
    return
  }
  if (process.env.WAIT_FOR_NPM === 'false') {
    console.log(`jsDelivr does not serve ${release}, but this run did not publish it; nothing to purge`)
    return
  }

  console.log(`Waiting for npm to serve ${release}`)
  const latest = await waitForNpm()
  if (!latest) {
    throw new Error(`npm still does not serve ${release} as latest after ${npmTimeout / 1000}s`)
  }
  if (superseded(latest)) {
    return
  }
  // jsDelivr caches npm version metadata for about 60 seconds.
  await sleep(settleTime)

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const current = npmLatest(requestTimeout)
    if (superseded(current)) {
      return
    }
    if (!current) {
      console.log(`Could not confirm npm latest on attempt ${attempt}`)
      if (attempt < attempts) {
        await sleep(verifyInterval)
      }
      continue
    }
    for (const path of stale) {
      if (await purge(path)) {
        required.delete(path)
      }
    }
    await sleep(verifyInterval)
    stale = await stalePaths()
    if (!stale.length) {
      console.log(`jsDelivr serves ${release} for every URL`)
      return
    }
    console.log(`Still stale after attempt ${attempt}: ${stale.join(' ')}`)
  }
  if (!superseded(npmLatest(requestTimeout))) {
    throw new Error(
      `Could not confirm jsDelivr purge for ${release} after ${attempts} attempt(s) for:\n  ${stale.join('\n  ')}`,
    )
  }
}

await run().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
