import fs from 'node:fs/promises'
import path from 'node:path'

import { type ErrorObject, validate } from '@scalar/openapi-parser'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { convert } from '../../src/index'
import type { Item, ItemGroup, PostmanCollection, Request, RequestBody } from '../../src/types'

const PACKAGE_ROOT = path.resolve(import.meta.dirname, '../..')
const INPUT_DIR = path.join(PACKAGE_ROOT, 'fixtures/evaluate/input')
const OUTPUT_DIR = path.join(PACKAGE_ROOT, 'fixtures/evaluate/output')
const REPORTS_DIR = path.join(PACKAGE_ROOT, 'fixtures/evaluate/reports')
const IDEAS_DIR = path.join(PACKAGE_ROOT, 'fixtures/evaluate/ideas')

type ConversionError = {
  name: string
  message: string
  stack?: string
}

type ValidationReport = {
  valid: boolean
  errors: Array<{ message: string; path?: string }>
}

type InputMetrics = {
  requestCount: number
  folderCount: number
  authTypes: string[]
  bodyModes: string[]
  responseExampleCount: number
  variableCount: number
}

type OutputMetrics = {
  pathCount: number
  operationCount: number
  serverCount: number
  securitySchemes: string[]
  operationsWithSecurity: number
  componentsSchemaCount: number
  responseExampleCount: number
  tagCount: number
  operationIdCount: number
}

type Result = {
  file: string
  status: 'success' | 'error'
  error: ConversionError | null
  validation: ValidationReport | null
  input: InputMetrics | null
  output: OutputMetrics | null
  outputPath: string | null
}

type RunReport = {
  runAt: string
  inputDir: string
  outputDir: string
  totals: {
    total: number
    converted: number
    validated: number
    failed: number
  }
  results: Result[]
}

const isItemGroup = (entry: Item | ItemGroup): entry is ItemGroup => Array.isArray((entry as ItemGroup).item)

const pushUnique = (list: string[], value: string | undefined | null) => {
  if (value && !list.includes(value)) {
    list.push(value)
  }
}

const collectInputMetrics = (collection: PostmanCollection): InputMetrics => {
  const metrics: InputMetrics = {
    requestCount: 0,
    folderCount: 0,
    authTypes: [],
    bodyModes: [],
    responseExampleCount: 0,
    variableCount: collection.variable?.length ?? 0,
  }

  pushUnique(metrics.authTypes, collection.auth?.type)

  const walk = (entries: (Item | ItemGroup)[] | undefined) => {
    if (!Array.isArray(entries)) {
      return
    }
    for (const entry of entries) {
      if (isItemGroup(entry)) {
        metrics.folderCount += 1
        pushUnique(metrics.authTypes, entry.auth?.type)
        walk(entry.item)
        continue
      }

      metrics.requestCount += 1
      metrics.responseExampleCount += entry.response?.length ?? 0

      const request: Request | undefined = entry.request
      if (request && typeof request !== 'string') {
        pushUnique(metrics.authTypes, request.auth?.type)
        const body: RequestBody | null | undefined = request.body
        pushUnique(metrics.bodyModes, body?.mode)
      }
    }
  }

  walk(collection.item)
  return metrics
}

const collectOutputMetrics = (document: OpenAPIV3_1.Document): OutputMetrics => {
  const metrics: OutputMetrics = {
    pathCount: 0,
    operationCount: 0,
    serverCount: document.servers?.length ?? 0,
    securitySchemes: Object.keys(document.components?.securitySchemes ?? {}),
    operationsWithSecurity: 0,
    componentsSchemaCount: Object.keys(document.components?.schemas ?? {}).length,
    responseExampleCount: 0,
    tagCount: document.tags?.length ?? 0,
    operationIdCount: 0,
  }

  const methods: OpenAPIV3_1.HttpMethods[] = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']
  const paths = document.paths ?? {}

  for (const [, pathItem] of Object.entries(paths)) {
    if (!pathItem) {
      continue
    }
    metrics.pathCount += 1

    for (const method of methods) {
      const operation = pathItem[method]
      if (!operation) {
        continue
      }
      metrics.operationCount += 1
      if (operation.operationId) {
        metrics.operationIdCount += 1
      }
      if (operation.security?.length) {
        metrics.operationsWithSecurity += 1
      }

      for (const response of Object.values(operation.responses ?? {})) {
        const content = (response as OpenAPIV3_1.ResponseObject).content ?? {}
        for (const media of Object.values(content)) {
          const examples = (media as OpenAPIV3_1.MediaTypeObject).examples
          if (examples) {
            metrics.responseExampleCount += Object.keys(examples).length
          } else if ((media as OpenAPIV3_1.MediaTypeObject).example !== undefined) {
            metrics.responseExampleCount += 1
          }
        }
      }
    }
  }

  return metrics
}

