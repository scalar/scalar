import { watch } from 'fs'
import fs from 'node:fs'
import path from 'node:path'

import { isUrl } from './isUrl'

/**
 * Watch a foobar for changes and call a callback when it does.
 */
export async function watchFile(
  file: string,
  callback: () => void,
  options?: { immediate?: boolean },
) {
  // Poll URLs
  if (isUrl(file)) {
    setInterval(callback, 5000)
    return
  }

  const absoluteFilePath = path.join(process.cwd(), file)

  // Check if file exists
  if (!fs.existsSync(absoluteFilePath)) {
    throw new Error(`File ${absoluteFilePath} does not exist`)
  }

  // Watch the file for changes
  console.log(`[INFO] Watch ${file}`)

  // Get path where the file is located
  const directory = path.dirname(absoluteFilePath)

  // Start the watcher
  watch(directory, (event, filename) => {
    console.log(`Detected ${event} in ${filename}`)
    callback()
  })

  // Call the callback immediately
  if (options?.immediate) {
    callback()
  }
}
