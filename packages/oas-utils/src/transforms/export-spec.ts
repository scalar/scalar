import {
  type Collection,
  type Request,
  type RequestExample,
  type SecurityScheme,
  type Tag,
  convertExampleToXScalar,
  oasCollectionSchema,
  oasRequestSchema,
  oasSecuritySchemeSchema,
  oasTagSchema,
} from '@/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/types'

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

/**
 * Convert a workspace collection into an OpenAPI document
 */
export function exportSpecFromWorkspace({
  collection,
  requests,
  requestExamples,
  tags,
  securitySchemes,
}: {
  collection: Collection
  requests: Record<string, Request>
  requestExamples: Record<string, RequestExample>
  tags: Record<string, Tag>
  securitySchemes: Record<string, SecurityScheme>
}) {
  const parsedCollection = oasCollectionSchema.parse(collection)
  const spec: WithRequired<
    OpenAPIV3_1.Document,
    'paths' | 'tags' | 'components'
  > = {
    ...parsedCollection,
    openapi: parsedCollection.openapi as '3.1.0',
    tags: [],
    paths: {},
    webhooks: {},
    components: {
      securitySchemes: {},
    },
  }

  /** Add all of the tags into the collection */
  Object.values(tags).forEach((tag) => {
    const oasTag = oasTagSchema.parse(tag)
    if (!oasTag['x-scalar-children']?.length) delete oasTag['x-scalar-children']

    spec.tags.push(oasTag)
  })

  /** Add all of the requests into the collection as operations */
  Object.values(requests).forEach((request) => {
    const oasRequest = oasRequestSchema.parse(request)

    // Currently the request has tags added by name. Should this move to UID association?
    oasRequest.tags = request.tags

    // If the request has examples we add them all as extensions
    const exampleNames = new Set<string>()

    /** Increment non-unique names */
    function checkName(name: string) {
      if (exampleNames.has(name)) {
        const base = name.split(' ')
        const end = Number.parseInt(base.at(-1) ?? 'NaN', 10)
        if (Number.isNaN(end)) {
          base.push('1')
        } else {
          base[base.length - 1] = `${end + 1}`
        }
        return checkName(base.join(' '))
      }

      exampleNames.add(name)
      return name
    }

    // TODO: Fix export of request examples
    // We should probably rename them, to avoid confusion with x-codeSamples (custom code examples, e.g. for SDKs)

    // if (request.examples.length) {
    //   oasRequest['x-scalar-examples'] = {}
    //   request.examples.forEach((uid) => {
    //     const requestExample = requestExamples[uid]
    //     oasRequest['x-scalar-examples']![checkName(requestExample.name)] =
    //       convertExampleToXScalar(requestExample)
    //   })
    // }

    /** Insert the request as an operation in the spec */
    if (!spec.paths[request.path]) spec.paths[request.path] = {}
    spec.paths[request.path]![request.method] = oasRequest
  })

  /** Add all of the security schemes into the collection */
  Object.values(securitySchemes).forEach((securityScheme) => {
    const oasScheme = oasSecuritySchemeSchema.parse(securityScheme)

    spec.components.securitySchemes![securityScheme.nameKey] = oasScheme
  })

  return spec
}
