import { extractFilename } from '@/libs/extractAttachmentFilename'
import { computed, isRef } from 'vue'
import MimeType from 'whatwg-mimetype'
import type { Ref } from 'vue'

/**
 * Processes the response body of an HTTP request.
 * Extracts MIME type, attachment filename, and generates a data URL.
 */
export function useResponseBody(props: {
  data: Ref<unknown>
  headers: Ref<{ name: string; value: string; required: boolean }[]>
}) {
  const isBlob = (b: any): b is Blob => b instanceof Blob

  // Handle both Ref and direct values
  const dataRef = computed(() => (isRef(props.data) ? props.data.value : props.data))
  const headersRef = computed(() => (isRef(props.headers) ? props.headers.value : props.headers))

  const mimeType = computed(() => {
    const contentType = headersRef.value.find((header) => header.name.toLowerCase() === 'content-type')?.value ?? ''
    return new MimeType(contentType)
  })

  const attachmentFilename = computed(() => {
    const value = headersRef.value.find((header) => header.name.toLowerCase() === 'content-disposition')?.value ?? ''
    return extractFilename(value)
  })

  const dataUrl = computed<string>(() => {
    if (isBlob(dataRef.value)) {
      return URL.createObjectURL(dataRef.value)
    }
    if (typeof dataRef.value === 'string') {
      return URL.createObjectURL(new Blob([dataRef.value], { type: mimeType.value.toString() }))
    }
    if (dataRef.value instanceof Object && Object.keys(dataRef.value).length) {
      return URL.createObjectURL(
        new Blob([JSON.stringify(dataRef.value)], {
          type: mimeType.value.toString(),
        }),
      )
    }
    return ''
  })

  return { mimeType, attachmentFilename, dataUrl }
}
