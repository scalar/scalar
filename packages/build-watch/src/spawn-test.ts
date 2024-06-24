import { spawn } from 'child_process'

import { prefixStream, printHeader } from './print'

/** State to track active package builds */
const activeCommands: Partial<
  Record<
    string,
    {
      result?: Promise<void>
      kill?: () => Promise<void>
    } | null
  >
> = {}

async function runCommand(
  packageName: string,
  signal: AbortSignal | undefined,
) {
  printHeader('brightWhite', `Building ${packageName}`)

  // Wait for the previous process to exit or complete
  if (activeCommands[packageName]?.result)
    await activeCommands[packageName]?.result?.then(() =>
      printHeader('brightGreen', `Awaited ${packageName} to finish`),
    )

  activeCommands[packageName] = {}

  const result = new Promise<void>((resolve, reject) => {
    const command = spawn('pnpm', ['--filter', '@scalar/components', 'build'], {
      signal,
      //   detached: true,
    })

    command.stdout?.on('data', prefixStream(packageName))
    command.stderr?.on('data', prefixStream(packageName))

    command.on('error', (e) => {
      console.log(e.message)
    })
    command.on('close', () => {
      //   command.stdout.removeAllListeners()
      //   command.stderr.removeAllListeners()
      //   command.removeAllListeners()

      activeCommands[packageName] = null

      console.log('CLOSED')
      resolve()
    })
  }).catch((e) => {
    console.log(e.message)
    printHeader('red', `Error: Process Exited ${packageName}`)
  })

  activeCommands[packageName]!.result = result

  return result
    .then(() => {
      printHeader('green', `Package ${packageName} build completed`)
    })
    .catch((e) => {
      console.log(e.message)
    })
}

async function test() {
  const controller = new AbortController()
  runCommand('test', controller.signal)

  if (Math.random() > 0.4) {
    const seconds = Math.random() * 4000

    setTimeout(async () => {
      printHeader('yellow', `ABORTING PROCESS -------- ${seconds}ms`)
      //   activeCommands['test']?.kill?.()
      controller.abort()
      await activeCommands['test']?.result

      test()
    }, seconds)
  } else {
    printHeader('blue', 'COMPLETING PROCESS')

    await activeCommands['test']?.result
    test()
  }
}

test()

export {}
