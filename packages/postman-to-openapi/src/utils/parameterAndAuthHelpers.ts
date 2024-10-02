/**
 * Parses authentication information for OpenAPI.
 */
export function parseAuth(
  postmanAuth: { auth?: any },
  optAuth: any,
  securitySchemes: Record<string, any>,
): Record<string, any> {
  return optAuth != null
    ? parseOptsAuth(optAuth)
    : parsePostmanAuth(postmanAuth.auth, securitySchemes)
}

/**
 * Parses operation-specific authentication for OpenAPI.
 */
export function parseOperationAuth(
  auth: any,
  securitySchemes: Record<string, any>,
  optsAuth: any,
): Record<string, any> {
  if (auth == null || optsAuth != null) return {}

  const { type } = auth
  securitySchemes[`${type}Auth`] = {
    type: 'http',
    scheme: type,
  }
  return {
    security: [{ [`${type}Auth`]: [] }],
  }
}

/**
 * Parses parameters (query, header, and path) for OpenAPI.
 */
export function parseParameters(
  query: any[] = [],
  header: any[] = [],
  paths: string,
  paramsMeta: Record<string, any> = {},
  pathVars: Record<string, any> = {},
  options: { includeQuery?: boolean; includeHeader?: boolean } = {},
  paramInserter: (
    parameterMap: Map<string, any>,
    param: Record<string, any>,
  ) => Map<string, any> = defaultParamInserter,
): Record<string, any> {
  const { includeQuery = false, includeHeader = false } = options

  const parameters = Array.isArray(header)
    ? Array.from(
        header
          .reduce(
            mapParameters('header', includeHeader, paramInserter),
            new Map<string, any>(),
          )
          .values(),
      )
    : []

  parameters.push(
    ...Array.from(
      query
        .reduce(
          mapParameters('query', includeQuery, paramInserter),
          new Map<string, any>(),
        )
        .values(),
    ),
  )

  parameters.push(...extractPathParameters(paths, paramsMeta, pathVars))

  return parameters.length ? { parameters } : {}
}

/**
 * Maps parameters for OpenAPI.
 */
function mapParameters(
  type: string,
  includeDisabled: boolean,
  paramInserter: (
    parameterMap: Map<string, any>,
    param: Record<string, any>,
  ) => Map<string, any>,
) {
  return (
    parameterMap: Map<string, any>,
    {
      key,
      description,
      value,
      disabled,
    }: { key: string; description: string; value: any; disabled?: boolean },
  ) => {
    if (!includeDisabled && disabled) return parameterMap

    const required = /\[required\]/gi.test(description)
    paramInserter(parameterMap, {
      name: key,
      in: type,
      schema: { type: inferType(value) },
      ...(required ? { required } : {}),
      ...(description
        ? { description: description.replace(/ ?\[required\] ?/gi, '') }
        : {}),
      ...(value ? { example: value } : {}),
    })

    return parameterMap
  }
}

/**
 * Extracts path parameters for OpenAPI.
 */
function extractPathParameters(
  path: string,
  paramsMeta: Record<string, any>,
  pathVars: Record<string, any>,
): Record<string, any>[] {
  const matched = path.match(/{\s*[\w-]+\s*}/g) || []

  return matched.map((match) => {
    const name = match.slice(1, -1)
    const {
      type: varType = 'string',
      description: desc,
      value,
    } = pathVars[name] || {}
    const {
      type = varType,
      description = desc,
      example = value,
    } = paramsMeta[name] || {}

    return {
      name,
      in: 'path',
      schema: { type },
      required: true,
      ...(description ? { description } : {}),
      ...(example ? { example } : {}),
    }
  })
}

const defaultParamInserter = (
  parameterMap: Map<string, any>,
  param: Record<string, any>,
): Map<string, any> => {
  if (!parameterMap.has(param.name)) {
    parameterMap.set(param.name, param)
  }
  return parameterMap
}

/**
 * Infers the type of a value based on its content.
 */
function inferType(value: string): string {
  if (/^\d+$/.test(value)) return 'integer'
  if (/^[+-]?([0-9]*[.])?[0-9]+$/.test(value)) return 'number'
  if (/^(true|false)$/.test(value)) return 'boolean'
  return 'string'
}

/**
 * Parses authentication options for OpenAPI.
 */
function parseOptsAuth(optAuth: Record<string, any>): Record<string, any> {
  const securitySchemes: Record<string, any> = {}
  const security: Array<Record<string, any>> = []

  Object.entries(optAuth).forEach(([secName, secDefinition]) => {
    const { type, scheme, ...rest } = secDefinition as {
      type: string
      scheme: string
    }
    if (type === 'http' && ['bearer', 'basic'].includes(scheme)) {
      securitySchemes[secName] = {
        type: 'http',
        scheme,
        ...rest,
      }
      security.push({ [secName]: [] })
    }
  })

  return Object.keys(securitySchemes).length === 0
    ? {}
    : {
        components: { securitySchemes },
        security,
      }
}

/**
 * Parses Postman authentication for OpenAPI.
 */
function parsePostmanAuth(
  postmanAuth: Record<string, any> = {},
  securitySchemes: Record<string, any>,
): Record<string, any> {
  const { type } = postmanAuth

  if (type != null) {
    securitySchemes[`${type}Auth`] = {
      type: 'http',
      scheme: type,
    }
    return {
      components: { securitySchemes },
      security: [{ [`${type}Auth`]: [] }],
    }
  }

  return Object.keys(securitySchemes).length === 0
    ? {}
    : { components: { securitySchemes } }
}
