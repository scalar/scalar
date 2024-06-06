import {
  type Collection,
  type CollectionFolder,
  defaultCollectionFolder,
} from '@/entities/workspace/collection'
import type { Nanoid } from '@/entities/workspace/shared'
import { type RequestRef, createRequest } from '@/entities/workspace/spec'
import { tagObjectSchema } from '@/entities/workspace/spec/spec'
import { parseJsonOrYaml } from '@/helpers/parse'
import { schemaModel } from '@/helpers/schema-model'
import { openapi } from '@scalar/openapi-parser'
import { nanoid } from 'nanoid'
import type { OpenAPIV3_1 } from 'openapi-types'

const PARAM_DICTIONARY = {
  cookie: 'cookies',
  header: 'headers',
  path: 'path',
  query: 'query',
} as const

/** Import an OpenAPI spec file and convert it to workspace entities */
export async function importSpecToWorkspace(spec: string) {
  const importWarnings: string[] = []

  const requests: Record<string, RequestRef> = {}
  const parsedSpec = parseJsonOrYaml(spec) as OpenAPIV3_1.Document

  const { schema, errors } = await openapi().load(parsedSpec).resolve()
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

      const parameters: RequestRef['parameters'] = {
        path: {},
        query: {},
        headers: {},
        cookies: {},
      }

      // Loop over params to set request params
      operation.parameters?.forEach((_param: any) => {
        const param = _param

        // Fetch ref
        if ('$ref' in _param) {
          const refPath = _param.$ref.replace(/^#\//g, '').replace(/\//g, '.')
          console.log({ refPath })
          // TODO for some reason this hangs
          // param = getNestedValue(parsedSpec, refPath)
          importWarnings.push(
            `${pathString} - Importing of $ref paths is not yet supported`,
          )
        }

        if ('name' in param) {
          parameters[
            // Map cookie -> and header -> headers
            PARAM_DICTIONARY[param.in as keyof typeof PARAM_DICTIONARY]
          ][param.name] = param
        }
      })

      const request = createRequest({
        method: method.toUpperCase(),
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
      requests[request.uid] = request
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
  const folders: Record<Nanoid, CollectionFolder> = {}
  tags.forEach((t) => {
    const folder = defaultCollectionFolder({
      ...t,
      children: Object.values(requests)
        .filter((r) => r.tags.includes(t.name))
        .map((r) => r.uid),
    })

    folders[folder.uid] = folder
  })

  const collection: Collection = {
    uid: nanoid(),
    requests: Object.keys(requests),
    spec: {
      openapi: parsedSpec.openapi,
      info: schema?.info,
      externalDocs: schema?.externalDocs,
      servers: parsedSpec.servers,
      tags,
    },
    folders,
    // We default to having all the requests in the root folder
    children: Object.keys(folders),
  }

  const components = schema?.components

  return {
    tags,
    requests,
    collection,
    components,
  }
}
