import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DOCS_DIR = '/docs'
const TEMP_DOCUMENT_JSON = '/tmp/openapi.json'
const TEMP_DOCUMENT_YAML = '/tmp/openapi.yaml'

interface DocumentInfo {
  path: string
  format: 'json' | 'yaml'
}

export async function loadDocument(commandLineUrl?: string): Promise<DocumentInfo> {
  // First priority: Command-line URL argument (--url)
  if (commandLineUrl) {
    console.log(`✓ Fetching OpenAPI document from command-line URL: ${commandLineUrl}`)
    try {
      const response = await fetch(commandLineUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch document from URL: ${response.status} ${response.statusText}`)
      }
      const content = await response.text()
      const format = detectDocumentFormat(content)
      const tempPath = format === 'json' ? TEMP_DOCUMENT_JSON : TEMP_DOCUMENT_YAML
      writeFileSync(tempPath, content, 'utf8')
      return { path: tempPath, format }
    } catch (error) {
      throw new Error(
        `Failed to fetch OpenAPI document from URL ${commandLineUrl}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  // Second priority: OPENAPI_DOCUMENT environment variable
  if (process.env.OPENAPI_DOCUMENT) {
    console.log('✓ Using OpenAPI document from OPENAPI_DOCUMENT environment variable')
    const format = detectDocumentFormat(process.env.OPENAPI_DOCUMENT)
    const tempPath = format === 'json' ? TEMP_DOCUMENT_JSON : TEMP_DOCUMENT_YAML
    writeFileSync(tempPath, process.env.OPENAPI_DOCUMENT, 'utf8')
    return { path: tempPath, format }
  }

  // Third priority: OPENAPI_DOCUMENT_URL environment variable
  if (process.env.OPENAPI_DOCUMENT_URL) {
    console.log(`✓ Fetching OpenAPI document from URL: ${process.env.OPENAPI_DOCUMENT_URL}`)
    try {
      const response = await fetch(process.env.OPENAPI_DOCUMENT_URL)
      if (!response.ok) {
        throw new Error(`Failed to fetch document from URL: ${response.status} ${response.statusText}`)
      }
      const content = await response.text()
      const format = detectDocumentFormat(content)
      const tempPath = format === 'json' ? TEMP_DOCUMENT_JSON : TEMP_DOCUMENT_YAML
      writeFileSync(tempPath, content, 'utf8')
      return { path: tempPath, format }
    } catch (error) {
      throw new Error(
        `Failed to fetch OpenAPI document from URL ${process.env.OPENAPI_DOCUMENT_URL}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  // Fourth priority: Volume scan
  console.log(`Scanning ${DOCS_DIR} for OpenAPI documents...`)
  const document = scanForDocument(DOCS_DIR)
  if (document) {
    console.log(`✓ Found OpenAPI document: ${document}`)
    const content = readFileSync(document, 'utf8')
    const format = detectDocumentFormat(content)
    return { path: document, format }
  }

  throw new Error(
    `No OpenAPI document found. Please provide via --url <URL>, OPENAPI_DOCUMENT, OPENAPI_DOCUMENT_URL, or volume mount to ${DOCS_DIR}`,
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

function detectDocumentFormat(content: string): 'json' | 'yaml' {
  // Try to parse as JSON first
  try {
    const trimmed = content.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      JSON.parse(content)
      return 'json'
    }
  } catch {
    // Not valid JSON, continue to check YAML
  }

  // Default to YAML if not JSON
  return 'yaml'
}
