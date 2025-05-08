import as from 'ansis'
import { Command } from 'commander'

export const wait = new Command('wait')
  .requiredOption('-p, --ports <ports...>', 'The ports to wait for a response on')
  .description('Wait for services to start')
  .action(async ({ ports }) => {
    await waitForService(ports.map((p) => Number.parseInt(p, 10)))
  })

// ---------------------------------------------------------------------------

const log = (message: string) => console.log(`[script:wait]: ${message}`)

const MAX_WAIT_TIME = 30000

async function ping(port: number): Promise<boolean> {
  log(as.yellow(`pinging ${as.bold(port)}...`))

  const ok = await fetch(`http://localhost:${port}`)
    .then((res) => res.ok)
    .catch(() => false)

  return ok ? true : await new Promise((resolve) => setTimeout(() => resolve(ping(port)), 1000))
}

export async function waitForService(ports: number[]) {
  log(as.green(`Waiting for ${as.bold(ports.join(', '))} to start...`))

  const success = await Promise.race([
    new Promise((resolve) => {
      setTimeout(() => resolve(false), MAX_WAIT_TIME)
    }),
    Promise.all(ports.map((p) => ping(p))),
  ])

  if (!success) {
    log(as.red(`Failure: ${as.bold(ports.join(', '))} did not start in time`))
    process.exit(1)
  } else {
    log(as.green(`Success: ${as.bold(ports.join(', '))} started`))
    process.exit(0)
  }
}
