const decodeURIComponentSafe = (str: string) => {
  try {
    return decodeURIComponent(str)
  } catch (e) {
    return str
  }
}

export function extractFilename(contentDisposition: string) {
  let filename = ''

  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(
      /filename\s*=\s*"?([^";]+)"?/,
    )

    if (fileNameMatch && fileNameMatch.length === 2) {
      // Decode filename
      filename = decodeURIComponentSafe(fileNameMatch[1].trim())
    }
  }

  return filename
}
