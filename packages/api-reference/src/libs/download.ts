import { isJsonString } from '@scalar/oas-utils/helpers'
import { type EventBusKey, useEventBus } from '@vueuse/core'

const downloadEventBusKey: EventBusKey<{ id: string; filename?: string }> = Symbol('download')
export const downloadEventBus = useEventBus(downloadEventBusKey)

/**
 * Trigger the download of the OpenAPI document
 */
export function downloadDocument(content: string, filename?: string) {
  const isJson = isJsonString(content)

  const blob = isJson
    ? new Blob([content], { type: 'application/json' })
    : new Blob([content], { type: 'application/x-yaml' })

  const data = URL.createObjectURL(blob)
  const extension = isJson ? '.json' : '.yaml'

  // Default filename based on the file type
  const defaultFilename = 'openapi' + extension

  // Spec filename as filename or default
  const contentFilename = filename ? filename + extension : defaultFilename

  const link = document.createElement('a')

  link.href = data
  link.download = contentFilename
  // this is necessary as link.click() does not work on the latest firefox
  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  )

  // For Firefox it is necessary to delay revoking the ObjectURL
  setTimeout(() => {
    window.URL.revokeObjectURL(data)
    link.remove()
  }, 100)
}
