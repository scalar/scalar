import { serve } from '@hono/node-server'
import { createVoidServer } from '@scalar/void-server'
import { Command } from 'commander'
import kleur from 'kleur'

export function VoidCommand() {
  const cmd = new Command('void')

  cmd.description('Boot a server to mirror HTTP requests')
  cmd.option('-o, --once', 'run the server only once and exit after that')
  cmd.option('-p, --port <port>', 'set the HTTP port for the mock server')
  cmd.action(
    async ({
      once,
      port,
    }: {
      watch?: boolean
      once?: boolean
      port?: number
    }) => {
      // Server instance
      let server: ReturnType<typeof serve> = null

      // Listen for requests
      server = await bootServer({
        port,
      })

      // Exit after the first run
      if (once) {
        setTimeout(() => {
          server.close()
        }, 2000)
      }
    },
  )

  return cmd
}

async function bootServer({ port }: { port?: number }) {
  const app = await createVoidServer()

  return serve(
    {
      fetch: app.fetch,
      port: port ?? 3000,
    },
    (info) => {
      console.log(
        `${kleur.bold().green('➜ Void Server')} ${kleur.white(
          'listening on',
        )} ${kleur.cyan(`http://localhost:${info.port}`)}`,
      )
      console.log()
    },
  )
}
