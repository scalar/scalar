/**
 * Triggers a file download in the browser for the given content.
 * Creates a blob, programmatically clicks a temporary link, then revokes the object URL.
 *
 * @param content - The string content to download (e.g. JSON or YAML).
 * @param filename - The name of the file to save (e.g. "my-api.json").
 * @param mimeType - Optional MIME type for the blob. Defaults to "application/json".
 */
export function downloadAsFile(content: string, filename: string, mimeType = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  link.setAttribute('aria-hidden', 'true')
  document.body.appendChild(link)

  // This is necessary as link.click() does not work on the latest Firefox.
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))

  // For Firefox it is necessary to delay revoking the ObjectURL.
  setTimeout(() => {
    URL.revokeObjectURL(url)
    document.body.removeChild(link)
  }, 100)
}