const toConversionError = (error: unknown): ConversionError => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }
  return { name: 'UnknownError', message: String(error) }
}

const runValidation = async (document: OpenAPIV3_1.Document): Promise<ValidationReport> => {
  try {
    const result = await validate(document)
    return {
      valid: result.valid,
      errors: (result.errors ?? []).map((entry: ErrorObject) => ({
        message: entry.message ?? 'Unknown error',
        path: 'path' in entry && typeof entry.path === 'string' ? entry.path : undefined,
      })),
    }
  } catch (error) {
    return { valid: false, errors: [{ message: toConversionError(error).message }] }
  }
}

const ensureDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true })
}

const listInputs = async (): Promise<string[]> => {
  try {
    const entries = await fs.readdir(INPUT_DIR)
    return entries.filter((name) => name.toLowerCase().endsWith('.json')).sort()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

const processFile = async (fileName: string): Promise<Result> => {
  const inputPath = path.join(INPUT_DIR, fileName)
  const raw = await fs.readFile(inputPath, 'utf8')

  let collection: PostmanCollection
  try {
    collection = JSON.parse(raw) as PostmanCollection
  } catch (error) {
    return {
      file: fileName,
      status: 'error',
      error: { ...toConversionError(error), name: 'InputJsonParseError' },
      validation: null,
      input: null,
      output: null,
      outputPath: null,
    }
  }

  const input = collectInputMetrics(collection)

  let document: OpenAPIV3_1.Document
  try {
    document = convert(collection)
  } catch (error) {
    return {
      file: fileName,
      status: 'error',
      error: toConversionError(error),
      validation: null,
      input,
      output: null,
      outputPath: null,
    }
  }

  const outputPath = path.join(OUTPUT_DIR, fileName)
  await fs.writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`)

  const validation = await runValidation(document)
  const output = collectOutputMetrics(document)

  return {
    file: fileName,
    status: 'success',
    error: null,
    validation,
    input,
    output,
    outputPath: path.relative(PACKAGE_ROOT, outputPath),
  }
}

const formatTable = (results: Result[]): string => {
  const rows: string[][] = [['file', 'status', 'valid', 'reqs→ops', 'schemes', 'examples']]
  for (const result of results) {
    const reqs = result.input?.requestCount ?? '-'
    const ops = result.output?.operationCount ?? '-'
    const schemes = result.output?.securitySchemes.length ?? '-'
    const examples = result.output?.responseExampleCount ?? '-'
    rows.push([
      result.file,
      result.status,
      result.validation ? (result.validation.valid ? 'yes' : 'no') : '-',
      `${reqs}→${ops}`,
      String(schemes),
      String(examples),
    ])
  }

  const widths = rows[0].map((_, column) => Math.max(...rows.map((row) => row[column].length)))
  return rows.map((row) => row.map((cell, column) => cell.padEnd(widths[column])).join('  ')).join('\n')
}

const main = async () => {
  const files = await listInputs()

  if (files.length === 0) {
    console.log(`No Postman collections found in ${path.relative(PACKAGE_ROOT, INPUT_DIR)}/`)
    console.log('Drop one or more .json collections into that folder and re-run.')
    return
  }

  await ensureDir(OUTPUT_DIR)
  await ensureDir(REPORTS_DIR)
  await ensureDir(IDEAS_DIR)

  console.log(`Evaluating ${files.length} collection${files.length === 1 ? '' : 's'}...`)

  const results: Result[] = []
  for (const file of files) {
    process.stdout.write(`  • ${file} ... `)
    const result = await processFile(file)
    results.push(result)
    if (result.status === 'success') {
      console.log(result.validation?.valid ? 'ok' : 'ok (invalid document)')
    } else {
      console.log(`failed (${result.error?.name})`)
    }
  }

  const runAt = new Date().toISOString()
  const report: RunReport = {
    runAt,
    inputDir: path.relative(PACKAGE_ROOT, INPUT_DIR),
    outputDir: path.relative(PACKAGE_ROOT, OUTPUT_DIR),
    totals: {
      total: results.length,
      converted: results.filter((r) => r.status === 'success').length,
      validated: results.filter((r) => r.validation?.valid).length,
      failed: results.filter((r) => r.status === 'error').length,
    },
    results,
  }

  const reportFileName = `run-${runAt.replace(/[:.]/g, '-')}.json`
  const reportPath = path.join(REPORTS_DIR, reportFileName)
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)

  console.log('')
  console.log(formatTable(results))
  console.log('')
  console.log(`Report: ${path.relative(PACKAGE_ROOT, reportPath)}`)
  console.log(`Outputs: ${path.relative(PACKAGE_ROOT, OUTPUT_DIR)}/`)
}

await main()
