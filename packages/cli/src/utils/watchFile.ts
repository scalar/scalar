import watcher from '@parcel/watcher'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Watch a foobar for changes and call a callback when it does.
 */
export async function watchFile(
  file: string,
  callback: () => void,
  options?: { immediate?: boolean },
) {
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
  await watcher.subscribe(directory, (err, events) => {
    // Match the file path
    if (events.some((event) => event.path === absoluteFilePath)) {
      callback()
    }
  })

  // Call the callback immediately
  if (options?.immediate) {
    callback()
  }
}
