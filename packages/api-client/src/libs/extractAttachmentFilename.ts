const decodeURIComponentSafe = (str: string) => {
  try {
    return decodeURIComponent(str)
  } catch (e) {
    return str
  }
}

/**
 * Extract the filename from a content disposition header
 */
export function extractFilename(contentDisposition: string) {
  let filename = ''

  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/)

    if (typeof fileNameMatch?.[1] === 'string') {
      // Decode filename
      filename = decodeURIComponentSafe(fileNameMatch[1].trim())
    }
  }

  return filename
}
