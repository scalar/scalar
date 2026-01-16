import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { ExampleObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Build the table rows for the form data */
export const getFormBodyRows = (example: ExampleObject | undefined | null, contentType: string) => {
  // We only need the rows for formData
  if (
    !example?.value ||
    (contentType !== 'multipart/form-data' && contentType !== 'application/x-www-form-urlencoded')
  ) {
    return []
  }

  // We have form data stored as an array
  if (Array.isArray(example.value)) {
    return example.value as {
      name: string
      value: string
      isDisabled: boolean
    }[]
  }

  // We got an object try to convert it to an array of rows
  if (typeof example.value === 'object' && example.value) {
    return objectEntries(example.value).map(([key, value]) => ({
      name: String(key),
      value,
      isDisabled: false,
    }))
  }

  return []
}
