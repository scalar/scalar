import type { OpenAPI } from '@scalar/openapi-types'
import { Command } from 'commander'

import { buildRequest } from '../request-builder.js'
import type { TraversedOperation } from '../traverse-spec.js'
import { traverseSpec } from '../traverse-spec.js'

function getOrCreateCommand(parent: Command, name: string): Command {
  const existing = parent.commands.find((c) => c.name() === name)
  if (existing) return existing
  const cmd = new Command(name)
  parent.addCommand(cmd)
  return cmd
}

function getOrCreateChain(parent: Command, segments: string[]): Command {
  let current = parent
  for (const seg of segments) {
    current = getOrCreateCommand(current, seg)
  }
  return current
}

/** Convert flag key to Commander option: --identity-country or --identity.country (plan allows dotted) */
function flagToOptionName(key: string): string {
  return key.includes('.')
    ? `--${key}`
    : `--${key
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')}`
}

function buildActionCommand(
  op: TraversedOperation,
  spec: OpenAPI.Document,
  globalOptions: { baseUrl?: string; apiKey?: string; bearer?: string },
): Command {
  const actionCmd = new Command(op.action)
  if (op.operation.summary) {
    actionCmd.description(String(op.operation.summary))
  }

  for (const p of op.pathParams) {
    const name = p.name.replace(/([A-Z])/g, '-$1').toLowerCase()
    actionCmd.option(`--${name} <value>`, p.description ?? `Path param: ${p.name}`)
  }
  for (const p of op.queryParams) {
    const name = p.name.replace(/([A-Z])/g, '-$1').toLowerCase()
    actionCmd.option(`--${name} <value>`, p.description ?? `Query: ${p.name}`)
  }
  for (const p of op.headerParams) {
    const name = p.name.toLowerCase().replace(/([^a-z0-9]+)/g, '-')
    actionCmd.option(`--header-${name} <value>`, p.description ?? `Header: ${p.name}`)
  }
  for (const key of op.bodyFlagKeys) {
    const optName = flagToOptionName(key)
    actionCmd.option(`${optName} <value>`, `Body: ${key}`)
  }

  actionCmd.option('--show-headers', 'Print response headers')
  actionCmd.option('--output <format>', 'Output: pretty or json', 'pretty')
  actionCmd.option('--json', 'Machine-readable envelope { status, headers, body }')
  actionCmd.option('--yes, --force', 'Non-interactive')
  actionCmd.option('--base-url <url>', 'Base URL', globalOptions.baseUrl)
  actionCmd.option('--api-key <key>', 'API key', globalOptions.apiKey ?? process.env['API_KEY'])
  actionCmd.option('--bearer <token>', 'Bearer token', globalOptions.bearer ?? process.env['BEARER_TOKEN'])

  actionCmd.action(async (opts: Record<string, unknown>) => {
    const pathParams: Record<string, string> = {}
    for (const p of op.pathParams) {
      const name = p.name.replace(/([A-Z])/g, '-$1').toLowerCase()
      const v = opts[name]
      if (v != null) pathParams[p.name] = String(v)
    }
    const query: Record<string, string> = {}
    for (const p of op.queryParams) {
      const name = p.name.replace(/([A-Z])/g, '-$1').toLowerCase()
      const v = opts[name]
      if (v != null) query[p.name] = Array.isArray(v) ? v[v.length - 1] : String(v)
    }
    const headers: Record<string, string> = {}
    for (const p of op.headerParams) {
      const name = `header-${p.name.toLowerCase().replace(/([^a-z0-9]+)/g, '-')}`
      const v = opts[name]
      if (v != null) headers[p.name] = String(v)
    }
    const body: Record<string, unknown> = {}
    for (const key of op.bodyFlagKeys) {
      const optName = flagToOptionName(key).replace(/^--/, '')
      const v = opts[optName]
      if (v != null) {
        const parts = optName.split('.')
        let current: Record<string, unknown> = body
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i]!
          if (!(part in current)) current[part] = {}
          current = current[part] as Record<string, unknown>
        }
        current[parts[parts.length - 1]!] = v
      }
    }
    const bodyStr = Object.keys(body).length > 0 ? body : undefined

    const {
      url,
      headers: outHeaders,
      body: bodyOut,
    } = buildRequest({
      method: op.method,
      path: op.path,
      pathParams,
      query,
      headers,
      body: bodyStr,
      spec,
      apiKey: (opts.apiKey as string) ?? globalOptions.apiKey ?? process.env['API_KEY'],
      bearer: (opts.bearer as string) ?? globalOptions.bearer ?? process.env['BEARER_TOKEN'],
      baseUrl: (opts.baseUrl as string) ?? globalOptions.baseUrl,
    })

    const res = await fetch(url, {
      method: op.method,
      headers: outHeaders,
      body: bodyOut,
    })
    const text = await res.text()
    const outputJson = opts.json === true || opts.output === 'json'
    if (outputJson) {
      const headersObj: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        headersObj[key] = value
      })
      let bodyParsed: unknown = text
      try {
        bodyParsed = JSON.parse(text)
      } catch {
        // leave as string
      }
      console.log(JSON.stringify({ status: res.status, headers: headersObj, body: bodyParsed }))
    } else {
      if (opts.showHeaders) {
        console.log('Status:', res.status)
        res.headers.forEach((value, key) => console.log(`${key}: ${value}`))
        console.log('')
      }
      console.log(text)
    }
  })

  return actionCmd
}

export function registerResourceActionCommands(
  program: Command,
  spec: OpenAPI.Document,
  globalOptions: { baseUrl?: string; apiKey?: string; bearer?: string },
): void {
  const operations = traverseSpec(spec)

  for (const op of operations) {
    if (!op.resource || !op.action) continue

    const actionCommand = buildActionCommand(op, spec, globalOptions)

    const resourceParent = getOrCreateChain(program, [op.resource])
    if (!resourceParent.commands.some((c) => c.name() === op.action)) {
      resourceParent.addCommand(actionCommand)
    }

    if (op.prefixSegments.length > 0) {
      const prefixParent = getOrCreateChain(program, op.prefixSegments.concat(op.resource))
      if (!prefixParent.commands.some((c) => c.name() === op.action)) {
        const actionClone = buildActionCommand(op, spec, globalOptions)
        prefixParent.addCommand(actionClone)
      }
    }
  }
}
