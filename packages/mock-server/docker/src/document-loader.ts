import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DOCS_DIR = '/docs'
const TEMP_DOCUMENT = '/tmp/openapi.yaml'

export async function loadDocument(): Promise<string> {
  // First priority: OPENAPI_DOCUMENT environment variable
  if (process.env.OPENAPI_DOCUMENT) {
    console.log('✓ Using OpenAPI document from OPENAPI_DOCUMENT environment variable')
    writeFileSync(TEMP_DOCUMENT, process.env.OPENAPI_DOCUMENT, 'utf8')
    return TEMP_DOCUMENT
  }

  // Second priority: OPENAPI_URL environment variable
  if (process.env.OPENAPI_URL) {
    console.log(`✓ Fetching OpenAPI document from ${process.env.OPENAPI_URL}`)
    const response = await fetch(process.env.OPENAPI_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`)
    }
    const content = await response.text()
    writeFileSync(TEMP_DOCUMENT, content, 'utf8')
    return TEMP_DOCUMENT
  }

  // Third priority: Volume scan
  console.log(`Scanning ${DOCS_DIR} for OpenAPI documents...`)
  const document = scanForDocument(DOCS_DIR)
  if (document) {
    console.log(`✓ Found OpenAPI document: ${document}`)
    return document
  }

  throw new Error(
    'No OpenAPI document found. Please provide via OPENAPI_DOCUMENT, OPENAPI_URL, or volume mount to /docs',
  )
}

function scanForDocument(dir: string): string | null {
  if (!existsSync(dir)) {
    return null
  }

  try {
    const files = readdirSync(dir)
    for (const file of files) {
      const fullPath = join(dir, file)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        const found = scanForDocument(fullPath)
        if (found) {
          return found
        }
      } else if (file.match(/\.(json|ya?ml)$/i)) {
        if (isOpenApiDocument(fullPath)) {
          return fullPath
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error scanning directory ${dir}`, error)
  }

  return null
}

function isOpenApiDocument(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf8')
    return (
      content.includes('openapi:') ||
      content.includes('"openapi"') ||
      content.includes('swagger:') ||
      content.includes('"swagger"')
    )
  } catch {
    return false
  }
}
