import {
  type OpenAPIV3_1,
  type ResolvedOpenAPI,
  type ResolvedOpenAPIV2,
  type ResolvedOpenAPIV3,
  type ResolvedOpenAPIV3_1,
  openapi,
} from '@scalar/openapi-parser'

import {
  type Operation,
  type RemoveUndefined,
  type RequestMethod,
  type Spec,
  type Tag,
  objectKeys,
  validRequestMethods,
} from '../types'

// TODO: docstring
// TODO: does this need to be a promise?
export const scalarParse = (specification: any): Promise<Spec> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const result = await openapi().load(specification).resolve()

      if (result.schema === undefined) {
        throw 'Failed to parse the OpenAPI file.'
      }

      if (result.errors?.length) {
        console.warn(
          'Please open an issue on https://github.com/scalar/scalar\n',
          'Scalar OpenAPI Parser Warning:\n',
          result.errors,
        )
      }

      const schema: ResolvedOpenAPI.Document = result.schema
      resolve(transformResult(structuredClone(schema)))
    } catch (error) {
      reject(error)
    }
  })
}

/** Transform a resolved OpenAPI spec from the OpenAPI Parser for better rendering */
export const transformResult = <TSpec extends ResolvedOpenAPI.Document>(
  schema: TSpec,
): Spec => {
  // Validate or instantiate required properties (tags, paths, webhooks)
  const scalarSchema = addSchemaProperties(schema)

  /** transform the paths, also updates the above scoped scalarSchema tags  */
  function transformPath(
    requestMethod: string,
    path: string,
    operation: Operation,
  ) {
    // Transform the operation
    const newOperation = {
      httpVerb: requestMethod,
      path,
      operationId: operation.operationId || path,
      name: operation.summary || path || '',
      description: operation.description || '',
      information: {
        ...operation,
      },
      pathParameters: scalarSchema.paths?.[path]?.parameters,
    }

    // If the operation has no tags, add operation to the default tag
    if (!operation.tags || operation.tags.length === 0) {
      // Create the default tag.

      // find the index of the default tag
      const indexOfDefaultTag = scalarSchema.tags.findIndex(
        (tag) => tag.name === 'default',
      )

      // Add the new operation to the default tag.

      if (indexOfDefaultTag >= 0) {
        // Add the new operation to the default tag.
        scalarSchema.tags[indexOfDefaultTag].operations.push(newOperation)
      }
    }
    // If the operation has tags, loop through them.
    else {
      operation.tags.forEach((operationTag: string) => {
        // Try to find the tag in the schema
        const indexOfExistingTag = scalarSchema.tags.findIndex(
          (tag) => tag.name === operationTag,
        )

        // Create tag if it doesn’t exist yet
        if (indexOfExistingTag === -1) {
          scalarSchema.tags.push({
            name: operationTag,
            description: '',
          })
        }

        // Decide where to store the new operation
        const tagIndex =
          indexOfExistingTag !== -1
            ? indexOfExistingTag
            : scalarSchema.tags.length - 1

        // Create operations array if it doesn’t exist yet
        if (typeof scalarSchema.tags[tagIndex].operations === 'undefined') {
          scalarSchema.tags[tagIndex].operations = []
        }
        // Add the new operation
        scalarSchema.tags[tagIndex].operations.push(newOperation)
      })
    }

    return newOperation
  }

  /** Transform request methods, operations, tags */
  Object.keys(scalarSchema.paths).forEach((path: string) => {
    // for each path, format operation data and add operations to tags
    objectKeys(scalarSchema.paths[path]).forEach((requestMethod) => {
      if (
        validRequestMethods.includes(
          requestMethod.toUpperCase() as RequestMethod,
        )
      ) {
        const operation = scalarSchema.paths[path][requestMethod]

        const transformedPath = transformPath(requestMethod, path, operation)

        // TODO: path types are a little wonky
        scalarSchema.paths[path][requestMethod] = transformedPath
      }
    })
  })

  const returnedResult = {
    ...scalarSchema,
    tags: removeTagsWithoutOperations(scalarSchema),
  }
  return returnedResult
}

/** Validate or instantiate required scalar schema properties (tags, paths, webhooks) */
export const addSchemaProperties = <T extends ResolvedOpenAPI.Document>(
  schema: T,
) => {
  const newSchema = addTagsToSchema(
    addWebhooksToSchema(addPathsToSchema(schema)),
  )
  const newWebhooks = transformWebhooks(newSchema, newSchema.webhooks)

  return {
    ...newSchema,
    webhooks: newWebhooks,
  }
}

