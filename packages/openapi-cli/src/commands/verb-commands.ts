import fs from 'node:fs'
import { createInterface } from 'node:readline'

import type { OpenAPI } from '@scalar/openapi-types'
import { Command } from 'commander'

import { loadSpec } from '../load-spec.js'
import { buildRequest } from '../request-builder.js'

export type VerbOptions = {
  spec?: OpenAPI.Document
  baseUrl?: string
  pathParams?: Record<string, string>
  query?: Record<string, string>
  header?: Record<string, string>
  data?: string
  apiKey?: string
  bearer?: string
  showHeaders?: boolean
  outputJson?: boolean
}

/** Read body from stdin (when data is '-') or from file (when data is '@path') */
async function resolveData(data: string | undefined): Promise<string | undefined> {
  if (!data) return undefined
  if (data === '-') {
    const rl = createInterface({ input: process.stdin })
    const lines: string[] = []
    for await (const line of rl) lines.push(line)
    return lines.join('\n')
  }
  if (data.startsWith('@')) {
    const path = data.slice(1).trim()
    return fs.readFileSync(path, 'utf-8')
  }
  return data
}

async function runVerb(
  method: string,
  pathArg: string,
  options: VerbOptions,
): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  const rawData = await resolveData(options.data)
  let body: unknown
  if (rawData) {
    try {
      body = JSON.parse(rawData)
    } catch {
      body = rawData
    }
  }

  const {
    url,
    headers,
    body: bodyStr,
  } = buildRequest({
    method,
    path: pathArg,
    baseUrl: options.baseUrl,
    pathParams: options.pathParams,
    query: options.query,
    headers: options.header,
    body,
    spec: options.spec,
    apiKey: options.apiKey,
    bearer: options.bearer,
  })

  const res = await fetch(url, {
    method,
    headers: { ...headers },
    body: bodyStr,
  })

  const text = await res.text()
  const outHeaders: Record<string, string> = {}
  res.headers.forEach((value, key) => {
    outHeaders[key] = value
  })

  return { status: res.status, headers: outHeaders, body: text }
}

function createVerbCommand(
  method: string,
  globalOptions: { baseUrl?: string; apiKey?: string; bearer?: string },
): Command {
  const cmd = new Command(method.toLowerCase())
  cmd.argument('<path>', 'Path (e.g. /users or users)')
  cmd.option('-d, --data <json|string|@file|-|>', 'Request body: JSON string, @file path, or - for stdin')
  cmd.option('-q, --query <key=value>', 'Query parameter (repeatable)', collectKeyValue)
  cmd.option('-H, --header <key:value>', 'Header (repeatable)', collectHeader)
  cmd.option('--show-headers', 'Print response headers')
  cmd.option('--output <format>', 'Output format: pretty (default) or json', 'pretty')
  cmd.option('--json', 'Same as --output json (machine-readable envelope)')
  cmd.option('--yes, --force', 'Non-interactive: skip any confirmation prompts')
  cmd.option('--base-url <url>', 'Base URL (overrides spec)', globalOptions.baseUrl)
  cmd.option('--api-key <key>', 'API key (or API_KEY env)', globalOptions.apiKey ?? process.env['API_KEY'])
  cmd.option(
    '--bearer <token>',
    'Bearer token (or BEARER_TOKEN env)',
    globalOptions.bearer ?? process.env['BEARER_TOKEN'],
  )

  cmd.action(async (pathArg: string, opts: Record<string, unknown>) => {
    const specPath = cmd.parent?.getOptionValue('spec') as string | undefined
    const spec = specPath ? await loadSpec(specPath) : undefined

    const query = (opts.query as Array<[string, string]>)?.reduce(
      (acc, [k, v]) => ({ ...acc, [k]: v }),
      {} as Record<string, string>,
    )
    const header = (opts.header as Array<[string, string]>)?.reduce(
      (acc, [k, v]) => ({ ...acc, [k]: v }),
      {} as Record<string, string>,
    )
    const outputJson = opts.json === true || opts.output === 'json'
    const result = await runVerb(method, pathArg, {
      spec,
      baseUrl: (opts.baseUrl as string) ?? globalOptions.baseUrl ?? (cmd.parent?.getOptionValue('baseUrl') as string),
      pathParams: {},
      query,
      header,
      data: opts.data as string | undefined,
      apiKey: (opts.apiKey as string) ?? globalOptions.apiKey ?? process.env['API_KEY'],
      bearer: (opts.bearer as string) ?? globalOptions.bearer ?? process.env['BEARER_TOKEN'],
      showHeaders: opts.showHeaders as boolean,
    })
    if (outputJson) {
      type Envelope = { status: number; headers: Record<string, string>; body: unknown }
      const envelope: Envelope = {
        status: result.status,
        headers: result.headers,
        body: result.body,
      }
      try {
        envelope.body = JSON.parse(result.body) as unknown
      } catch {
        // leave body as string if not JSON
      }
      console.log(JSON.stringify(envelope))
    } else {
      if (opts.showHeaders) {
        console.log('Status:', result.status)
        for (const [k, v] of Object.entries(result.headers)) {
          console.log(`${k}: ${v}`)
        }
        console.log('')
      }
      console.log(result.body)
    }
  })

  return cmd
}

function collectKeyValue(value: string, prev: Array<[string, string]> = []): Array<[string, string]> {
  const eq = value.indexOf('=')
  if (eq === -1) return prev
  const key = value.slice(0, eq).trim()
  const val = value.slice(eq + 1).trim()
  return [...prev, [key, val]]
}

function collectHeader(value: string, prev: Array<[string, string]> = []): Array<[string, string]> {
  const colon = value.indexOf(':')
  if (colon === -1) return prev
  const key = value.slice(0, colon).trim()
  const val = value.slice(colon + 1).trim()
  return [...prev, [key, val]]
}

export function registerVerbCommands(
  program: Command,
  globalOptions: { baseUrl?: string; apiKey?: string; bearer?: string },
): void {
  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    program.addCommand(createVerbCommand(method, globalOptions))
  }
}

export { runVerb }
