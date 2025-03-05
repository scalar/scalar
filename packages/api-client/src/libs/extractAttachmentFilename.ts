const decodeURIComponentSafe = (str: string) => {
  try {
    return decodeURIComponent(str)
  } catch {
    return str
  }
}

/**
 * Extract the filename from a content disposition header
 */
export function extractFilename(contentDisposition: string) {
  let filename = ''

  if (contentDisposition) {
    const fileNameMatch =
      contentDisposition.match(/filename\*=UTF-8''([^;]+)/)?.[1] ??
      contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/)?.[1]

    if (fileNameMatch) {
      // Decode filename
      filename = decodeURIComponentSafe(fileNameMatch.trim())
    }
  }

  return filename
}