/** Returns a formatted list of Tag objects for the schema */
export const initTags = <T extends ResolvedOpenAPI.Document>(schema: T) => {
  const defaultTag = {
    name: 'default',
    description: '',
    operations: [],
  }

  // format existing tags and ensure default tag exists
  if ('tags' in schema && schema.tags !== undefined && schema.tags !== null) {
    const tags = schema.tags as Tag[]

    if (!tags.find((tag: Tag) => tag.name === 'default')) {
      tags.push(defaultTag)
    }

    tags.forEach((tag) => {
      if (!tag.operations) {
        tag.operations = []
      }
    })

    return tags
  } else return [defaultTag] as Tag[]
}

/** Add Tags to schema */
export const addTagsToSchema = <T extends ResolvedOpenAPI.Document>(
  schema: T,
) => {
  const tags = initTags(schema)
  return {
    ...schema,
    tags,
  }
}

/** Add Paths to the schema if they don’t exist and properly type them */
export const addPathsToSchema = <T extends ResolvedOpenAPI.Document>(
  schema: T,
) => {
  if (
    'paths' in schema &&
    schema.paths !== undefined &&
    schema.paths !== null
  ) {
    const paths = schema.paths as Record<
      string,
      | ResolvedOpenAPIV3_1.PathsObject
      | ResolvedOpenAPIV2.PathsObject
      | ResolvedOpenAPIV3.PathsObject
    >
    return {
      ...schema,
      paths: paths,
    }
  } else
    return {
      ...schema,
      paths: {} as Record<
        string,
        | ResolvedOpenAPIV3_1.PathsObject
        | ResolvedOpenAPIV2.PathsObject
        | ResolvedOpenAPIV3.PathsObject
      >,
    }
}

/** Add Webhooks to the schema if they don’t exist and properly type them */
export const addWebhooksToSchema = <T extends ResolvedOpenAPI.Document>(
  schema: T,
) => {
  if (
    'webhooks' in schema &&
    schema.webhooks !== undefined &&
    schema.webhooks !== null
  ) {
    const webhooks = schema.webhooks as Record<
      string,
      ResolvedOpenAPIV3_1.PathItemObject
    >

    return {
      ...schema,
      webhooks: webhooks,
    }
  } else
    return {
      ...schema,
      webhooks: {} as Record<string, ResolvedOpenAPIV3_1.PathItemObject>,
    }
}

/** Transform webhooks data - Return a new webhooks object with the transformed data */
export const transformWebhooks = <T extends ResolvedOpenAPI.Document>(
  schema: T,
  webhooks: Record<string, ResolvedOpenAPIV3_1.PathItemObject> = {},
) => {
  const newWebhooks: Record<string, any> = {}
  Object.keys(webhooks ?? {}).forEach((name) => {
    // prettier-ignore
    ;(

        Object.keys(webhooks[name] ?? {}) as OpenAPIV3_1.HttpMethods[]
      ).forEach((httpVerb) => {
        const originalWebhook =
          (webhooks?.[name] as OpenAPIV3_1.PathItemObject)[httpVerb]

        if (newWebhooks[name] === undefined) {
          newWebhooks[name] = {}
        }

        newWebhooks[name][httpVerb] = {
          // Transformed data
          httpVerb: httpVerb,
          path: name,
          operationId: originalWebhook?.operationId || name,
          name: originalWebhook?.summary || name || '',
          description: originalWebhook?.description || '',
          pathParameters: schema.paths?.[name]?.parameters,
          // Original webhook
          // TODO: This needs fixing
          information: {
            ...originalWebhook,
          },
        }

        // Object.assign(
        //   (schema).webhooks?.[name]?.[httpVerb] ?? {},
        //   {},
        // )
        // Object.assign(
        //   (schema).webhooks?.[name]?.[httpVerb] ?? {},
        //   {},
        // )
        // information: {
        //   ...(schema).webhooks?.[name],
        // },
      })
  })

  return newWebhooks
}

export const removeTagsWithoutOperations = <T extends ResolvedOpenAPI.Document>(
  schema: T,
) => {
  const tags = schema.tags as Tag[]
  return tags.filter((tag) => tag.operations?.length > 0)
}
