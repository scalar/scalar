export type ParsedMimeType = {
  essence: string
  type: string
  subtype: string
  parameters: Map<string, string>
  toString: () => string
}

const HTTP_TOKEN_CODE_POINT = /^[!#$%&'*+\-.^_`|~A-Za-z0-9]+$/

const quoteParameterValue = (value: string): string => {
  const escapedValue = value.replaceAll(/(["\\])/g, '\\$1')
  return `"${escapedValue}"`
}

const parseParameter = (entry: string): [string, string] | null => {
  const separator = entry.indexOf('=')
  if (separator === -1) {
    return null
  }

  const rawName = entry.slice(0, separator).trim().toLowerCase()
  if (!rawName || !HTTP_TOKEN_CODE_POINT.test(rawName)) {
    return null
  }

  const rawValue = entry.slice(separator + 1).trim()
  if (!rawValue) {
    return [rawName, '']
  }

  if (rawValue.startsWith('"') && rawValue.endsWith('"') && rawValue.length >= 2) {
    const unescaped = rawValue.slice(1, -1).replaceAll(/\\(["\\])/g, '$1')
    return [rawName, unescaped]
  }

  return [rawName, rawValue]
}

const parseEssence = (value: string): { essence: string; type: string; subtype: string } => {
  const [rawType = '', rawSubtype = ''] = value.split('/', 2)
  const type = rawType.trim().toLowerCase()
  const subtype = rawSubtype.trim().toLowerCase()

  if (!type || !subtype || !HTTP_TOKEN_CODE_POINT.test(type) || !HTTP_TOKEN_CODE_POINT.test(subtype)) {
    throw new Error(`Invalid MIME type: "${value}"`)
  }

  return {
    essence: `${type}/${subtype}`,
    type,
    subtype,
  }
}

/**
 * Parses a MIME type value into a normalized object with essence and parameters.
 *
 * This intentionally covers the subset we need in Scalar packages:
 * essence, parameters, and stable stringification.
 */
export const parseMimeType = (value: string = 'text/plain'): ParsedMimeType => {
  const [essencePart = '', ...parameterParts] = value.split(';')
  let parsedEssence: { essence: string; type: string; subtype: string }

  try {
    parsedEssence = parseEssence(essencePart)
  } catch {
    parsedEssence = parseEssence('text/plain')
  }

  const { essence, type, subtype } = parsedEssence
  const parameters = new Map<string, string>()

  parameterParts.forEach((entry) => {
    const parsed = parseParameter(entry)
    if (!parsed) {
      return
    }
    const [name, parameterValue] = parsed
    parameters.set(name, parameterValue)
  })

  const toString = (): string => {
    const serializedParameters = Array.from(parameters.entries()).map(([name, parameterValue]) => {
      const safeValue = HTTP_TOKEN_CODE_POINT.test(parameterValue)
        ? parameterValue
        : quoteParameterValue(parameterValue)
      return `${name}=${safeValue}`
    })

    return serializedParameters.length ? `${essence}; ${serializedParameters.join('; ')}` : essence
  }

  return {
    essence,
    type,
    subtype,
    parameters,
    toString,
  }
}
