import { spawn } from 'node:child_process'

import { Command } from 'commander'

const getForwardedArgs = (): string[] => {
  const commandIndex = process.argv.indexOf('release-notes-generator')
  return commandIndex === -1 ? [] : process.argv.slice(commandIndex + 1)
}

const runPackageCli = async (args: readonly string[]): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn('pnpm', ['--filter', '@scalar/release-notes', 'start', ...args], {
      cwd: process.env.INIT_CWD ?? process.cwd(),
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`@scalar/release-notes exited with code ${String(code)}`))
    })
  })
}

export const releaseNotesGenerator = new Command('release-notes-generator')
  .description('Forward to the publishable @scalar/release-notes CLI.')
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .action(async () => {
    await runPackageCli(getForwardedArgs())
  })
