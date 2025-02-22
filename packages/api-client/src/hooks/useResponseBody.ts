import { extractFilename } from '@/libs/extractAttachmentFilename'
import { computed } from 'vue'
import MimeType from 'whatwg-mimetype'

/**
 * Processes the response body of an HTTP request.
 * Extracts MIME type, attachment filename, and generates a data URL.
 */
export function useResponseBody(props: {
  data: unknown
  headers: { name: string; value: string; required: boolean }[]
}) {
  const isBlob = (b: any): b is Blob => b instanceof Blob

  const mimeType = computed(() => {
    const contentType = props.headers.find((header) => header.name.toLowerCase() === 'content-type')?.value ?? ''
    return new MimeType(contentType)
  })

  const attachmentFilename = computed(() => {
    const value = props.headers.find((header) => header.name.toLowerCase() === 'content-disposition')?.value ?? ''
    return extractFilename(value)
  })

  const dataUrl = computed<string>(() => {
    if (isBlob(props.data)) return URL.createObjectURL(props.data)
    if (typeof props.data === 'string')
      return URL.createObjectURL(new Blob([props.data], { type: mimeType.value.toString() }))
    if (props.data instanceof Object && Object.keys(props.data).length)
      return URL.createObjectURL(
        new Blob([JSON.stringify(props.data)], {
          type: mimeType.value.toString(),
        }),
      )
    return ''
  })

  return { mimeType, attachmentFilename, dataUrl }
}
