import { isJsonString } from '@scalar/oas-utils/helpers'
import { isDefined } from '@scalar/oas-utils/helpers'
import { normalize, toJson, toYaml } from '@scalar/openapi-parser'

/**
 * Format content based on desired format and current content type
 */
function formatContent(content: string, isJson: boolean) {
  if (isJson && !isJsonString(content)) {
    // Convert YAML to JSON if JSON is requested but content is YAML
    return toJson(normalize(content))
  }

  if (!isJson && isJsonString(content)) {
    // Convert JSON to YAML if YAML is requested but content is JSON
    return toYaml(normalize(content))
  }

  return content
}

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
 * Trigger the download of the OpenAPI document
 */
export function downloadDocument(content: string, filename?: string, format?: 'json' | 'yaml') {
  const isJson = format === 'json' || (!isDefined(format) && isJsonString(content))
  const formattedContent = formatContent(content, isJson)
  const extension = isJson ? '.json' : '.yaml'
  const mimeType = isJson ? 'application/json' : 'application/x-yaml'
  const contentFilename = filename ? filename + extension : 'openapi' + extension

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
