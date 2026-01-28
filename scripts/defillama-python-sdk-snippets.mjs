import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const sdkSource = await readFile(resolve('sdks/python_sdk.xml'), 'utf8')

const moduleRegex = /<file path="defillama_sdk\/modules\/([^"]+)">([\s\S]*?)<\/file>/g
const pathMappings = new Map()

const variableAliases = new Map([
  ['coins_param', 'coins'],
  ['start_timestamp', 'timestamp'],
  ['api_key', 'APIKEY'],
  ['bridge_id', 'id'],
])

const normalizeVariableName = (name) => variableAliases.get(name) ?? name

const normalizeFStringPath = (value) => {
  const withoutQuote = value.replace(/\{quote\(([^)]+)\)\}/g, (_, name) => `{${normalizeVariableName(name)}}`)
  return withoutQuote.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_, name) => `{${normalizeVariableName(name)}}`)
}

const signatureToRequiredParams = (signature) => {
  const start = signature.indexOf('(')
  const end = signature.lastIndexOf(')')
  if (start === -1 || end === -1 || end <= start) {
    return []
  }
  const paramsSection = signature.slice(start + 1, end)
  const parts = paramsSection
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  return parts
    .filter((part) => !part.startsWith('self'))
    .filter((part) => !part.includes('='))
    .map((part) => part.split(':')[0].trim())
}

const placeholderByParam = {
  protocol: "'<protocol>'",
  chain: "'<chain>'",
  coins: "['<coins>']",
  timestamp: '1704067200',
  start_timestamp: '1704067200',
  end_timestamp: '1704153600',
  pool: "'<pool>'",
  symbol: "'<symbol>'",
  asset: "'<asset>'",
  id: '1',
  period: "'30'",
  token: "'<token>'",
}

const buildArgs = (params) => params.map((param) => placeholderByParam[param] ?? `'<${param}>'`)

const extractMethodMappings = (moduleName, content) => {
  const lines = content.split('\n')
  const mappings = []
  const indices = []
  lines.forEach((line, index) => {
    if (/^\s*def\s+\w+\s*\(/.test(line)) {
      indices.push(index)
    }
  })

  indices.forEach((startIndex, index) => {
    const endIndex = indices[index + 1] ?? lines.length
    const blockLines = lines.slice(startIndex, endIndex)
    const block = blockLines.join('\n')
    const signatureLines = []
    for (const line of blockLines) {
      signatureLines.push(line)
      if (line.trim().endsWith(':') && line.includes(')')) {
        break
      }
    }
    const signature = signatureLines.join(' ')
    const methodMatch = signature.match(/def\s+(\w+)\s*\(/)
    if (!methodMatch) {
      return
    }
    const methodName = methodMatch[1]
    const requiredParams = signatureToRequiredParams(signature)
    const args = buildArgs(requiredParams)
    const requiresAuth = /requires_auth=True/.test(block)
    const getMatches = [...block.matchAll(/self\._client\.get\(\s*(f?)(["'])([\s\S]*?)\2/g)]
    if (!getMatches.length) {
      return
    }
    getMatches.forEach((match) => {
      const isFString = match[1] === 'f'
      const rawPath = match[3]
      const path = isFString ? normalizeFStringPath(rawPath) : rawPath
      mappings.push({
        path,
        module: moduleName,
        method: methodName,
        args,
        requiresAuth,
      })
    })
  })

  return mappings
}

for (const match of sdkSource.matchAll(moduleRegex)) {
  const moduleFile = match[1]
  const content = match[2]
  const moduleName = moduleFile.replace('.py', '')
  const mappings = extractMethodMappings(moduleName, content)
  mappings.forEach((mapping) => {
    if (!pathMappings.has(mapping.path)) {
      pathMappings.set(mapping.path, mapping)
    }
  })
}

const overviewMapping = pathMappings.get('/overview')
if (overviewMapping && !pathMappings.has('/snapshot')) {
  pathMappings.set('/snapshot', overviewMapping)
}
const historyMapping = pathMappings.get('/history')
if (historyMapping && !pathMappings.has('/flows')) {
  pathMappings.set('/flows', historyMapping)
}

pathMappings.set('/usage/APIKEY', {
  path: '/usage/APIKEY',
  module: 'account',
  method: 'getUsage',
  args: [],
  requiresAuth: true,
})

const prefixes = ['/api', '/coins', '/stablecoins', '/bridges', '/yields', '/etfs', '/fdv', '/dat']

const resolveMapping = (path) => {
  if (pathMappings.has(path)) {
    return pathMappings.get(path)
  }
  for (const prefix of prefixes) {
    if (path.startsWith(`${prefix}/`)) {
      const basePath = path.slice(prefix.length)
      if (pathMappings.has(basePath)) {
        return pathMappings.get(basePath)
      }
    }
  }
  return null
}

const buildSnippet = (mapping) => {
  const clientName = mapping.requiresAuth ? 'pro_client' : 'client'
  const args = mapping.args.length ? mapping.args.join(', ') : ''
  return `result = ${clientName}.${mapping.module}.${mapping.method}(${args})`
}

const updateSpec = (spec, filePath) => {
  const missing = []
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      const mapping = resolveMapping(path)
      if (!mapping) {
        missing.push(`${method.toUpperCase()} ${path}`)
        continue
      }
      const existingSamples = Array.isArray(operation['x-codeSamples']) ? operation['x-codeSamples'] : []
      const nextSamples = existingSamples.filter((sample) => sample?.lang !== 'python')
      nextSamples.push({
        lang: 'python',
        label: 'Python SDK',
        source: buildSnippet(mapping),
      })
      operation['x-codeSamples'] = nextSamples
    }
  }
  if (missing.length) {
    console.log(`${filePath}: ${missing.length} unmapped operations`)
    missing.forEach((entry) => console.log(`${filePath}: ${entry}`))
  } else {
    console.log(`${filePath}: all operations mapped`)
  }
}

const files = [resolve('defillama-openapi-free.json'), resolve('defillama-openapi-pro.json')]

for (const filePath of files) {
  const spec = JSON.parse(await readFile(filePath, 'utf8'))
  updateSpec(spec, filePath)
  await writeFile(filePath, `${JSON.stringify(spec, null, 2)}\n`)
}
