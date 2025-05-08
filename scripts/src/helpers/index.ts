import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'
import fs from 'node:fs'
import as from 'ansis'

/** Returns the monorepo root directory path */
export function getWorkspaceRoot() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  // Use relative path to root and then resolve
  return path.resolve(`${__dirname}/../../..`)
}

export async function runCommand(command: string, logFilename?: string) {
  const output = logFilename ? fs.createWriteStream(logFilename) : null

  return new Promise((resolve, reject) => {
    const comm = exec(command)

    comm.stdout?.pipe(output || process.stdout)
    comm.stderr?.pipe(output || process.stderr)

    comm.on('error', (err) => {
      as.redBright(err.message)
      reject(false)
    })
    comm.on('close', (code) => (code === 0 ? resolve(true) : reject(false)))
  }).finally(() => output?.close())
}
