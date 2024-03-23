import { serve } from '@hono/node-server'
import { createMockServer } from '@scalar/mock-server'
import { Command } from 'commander'
import type { Context } from 'hono'
import kleur from 'kleur'
import type { OpenAPI } from 'openapi-types'

import {
  getMethodColor,
  loadOpenApiFile,
  useGivenFileOrConfiguration,
  watchFile,
} from '../../utils'
import { printSpecificationBanner } from '../../utils/printSpecificationBanner'

export function MockCommand() {
  const cmd = new Command('mock')

  cmd.description('Mock an API from an OpenAPI file')
  cmd.argument('[file|url]', 'OpenAPI file or URL to mock the server for')
  cmd.option('-w, --watch', 'watch the file for changes')
  cmd.option('-p, --port <port>', 'set the HTTP port for the mock server')
  cmd.action(
    async (
      fileArgument: string,
      { watch, port }: { watch?: boolean; port?: number },
    ) => {
      // Server instance
      let server: ReturnType<typeof serve> = null

      // Configuration
      const input = useGivenFileOrConfiguration(fileArgument)

      // Load OpenAPI file
      const result = await loadOpenApiFile(input)

      if (!result.valid) {
        console.warn(
          kleur.bold().red('[ERROR]'),
          kleur.red('Invalid OpenAPI specification'),
        )

        return
      }

      printSpecificationBanner({
        version: result.version,
        schema: result.schema,
      })

      let { specification } = result

      // Watch OpenAPI file for changes
      if (watch) {
        await watchFile(input, async () => {
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

            // Update mock server
            server.close()
            server = await bootServer({
              specification,
              port,
            })
          }
        })
      }

      // Show all paths from the specification
      printAvailablePaths(specification)

      // Listen for requests
      server = await bootServer({
        specification,
        port,
      })
    },
  )

  return cmd
}

async function bootServer({
  specification,
  port,
}: {
  specification: OpenAPI.Document
  port?: number
}) {
  const app = await createMockServer({
    specification,
    onRequest,
  })

  return serve(
    {
      fetch: app.fetch,
      port: port ?? 3000,
    },
    (info) => {
      console.log(
        `${kleur.bold().green('➜ Mock Server')} ${kleur.white(
          'listening on',
        )} ${kleur.cyan(`http://localhost:${info.port}`)}`,
      )
      console.log()
    },
  )
}

function printAvailablePaths(specification: OpenAPI.Document) {
  console.log(kleur.bold().white('Available Paths'))
  console.log()

  if (
    specification?.paths === undefined ||
    Object.keys(specification?.paths).length === 0
  ) {
    console.log(
      kleur.bold().yellow('[WARN]'),
      kleur.grey('Couldn’t find any paths in the OpenAPI file.'),
    )
  }

  // loop through all paths
  for (const path in specification?.paths ?? []) {
    // loop through all methods
    for (const method in specification.paths?.[path]) {
      console.log(
        `${kleur
          .bold()
          [
            getMethodColor(method)
          ](method.toUpperCase().padEnd(6))} ${kleur.grey(`${path}`)}`,
      )
    }
  }

  console.log()
}

function onRequest({
  context,
  operation,
}: {
  context: Context
  operation: OpenAPI.Operation
}) {
  const { method } = context.req
  console.log(
    `${kleur
      .bold()
      [
        getMethodColor(method)
      ](method.toUpperCase().padEnd(6))} ${kleur.grey(`${context.req.path}`)}`,
    `${kleur.grey('→')} ${
      operation?.operationId
        ? kleur.white(operation.operationId)
        : kleur.red('[ERROR] 404 Not Found')
    }`,
  )
}
