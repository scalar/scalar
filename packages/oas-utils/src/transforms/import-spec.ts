import { createCollection } from '@/entities/workspace/collection'
import { type Folder, createFolder } from '@/entities/workspace/folder'
import { createServer } from '@/entities/workspace/server'
import { type Request, createRequest } from '@/entities/workspace/spec'
import { tagObjectSchema } from '@/entities/workspace/spec/spec'
import type { RequestMethod } from '@/helpers'
import { parseJsonOrYaml } from '@/helpers/parse'
import { schemaModel } from '@/helpers/schema-model'
import type { AnyObject } from '@/types'
import { dereference, load } from '@scalar/openapi-parser'
import type { OpenAPIV3_1 } from 'openapi-types'

const PARAM_DICTIONARY = {
  cookie: 'cookies',
  header: 'headers',
  path: 'path',
  query: 'query',
} as const

/** Import an OpenAPI spec file and convert it to workspace entities */
export const importSpecToWorkspace = async (spec: string | AnyObject) => {
  const importWarnings: string[] = []
  const requests: Request[] = []
  const parsedSpec = parseJsonOrYaml(spec) as OpenAPIV3_1.Document

  // TODO: `parsedSpec` can have circular reference and will break.
  // We always have to use the original document.
  const { filesystem } = await load(parsedSpec)
  const { schema, errors } = await dereference(filesystem)

  if (errors?.length || !schema) {
    console.warn(
      'Please open an issue on https://github.com/scalar/scalar\n',
      'Scalar OpenAPI Parser Warning:\n',
      errors,
    )
  }

  // Keep a list of all tags used in requests so we can reference them later
  const requestTags: Set<string> = new Set()

  Object.entries(schema?.paths || {}).forEach(([pathString, path]) => {
    if (!path) return

    const methods = [
      'get',
      'put',
      'post',
      'delete',
      'options',
      'head',
      'patch',
      'trace',
    ] as const

    methods.forEach((method) => {
      const operation = path[method]
      if (!operation) return

      if ('$ref' in operation) {
        importWarnings.push(
          `${method.toUpperCase}:${pathString} - Importing of $ref paths is not yet supported`,
        )
        return
      }

      const parameters: Request['parameters'] = {
        path: {},
        query: {},
        headers: {},
        cookies: {},
      }

      // Loop over params to set request params
      operation.parameters?.forEach((_param: any) => {
        const param = _param

        if (
          'name' in param &&
          PARAM_DICTIONARY[param.in as keyof typeof PARAM_DICTIONARY]
        ) {
          parameters[
            // Map cookie -> and header -> headers
            PARAM_DICTIONARY[param.in as keyof typeof PARAM_DICTIONARY]
          ][param.name] = param
        }
      })

      const request = createRequest({
        method: method.toUpperCase() as RequestMethod,
        path: pathString,
        tags: operation.tags || ['default'],
        description: operation.description,
        operationId: operation.operationId,
        summary: operation.summary,
        externalDocs: operation.externalDocs,
        requestBody: operation.requestBody,
        parameters,
      })

      request.tags.forEach((t) => requestTags.add(t))
      requests.push(request)
    })
  })

  const tags = schemaModel(schema?.tags, tagObjectSchema.array())

  // If there are request tags that are only defined in
  requestTags.forEach((requestTag) => {
    if (!tags.some((tag) => tag.name === requestTag)) {
      // Warn the user about implicit tags
      importWarnings.push(
        `The tag *${requestTags}* is does not have an explicit tag object in the specification file. `,
      )

      tags.push({ name: requestTag })
    }
  })

  // TODO: Consider if we want this for production or just for data mocking
  // Create a basic folder structure from tags
  const folders: Folder[] = []
  tags.forEach((t) => {
    const folder = createFolder({
      ...t,
      childUids: requests
        .filter((r) => r.tags.includes(t.name))
        .map((r) => r.uid),
    })

    folders.push(folder)
  })

  // Toss in a default server if there aren't any
  const unparsedServers = parsedSpec.servers?.length
    ? parsedSpec.servers!
    : [
        {
          url: 'http://localhost',
          description: 'Replace with your API server',
        },
      ]
  const servers = unparsedServers.map((server) => createServer(server))

  const collection = createCollection({
    spec: {
      openapi: parsedSpec.openapi,
      info: schema?.info,
      externalDocs: schema?.externalDocs,
      serverUids: servers.map(({ uid }) => uid),
      tags,
    },
    selectedServerUid: servers[0].uid,
    // We default to having all the requests in the root folder
    childUids: folders.map(({ uid }) => uid),
  })

  const components = schema?.components

  return {
    tags,
    folders,
    servers,
    requests,
    collection,
    components,
  }
}
