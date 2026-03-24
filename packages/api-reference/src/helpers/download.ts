/**
 * Create a click event that works in both browser and test environments
 */
function createClickEvent() {
  try {
    return new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    })
  } catch {
    // Fallback for test environment
    return new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    })
  }
}

/**
 * Parse YAML or JSON content into a JavaScript object
 */
async function parseContent(content: string) {
  try {
    return JSON.parse(content)
  } catch {
    const { parse } = await import('yaml')
    return parse(content, {
      maxAliasCount: 10000,
      merge: true,
    })
  }
}

/**
 * Detect if content is JSON or YAML using lightweight string heuristics
 * to avoid the cost of a full JSON.parse call.
 */
function detectFormat(content: string): 'json' | 'yaml' {
  const trimmed = content.trimStart()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json'
  }
  return 'yaml'
}

/**
 * Convert content to the target format, returning the original string when
 * no conversion is needed so that YAML comments, custom formatting, and key
 * ordering are preserved.
 */
async function formatContent(
  content: string,
  inputFormat: 'json' | 'yaml',
  outputFormat: 'json' | 'yaml',
): Promise<string> {
  if (inputFormat === outputFormat) {
    return content
  }

  const parsed = await parseContent(content)

  if (outputFormat === 'json') {
    return JSON.stringify(parsed, null, 2)
  }

  const { stringify } = await import('yaml')
  return stringify(parsed)
}

/**
 * Trigger the download of the OpenAPI document
 */
export async function downloadDocument(content: string, filename?: string, format?: 'json' | 'yaml') {
  const inputFormat = detectFormat(content)
  const outputFormat = format ?? inputFormat
  const contentFilename = `${filename ?? 'openapi'}.${outputFormat}`
  const mimeType = outputFormat === 'json' ? 'application/json' : 'application/x-yaml'

  const formattedContent = await formatContent(content, inputFormat, outputFormat)
  const blob = new Blob([formattedContent], { type: mimeType })

  const data = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = data
  link.download = contentFilename

  // this is necessary as link.click() does not work on the latest firefox
  link.dispatchEvent(createClickEvent())

  // For Firefox it is necessary to delay revoking the ObjectURL
  setTimeout(() => {
    window.URL.revokeObjectURL(data)
    link.remove()
  }, 100)
}
