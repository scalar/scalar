import { promises as fs } from 'node:fs'
import path from 'node:path'

/**
 * Copy standalone.js file from the API reference package to the local dist directory
 */
async function copyStandaloneFile(): Promise<void> {
  try {
    const targetDir = './dist/js'
    const sourcePath = '../../packages/api-reference/dist/browser/standalone.js'
    const targetPath = path.join(targetDir, 'standalone.js')

    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true })

    // Copy the file
    await fs.copyFile(sourcePath, targetPath)

    console.log(`✅ Successfully copied standalone.js to ${targetDir}`)
  } catch (error) {
    console.error('❌ Error copying standalone file:', error)
    process.exit(1)
  }
}

// Execute the function
copyStandaloneFile()
