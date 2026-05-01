import net from 'node:net'

import { Command } from 'commander'
import concurrently from 'concurrently'

/** Run domain used for composing pnpm commands */
export const run = new Command('run').description('Run a command')

/** Checks whether a TCP port is already accepting connections. */
const isPortListening = (port: number): Promise<boolean> =>
  new Promise((resolve) => {
    const socket = net.createConnection({ port, host: '127.0.0.1' })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
  })

run.addCommand(
  new Command('test-servers').description('Run the test servers').action(async () => {
    const [voidRunning, proxyRunning] = await Promise.all([isPortListening(5052), isPortListening(5051)])

    const servers = []

    if (!voidRunning) {
      servers.push({
        command: 'cross-env CI=1 pnpm --filter @scalar/void-server dev',
        name: 'void-server',
        prefixColor: 'blue',
      })
    } else {
      console.log('[test-servers] void-server already running on port 5052, skipping')
    }

    if (!proxyRunning) {
      servers.push({
        command: 'cross-env CI=1 pnpm --filter proxy-scalar-com dev',
        name: 'proxy-server',
        prefixColor: 'cyan',
      })
    } else {
      console.log('[test-servers] proxy-server already running on port 5051, skipping')
    }

    if (servers.length === 0) {
      console.log('[test-servers] All servers already running')
      return
    }

    const { result } = concurrently(servers)

    await result.catch(() => null)
  }),
)
