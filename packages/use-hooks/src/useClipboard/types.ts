export type UseClipboardOptions = {
  /**
   * A function that will be called when the text is copied to the clipboard
   */
  notify?: (message: string) => void
}
