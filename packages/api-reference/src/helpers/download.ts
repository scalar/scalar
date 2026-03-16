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

function createJSONBlob(content: Record<string, unknown>) {
  return new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
}

async function createYAMLBlob(content: Record<string, unknown>) {
  const { stringify } = await import('yaml')
  return new Blob([stringify(content)], { type: 'application/yaml' })
}

/**
 * Trigger the download of the OpenAPI document
 */
export async function downloadDocument(content: string, filename?: string, format?: 'json' | 'yaml') {
  const parsed = await parseContent(content)

  const contentFilename = `${filename ?? 'openapi'}${format === 'json' ? '.json' : '.yaml'}`

  const blob = format === 'json' ? createJSONBlob(parsed) : await createYAMLBlob(parsed)

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
