import { isJsonString } from '@scalar/oas-utils'
import { type EventBusKey, useEventBus } from '@vueuse/core'

const downloadSpecEventBusKey: EventBusKey<{ id: string; specTitle?: string }> =
  Symbol('downloadSpec')
export const downloadSpecBus = useEventBus(downloadSpecEventBusKey)

/** Download the OAS file string */
export function downloadSpecFile(spec: string, specTitle?: string) {
  const isJson = isJsonString(spec)

  const blob = isJson
    ? new Blob([spec], { type: 'application/json' })
    : new Blob([spec], { type: 'application/x-yaml' })

  const data = URL.createObjectURL(blob)
  const fileExtension = isJson ? '.json' : '.yaml'

  // Default filename based on the file type
  const defaultFilename = 'spec' + fileExtension

  // Spec title as filename or default
  const specFilename = specTitle ? specTitle + fileExtension : defaultFilename

  const link = document.createElement('a')
  link.href = data
  link.download = specFilename
  // this is necessary as link.click() does not work on the latest firefox
  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  )

  setTimeout(() => {
    // For Firefox it is necessary to delay revoking the ObjectURL
    window.URL.revokeObjectURL(data)
    link.remove()
  }, 100)
}
