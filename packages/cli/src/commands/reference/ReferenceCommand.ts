import { serve } from '@hono/node-server'
import { Command } from 'commander'
import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import kleur from 'kleur'

import {
  getHtmlDocument,
  loadOpenApiFile,
  useGivenFileOrConfiguration,
  watchFile,
} from '../../utils'
import { printSpecificationBanner } from '../../utils/printSpecificationBanner'

export function ReferenceCommand() {
  const cmd = new Command('reference')

  cmd.description('Serve an API Reference from an OpenAPI file')
  cmd.argument('[file|url]', 'OpenAPI file or URL to show the reference for')
  cmd.option('-w, --watch', 'watch the file for changes')
  cmd.option(
    '-p, --port <port>',
    'set the HTTP port for the API reference server',
  )
  cmd.action(
    async (
      inputArgument: string,
      { watch, port }: { watch?: boolean; port?: number },
    ) => {
      const input = useGivenFileOrConfiguration(inputArgument)
      const result = await loadOpenApiFile(input)

      if (!result.valid) {
        return
      }

      let { specification } = result

      printSpecificationBanner({
        version: result.version,
        schema: result.schema,
      })

      if (
        specification?.paths === undefined ||
        Object.keys(specification?.paths).length === 0
      ) {
        console.log(
          kleur.bold().yellow('[WARN]'),
          kleur.grey('Couldn’t find any paths in the OpenAPI file.'),
        )
      }

      const app = new Hono()

      app.get('/', (c) => {
        return c.html(getHtmlDocument(specification, watch))
      })

      app.use('/__watcher', async (c, next) => {
        c.header('Content-Type', 'text/event-stream')
        c.header('Cache-Control', 'no-cache')
        c.header('Connection', 'keep-alive')
        await next()
      })

      app.get('/__watcher', (c) => {
        return stream(c, async (s) => {
          // watch file for changes
          if (watch) {
            watchFile(input, async () => {
              const newResult = await loadOpenApiFile(input)
              const specificationHasChanged =
                newResult?.specification &&
                JSON.stringify(specification) !==
                  JSON.stringify(newResult.specification)

              if (specificationHasChanged) {
                console.log(
                  kleur.bold().white('[INFO]'),
                  kleur.grey('OpenAPI file modified'),
                )

                printSpecificationBanner({
                  version: newResult.version,
                  schema: newResult.schema,
                })

                specification = newResult.specification

                s.write('data: file modified\n\n')
              }
            })
          }

          // eslint-disable-next-line no-constant-condition
          while (true) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        })
      })

      serve(
        {
          fetch: app.fetch,
          port: port ?? 3000,
        },
        (info) => {
          console.log(
            `${kleur.bold().green('➜ API Reference Server')} ${kleur.white(
              'listening on',
            )} ${kleur.cyan(`http://localhost:${info.port}`)}`,
          )
          console.log()
        },
      )
    },
  )

  return cmd
}
