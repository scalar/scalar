import fs from 'node:fs'

import { downloadFile } from '../tests/utils/downloadFileGcp'

/**
 * Loads necessary files from the test-specifications bucket
 * and initializes the filesystem for testing
 */
const bucketName = 'test-specifications'

console.log('Loading files and initializing openapi-parser test environment')

console.log()

console.log('Creating src/utils/examples folder')
const exampleDir = './src/utils/examples'
if (!fs.existsSync(exampleDir)) {
  fs.mkdirSync(exampleDir, { recursive: true })
}

console.log('Downloading example openapi.yaml spec')
await downloadFile(bucketName, 'openapi.yaml', `${exampleDir}/openapi.yaml`)

console.log()

console.log('Creating folder /tests/openapi3-examples/3.0/resources')
const resourcesDir = './tests/openapi3-examples/3.0/resources'
if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true })
}

console.log('Creating filesystem test environment folder structure and files')
const filesystemDirs = './tests/filesystem/api/schemas/components'
if (!fs.existsSync(filesystemDirs)) {
  fs.mkdirSync(filesystemDirs, { recursive: true })
}

console.log()
console.log('Test environment set up finished')
console.log()
