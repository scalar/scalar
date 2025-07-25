import { z } from 'zod'

// Helper for validating the expression syntax
const isValidRuntimeExpression = (value: string): boolean => {
  // Handle pure runtime expressions starting with $
  if (value.startsWith('$')) {
    return validatePureExpression(value)
  }

  // Handle embedded expressions in strings
  if (value.includes('{')) {
    // Extract all expressions within curly braces
    const expressions = value.match(/\{([^}]+)\}/g)
    if (!expressions) {
      return false
    }

    // Validate each embedded expression
    return expressions.every((expr) => {
      // Remove curly braces and validate the inner expression
      const innerExpr = expr.slice(1, -1)
      return validatePureExpression(innerExpr)
    })
  }

  return false
}

// Helper to validate a pure runtime expression (without curly braces)
const validatePureExpression = (value: string): boolean => {
  // Remove $ prefix if present
  const expression = value.startsWith('$') ? value.slice(1) : value

  // Basic expressions without references
  if (['method', 'url', 'statusCode'].includes(expression)) {
    return true
  }

  // First split on # to separate the JSON pointer if it exists
  const [mainPart, jsonPointer] = expression.split('#')

  // Request and response references
  const [source, type, ...rest] = mainPart?.split('.') ?? []

  if (!['request', 'response'].includes(source ?? '')) {
    return false
  }

  if (!['header', 'query', 'path', 'body'].includes(type ?? '')) {
    return false
  }

  // For body references, validate JSON pointer syntax
  if (type === 'body') {
    if (jsonPointer === undefined) {
      return false
    }

    // Empty pointer ('') and root pointer ('/') are valid
    if (jsonPointer === '' || jsonPointer === '/') {
      return true
    }

    // For other pointers, validate the path
    if (!jsonPointer.startsWith('/')) {
      return false
    }

    // Split on / and validate each segment
    const segments = jsonPointer.slice(1).split('/')

    return segments.every((segment) => {
      // Decode any JSON Pointer escape sequences
      const decoded = segment.replace(/~1/g, '/').replace(/~0/g, '~')

      // Segment must not be empty unless it's the last one
      return decoded.length > 0
    })
  }

  // For header references, validate header name
  if (type === 'header') {
    // Header names cannot contain spaces
    const headerName = rest.join('.')
    return !headerName.includes(' ')
  }

  // For other types (query, path), ensure there's a field name
  return rest.length === 1
}

/**
 * Runtime Expression Schema
 *
 * Runtime expressions allow defining values based on information that will only be available within the HTTP message in
 * an actual API call. This mechanism is used by Link Objects and Callback Objects.
 *
 * Expressions can be:
 * 1. Pure runtime expressions starting with $ (e.g. $method, $request.path.id)
 * 2. Embedded expressions in strings using curly braces (e.g. "Hello {$request.body#/name}!")
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#runtime-expressions
 */
export const RuntimeExpressionSchema = z.string().refine(isValidRuntimeExpression, (value) => ({
  message: `Invalid runtime expression: "${value}". Runtime expressions must:
  - Start with $ or contain expressions in curly braces {}
  - Use one of: $method, $url, $statusCode
  - Or follow pattern: $request|response.(header|query|path|body)
  - For body refs, include valid JSON pointer (e.g. #/user/id)
  - For headers, use valid header names without spaces
  Example valid expressions:
  - Pure: $method, $request.path.id, $response.body#/status
  - Embedded: "Hello {$request.body#/name}!", "Status: {$statusCode}"`,
}))
