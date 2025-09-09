import type { Plugin } from '@scalar/types/snippetz'

/**
 * go/native
 */
export const goNative: Plugin = {
  target: 'go',
  client: 'native',
  title: 'NewRequest',
  generate(request, options) {
    // Defaults
    const normalizedRequest = {
      method: 'GET',
      ...request,
    }

    const method = (normalizedRequest.method || 'GET').toUpperCase()
    const url = buildUrl(normalizedRequest.url || '', normalizedRequest.queryString)
    const complexUrl = buildUrlForComplexRequest(normalizedRequest.url || '', normalizedRequest.queryString)

    // Check if this is a simple GET request that can use http.Get()
    const isSimpleGet =
      method === 'GET' &&
      !normalizedRequest.postData &&
      (!normalizedRequest.headers || normalizedRequest.headers.length === 0) &&
      (!normalizedRequest.cookies || normalizedRequest.cookies.length === 0) &&
      (!options?.auth || !options?.auth?.username || !options?.auth?.password)

    if (isSimpleGet) {
      return `package main

import (
	"fmt"
	"net/http"
)

func main() {
	res, err := http.Get("${escapeString(url)}")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
}`
    }

    // Check if this is a simple POST request that can use http.Post()
    const isSimplePost =
      method === 'POST' &&
      (!normalizedRequest.cookies || normalizedRequest.cookies.length === 0) &&
      !options?.auth &&
      (!normalizedRequest.postData ||
        (normalizedRequest.postData.mimeType !== 'multipart/form-data' &&
          (normalizedRequest.postData.text ||
            (normalizedRequest.postData.mimeType === 'application/x-www-form-urlencoded' &&
              normalizedRequest.postData.params))))

    if (isSimplePost) {
      if (!normalizedRequest.postData) {
        return `package main

import (
	"fmt"
	"net/http"
)

func main() {
	res, err := http.Post("${escapeString(complexUrl)}", "", nil)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
}`
      }

      const contentType = normalizedRequest.postData.mimeType || 'text/plain'

      if (contentType === 'application/json') {
        try {
          const jsonData = JSON.parse(normalizedRequest.postData.text)
          const { structs, initialization } = generateGoStructs(jsonData, 'Request')

          return `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

${structs}

func main() {
	payload := ${initialization}
	jsonData, _ := json.Marshal(payload)

	res, err := http.Post("${escapeString(complexUrl)}", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
}`
        } catch {
          const formattedJson = formatJson(normalizedRequest.postData.text)
          return `package main

import (
	"bytes"
	"fmt"
	"net/http"
)

func main() {
	payload := bytes.NewBuffer([]byte(\`${formattedJson}\`))

	res, err := http.Post("${escapeString(complexUrl)}", "application/json", payload)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
}`
        }
      } else if (contentType === 'application/x-www-form-urlencoded') {
        const params = normalizedRequest.postData.params || []
        const formData = params
          .map(({ name, value }) => `data.Set("${escapeString(name)}", "${escapeString(value)}")`)
          .join('\n\t')

        return `package main

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"
)

func main() {
	data := url.Values{}
	${formData}

	res, err := http.Post("${escapeString(complexUrl)}", "application/x-www-form-urlencoded", strings.NewReader(data.Encode()))
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
}`
      } else {
        const body = escapeString(normalizedRequest.postData.text)
        return `package main

import (
	"fmt"
	"net/http"
	"strings"
)

func main() {
	res, err := http.Post("${escapeString(complexUrl)}", "${contentType}", strings.NewReader("${body}"))
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
}`
      }
    }

    // For complex requests, use http.NewRequest approach
    // Determine required imports
    const imports = new Set(['fmt', 'net/http'])

    // Check if we need additional imports based on request content
    let needsStrings = false
    let needsBytes = false
    let needsMultipart = false
    let needsUrl = false
    let needsOs = false
    let needsJson = false

    // Handle post data
    let requestBody = ''
    let contentTypeHeader = ''
    let structDefinitions = ''

    if (normalizedRequest.postData) {
      if (
        normalizedRequest.postData.mimeType === 'application/x-www-form-urlencoded' &&
        normalizedRequest.postData.params
      ) {
        needsUrl = true
        needsStrings = true

        const requestBodyLines = [indent('data := url.Values{}')]
        normalizedRequest.postData.params.forEach(({ name, value }) => {
          requestBodyLines.push(indent(`data.Set("${escapeString(name)}", "${escapeString(value)}")`))
        })
        requestBodyLines.push(
          '',
          indent(
            `req, _ := http.NewRequest("${method}", "${escapeString(complexUrl)}", strings.NewReader(data.Encode()))`,
          ),
          '',
        )
        requestBody = requestBodyLines.join('\n')
      } else if (normalizedRequest.postData.mimeType === 'multipart/form-data') {
        if (normalizedRequest.postData.params) {
          needsBytes = true
          needsMultipart = true
          needsOs = true

          requestBody = `${indent('var b bytes.Buffer')}\n`
          requestBody += `${indent('w := multipart.NewWriter(&b)')}\n\n`

          normalizedRequest.postData.params.forEach(({ name, value, fileName }) => {
            if (fileName !== undefined) {
              requestBody += `${indent(`f, _ := os.Open("${escapeString(fileName)}")`)}\n`
              requestBody += `${indent('defer f.Close()')}\n\n`
              requestBody += `${indent(`fw, _ := w.CreateFormFile("${escapeString(name)}", "${escapeString(fileName)}")`)}\n`
              requestBody += `${indent('_, _ = fw.Write([]byte("file content"))')}\n\n`
            } else {
              requestBody += `${indent(`w.WriteField("${escapeString(name)}", "${escapeString(value)}")`)}\n`
            }
          })

          requestBody += `${indent('w.Close()')}\n\n`
          requestBody += `${indent(`req, _ := http.NewRequest("${method}", "${escapeString(complexUrl)}", &b)`)}\n`
          contentTypeHeader = `${indent('req.Header.Set("Content-Type", w.FormDataContentType())')}\n\n`
        } else if (normalizedRequest.postData.text) {
          needsBytes = true
          const formattedJson = formatJson(normalizedRequest.postData.text)
          requestBody = `${indent(`payload := bytes.NewBuffer([]byte(\`${formattedJson}\`))`)}\n\n`
          requestBody += `${indent(`req, _ := http.NewRequest("${method}", "${escapeString(complexUrl)}", payload)`)}\n`
          contentTypeHeader = `${indent('req.Header.Set("Content-Type", "multipart/form-data")')}\n\n`
        }
      } else if (normalizedRequest.postData.text) {
        if (normalizedRequest.postData.mimeType === 'application/json') {
          needsBytes = true
          needsJson = true

          try {
            const jsonData = JSON.parse(normalizedRequest.postData.text)
            const { structs, initialization } = generateGoStructs(jsonData, 'Request')

            // Store struct definitions separately to be added before main function
            requestBody = `${indent('payload := ' + initialization)}\n`
            requestBody += `${indent('jsonData, _ := json.Marshal(payload)')}\n`
            requestBody += `${indent('req, _ := http.NewRequest("' + method + '", url, bytes.NewBuffer(jsonData))')}\n`
            contentTypeHeader = `${indent('req.Header.Set("Content-Type", "application/json")')}\n`

            // Store struct definitions to be added before main function
            structDefinitions = structs
          } catch {
            // Fallback to raw JSON if parsing fails
            const formattedJson = formatJson(normalizedRequest.postData.text)
            requestBody = `${indent(`payload := bytes.NewBuffer([]byte(\`${formattedJson}\`))`)}\n\n`
            requestBody += `${indent(`req, _ := http.NewRequest("${method}", "${escapeString(complexUrl)}", payload)`)}\n`
            contentTypeHeader = `${indent('req.Header.Set("Content-Type", "application/json")')}\n`
          }
        } else {
          needsStrings = true
          requestBody = `${indent(`payload := strings.NewReader("${escapeString(normalizedRequest.postData.text)}")`)}\n\n`
          requestBody += `${indent(`req, _ := http.NewRequest("${method}", "${escapeString(complexUrl)}", payload)`)}\n`
        }
      }
    } else {
      requestBody = `${indent(`req, _ := http.NewRequest("${method}", "${escapeString(complexUrl)}", nil)`)}\n`
    }

    // Add required imports
    if (needsStrings) {
      imports.add('strings')
    }
    if (needsBytes) {
      imports.add('bytes')
    }
    if (needsMultipart) {
      imports.add('mime/multipart')
    }
    if (needsUrl) {
      imports.add('net/url')
    }
    if (needsOs) {
      imports.add('os')
    }
    if (needsJson) {
      imports.add('encoding/json')
    }

    // Build headers
    let headersCode = ''
    let hasHeaders = false
    if (normalizedRequest.headers && normalizedRequest.headers.length > 0) {
      // Group headers by name to check for duplicates
      const headerCounts = new Map<string, number>()
      normalizedRequest.headers.forEach(({ name }) => {
        headerCounts.set(name, (headerCounts.get(name) || 0) + 1)
      })

      normalizedRequest.headers.forEach(({ name, value }) => {
        // Skip Content-Type if we're setting it explicitly via contentTypeHeader
        if (name.toLowerCase() === 'content-type' && contentTypeHeader) {
          return
        }

        // Use Add for multiple headers with same name, Set for single headers
        const method = headerCounts.get(name) > 1 ? 'Add' : 'Set'
        headersCode += `${indent(`req.Header.${method}("${escapeString(name)}", "${escapeString(value)}")`)}\n`
        hasHeaders = true
      })
      if (hasHeaders) {
        headersCode += '\n'
      }
    }

    // Handle cookies
    if (normalizedRequest.cookies && normalizedRequest.cookies.length > 0) {
      const cookieString = normalizedRequest.cookies
        .map(({ name, value }) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
        .join('; ')
      headersCode += `${indent(`req.Header.Set("Cookie", "${escapeString(cookieString)}")`)}\n\n`
    }

    // Handle basic auth
    let authCode = ''
    if (options?.auth?.username && options?.auth?.password) {
      authCode = `${indent(`req.SetBasicAuth("${escapeString(options.auth.username)}", "${escapeString(options.auth.password)}")`)}\n\n`
    }

    // Build the complete code
    const importArray = Array.from(imports).sort()
    const importBlock = importArray.map((imp) => indent(`"${imp}"`)).join('\n')

    // Use struct definitions if they exist
    const mainFunctionBody = requestBody

    return `package main

import (
${importBlock}
)

${structDefinitions}${structDefinitions ? '\n\n' : ''}func main() {
${mainFunctionBody}${contentTypeHeader}${headersCode}${authCode}${indent('res, err := http.DefaultClient.Do(req)')}
${indent('if err != nil {')}
${indent('	fmt.Println("Error:", err)')}
${indent('	return')}
${indent('}')}
${indent('defer res.Body.Close()')}
}`
  },
}

/**
 * Builds the URL with query parameters
 */
function buildUrl(url: string, queryString?: Array<{ name: string; value: string }>): string {
  if (!url) {
    return ''
  }

  const urlObj = new URL(url)

  if (queryString && queryString.length > 0) {
    queryString.forEach(({ name, value }) => {
      urlObj.searchParams.set(name, value)
    })
  }

  // Convert + back to %20 for spaces to match expected output
  let result = urlObj.toString().replace(/\+/g, '%20')

  // Remove trailing slash if it was added by URL constructor and wasn't in original
  // But only if there are no query parameters
  if (url && !url.endsWith('/') && result.endsWith('/') && !result.includes('?')) {
    result = result.slice(0, -1)
  }

  return result
}

/**
 * Builds the URL with query parameters for complex requests (removes trailing slash)
 */
function buildUrlForComplexRequest(url: string, queryString?: Array<{ name: string; value: string }>): string {
  if (!url) {
    return ''
  }

  const urlObj = new URL(url)

  if (queryString && queryString.length > 0) {
    queryString.forEach(({ name, value }) => {
      urlObj.searchParams.set(name, value)
    })
  }

  // Convert + back to %20 for spaces to match expected output
  let result = urlObj.toString().replace(/\+/g, '%20')

  // Remove trailing slash if it was added by URL constructor and wasn't in original
  // But only if there are no query parameters
  if (url && !url.endsWith('/') && result.endsWith('/') && !result.includes('?')) {
    result = result.slice(0, -1)
  }

  return result
}

/**
 * Escapes a string for use in Go double-quoted strings
 */
function escapeString(str: string | undefined): string {
  if (!str) {
    return ''
  }
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

/**
 * Creates indented Go code lines using tabs
 */
function indent(lines: string | string[], level: number = 1): string {
  const tab = '\t'
  const indentation = tab.repeat(level)

  if (typeof lines === 'string') {
    return `${indentation}${lines}`
  }

  return lines.map((line) => (line ? `${indentation}${line}` : line)).join('\n')
}

/**
 * Formats JSON with proper indentation for Go code
 */
function formatJson(jsonText: string): string {
  try {
    const parsed = JSON.parse(jsonText)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return escapeString(jsonText)
  }
}

/**
 * Abstract tree structure for Go types
 */
type GoTypeNode = {
  kind: 'primitive' | 'struct' | 'array' | 'inline_struct'
  name?: string
  goType: string
  fields?: GoFieldNode[]
  elementType?: GoTypeNode
  jsonTag?: string
}

type GoFieldNode = {
  name: string
  type: GoTypeNode
  jsonTag: string
}

type StructDefinition = {
  name: string
  fields: GoFieldNode[]
}

/**
 * Generates Go struct definitions from JSON data using abstract tree approach
 */
function generateGoStructs(jsonData: any, structName: string = 'Request'): { structs: string; initialization: string } {
  const structDefinitions: StructDefinition[] = []
  const typeRegistry = new Map<string, GoTypeNode>()

  // Build the abstract tree - create separate structs for nested objects
  const _rootType = buildTypeTreeWithSeparateStructs(jsonData, structName, structDefinitions, typeRegistry)

  // Add the main struct definition with separate structs
  const mainStructFields = generateMainStructFields(jsonData, structName, structDefinitions, typeRegistry)
  const mainStructDef: StructDefinition = {
    name: structName,
    fields: mainStructFields,
  }
  structDefinitions.push(mainStructDef)

  // Generate struct definitions in dependency order
  const structs = generateStructDefinitions(structDefinitions)

  // Generate initialization with separate structs
  const initialization = generateMainStructInitialization(jsonData, structName, structDefinitions, typeRegistry)

  return {
    structs: structs.join('\n\n'),
    initialization: initialization,
  }
}

/**
 * Builds the abstract type tree with separate structs for nested objects
 */
function buildTypeTreeWithSeparateStructs(
  data: any,
  structName: string,
  structDefinitions: StructDefinition[],
  typeRegistry: Map<string, GoTypeNode>,
): GoTypeNode {
  if (data === null || data === undefined) {
    return { kind: 'primitive', goType: 'interface{}' }
  }

  if (typeof data === 'string') {
    return { kind: 'primitive', goType: 'string' }
  }

  if (typeof data === 'number') {
    return { kind: 'primitive', goType: Number.isInteger(data) ? 'int' : 'float64' }
  }

  if (typeof data === 'boolean') {
    return { kind: 'primitive', goType: 'bool' }
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { kind: 'array', goType: '[]interface{}', elementType: { kind: 'primitive', goType: 'interface{}' } }
    }
    const elementType = buildTypeTreeWithSeparateStructs(data[0], '', structDefinitions, typeRegistry)
    return { kind: 'array', goType: `[]${elementType.goType}`, elementType }
  }

  if (typeof data === 'object' && data !== null) {
    // For the main struct, create separate struct definitions for nested objects
    if (structName) {
      return buildMainStructType(data, structName, structDefinitions, typeRegistry)
    }
    // For inline structs, create inline struct type
    return buildInlineStructType(data, structDefinitions, typeRegistry)
  }

  return { kind: 'primitive', goType: 'interface{}' }
}

/**
 * Builds the abstract type tree from JSON data
 */
function buildTypeTree(
  data: any,
  structName: string,
  structDefinitions: StructDefinition[],
  typeRegistry: Map<string, GoTypeNode>,
): GoTypeNode {
  if (data === null || data === undefined) {
    return { kind: 'primitive', goType: 'interface{}' }
  }

  if (typeof data === 'string') {
    return { kind: 'primitive', goType: 'string' }
  }

  if (typeof data === 'number') {
    return { kind: 'primitive', goType: Number.isInteger(data) ? 'int' : 'float64' }
  }

  if (typeof data === 'boolean') {
    return { kind: 'primitive', goType: 'bool' }
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { kind: 'array', goType: '[]interface{}', elementType: { kind: 'primitive', goType: 'interface{}' } }
    }
    const elementType = buildTypeTree(data[0], '', structDefinitions, typeRegistry)
    return { kind: 'array', goType: `[]${elementType.goType}`, elementType }
  }

  if (typeof data === 'object' && data !== null) {
    // For the main struct, we need to create separate struct definitions for nested objects
    if (structName) {
      return buildStructType(data, structName, structDefinitions, typeRegistry)
    }
    // For inline structs, create inline struct type
    return buildInlineStructType(data, structDefinitions, typeRegistry)
  }

  return { kind: 'primitive', goType: 'interface{}' }
}

/**
 * Generates fields for the main struct with separate structs
 */
function generateMainStructFields(
  data: any,
  structName: string,
  structDefinitions: StructDefinition[],
  typeRegistry: Map<string, GoTypeNode>,
): GoFieldNode[] {
  const fields: GoFieldNode[] = []

  for (const [key, value] of Object.entries(data)) {
    const fieldName = capitalizeFirst(key)

    // For nested objects, create separate struct definitions and reference them
    let fieldType: GoTypeNode
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedStructName = `${structName}${fieldName}`
      // Create separate struct definition
      buildStructType(value, nestedStructName, structDefinitions, typeRegistry)
      // Reference the separate struct type
      fieldType = {
        kind: 'struct',
        name: nestedStructName,
        goType: nestedStructName,
      }
    } else {
      fieldType = buildTypeTreeWithSeparateStructs(value, '', structDefinitions, typeRegistry)
    }

    const jsonTag = `json:"${key}"`

    fields.push({
      name: fieldName,
      type: fieldType,
      jsonTag,
    })
  }

  return fields
}

/**
 * Builds the main struct type with separate structs for nested objects
 */
function buildMainStructType(
  data: any,
  structName: string,
  structDefinitions: StructDefinition[],
  typeRegistry: Map<string, GoTypeNode>,
): GoTypeNode {
  const fields: GoFieldNode[] = []

  for (const [key, value] of Object.entries(data)) {
    const fieldName = capitalizeFirst(key)

    // For nested objects, create separate struct definitions
    let fieldType: GoTypeNode
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedStructName = `${structName}${fieldName}`
      fieldType = buildStructType(value, nestedStructName, structDefinitions, typeRegistry)
    } else {
      fieldType = buildTypeTreeWithSeparateStructs(value, '', structDefinitions, typeRegistry)
    }

    const jsonTag = `json:"${key}"`

    fields.push({
      name: fieldName,
      type: fieldType,
      jsonTag,
    })
  }

  // For the main struct, use separate struct definition
  return {
    kind: 'struct',
    name: structName,
    goType: structName,
    fields,
  }
}

/**
 * Builds a struct type with proper dependency handling
 */
function buildStructType(
  data: any,
  structName: string,
  structDefinitions: StructDefinition[],
  typeRegistry: Map<string, GoTypeNode>,
): GoTypeNode {
  const fields: GoFieldNode[] = []

  for (const [key, value] of Object.entries(data)) {
    const fieldName = capitalizeFirst(key)

    // For nested objects, create separate struct definitions
    let fieldType: GoTypeNode
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedStructName = `${structName}${fieldName}`
      fieldType = buildStructType(value, nestedStructName, structDefinitions, typeRegistry)
    } else {
      fieldType = buildTypeTree(value, '', structDefinitions, typeRegistry)
    }

    const jsonTag = `json:"${key}"`

    fields.push({
      name: fieldName,
      type: fieldType,
      jsonTag,
    })
  }

  const structDef: StructDefinition = {
    name: structName,
    fields,
  }

  structDefinitions.push(structDef)

  return {
    kind: 'struct',
    name: structName,
    goType: structName,
    fields,
  }
}

/**
 * Builds an inline struct type
 */
function buildInlineStructType(
  data: any,
  structDefinitions: StructDefinition[],
  typeRegistry: Map<string, GoTypeNode>,
): GoTypeNode {
  const fields: GoFieldNode[] = []

  for (const [key, value] of Object.entries(data)) {
    const fieldName = capitalizeFirst(key)
    const fieldType = buildTypeTree(value, '', structDefinitions, typeRegistry)
    const jsonTag = `json:"${key}"`

    fields.push({
      name: fieldName,
      type: fieldType,
      jsonTag,
    })
  }

  return {
    kind: 'inline_struct',
    goType: 'struct',
    fields,
  }
}

/**
 * Generates struct definitions with proper formatting and alignment
 */
function generateStructDefinitions(structDefinitions: StructDefinition[]): string[] {
  // Sort structs by dependency order (nested structs first)
  const sortedStructs = sortStructsByDependency(structDefinitions)

  return sortedStructs.map((structDef) => renderStructDefinition(structDef))
}

/**
 * Sorts structs by dependency order to ensure nested structs are defined first
 */
function sortStructsByDependency(structDefinitions: StructDefinition[]): StructDefinition[] {
  const sorted: StructDefinition[] = []
  const visited = new Set<string>()

  function visit(structDef: StructDefinition) {
    if (visited.has(structDef.name)) {
      return
    }

    visited.add(structDef.name)

    // First, visit dependencies
    for (const field of structDef.fields) {
      if (field.type.kind === 'struct' && field.type.name) {
        const dependency = structDefinitions.find((s) => s.name === field.type.name)
        if (dependency && !visited.has(dependency.name)) {
          visit(dependency)
        }
      }
    }

    sorted.push(structDef)
  }

  for (const structDef of structDefinitions) {
    visit(structDef)
  }

  return sorted
}

/**
 * Renders a struct definition with proper alignment
 */
function renderStructDefinition(structDef: StructDefinition): string {
  if (structDef.fields.length === 0) {
    return `type ${structDef.name} struct {
}`
  }

  const fieldLines = structDef.fields.map((field) => {
    const fieldType = renderTypeForStruct(field.type)
    const jsonTag = `\`${field.jsonTag}\``

    // Use proper tab alignment for Go struct fields
    return `\t${field.name} ${fieldType} ${jsonTag}`
  })

  return `type ${structDef.name} struct {
${fieldLines.join('\n')}
}`
}

/**
 * Renders a type for use in struct definitions
 */
function renderTypeForStruct(typeNode: GoTypeNode): string {
  switch (typeNode.kind) {
    case 'primitive':
      return typeNode.goType
    case 'array':
      return typeNode.goType
    case 'struct':
      return typeNode.goType
    case 'inline_struct':
      return renderInlineStruct(typeNode)
    default:
      return 'interface{}'
  }
}

/**
 * Renders an inline struct with proper formatting
 */
function renderInlineStruct(typeNode: GoTypeNode): string {
  if (!typeNode.fields || typeNode.fields.length === 0) {
    return 'struct {}'
  }

  // Calculate the maximum field name length for alignment
  const maxFieldNameLength = Math.max(...typeNode.fields.map((field) => field.name.length))

  const fieldLines = typeNode.fields.map((field) => {
    const fieldType = renderTypeForStruct(field.type)
    const jsonTag = `\`${field.jsonTag}\``

    // Align field names with tabs, then align types
    const fieldName = field.name.padEnd(maxFieldNameLength)
    return `\t\t${fieldName}\t${fieldType} ${jsonTag}`
  })

  return `struct {
${fieldLines.join('\n')}
\t}`
}

/**
 * Generates struct initialization from the abstract tree
 */
function generateStructInitializationFromTree(
  data: any,
  typeNode: GoTypeNode,
  indentLevel: number,
  structName?: string,
): string {
  if (data === null || data === undefined) {
    return 'nil'
  }

  if (typeNode.kind === 'primitive') {
    return generatePrimitiveValue(data)
  }

  if (typeNode.kind === 'array') {
    return generateArrayInitialization(data, typeNode)
  }

  if (typeNode.kind === 'struct') {
    return generateStructInitialization(data, typeNode, indentLevel)
  }

  if (typeNode.kind === 'inline_struct') {
    // If this is the main struct, use the struct name instead of inline struct
    if (structName) {
      return generateStructInitializationWithName(data, typeNode, indentLevel, structName)
    }
    return generateInlineStructInitialization(data, typeNode, indentLevel)
  }

  return 'nil'
}

/**
 * Generates primitive value initialization
 */
function generatePrimitiveValue(value: any): string {
  if (typeof value === 'string') {
    return `"${escapeString(value)}"`
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  if (typeof value === 'boolean') {
    return value.toString()
  }
  if (value === null) {
    return 'nil'
  }
  return 'nil'
}

/**
 * Generates array initialization
 */
function generateArrayInitialization(data: any[], typeNode: GoTypeNode): string {
  if (data.length === 0) {
    return `${typeNode.goType}{}`
  }

  const elements = data
    .map((item) => {
      if (item === null || item === undefined) {
        return 'nil'
      }
      return generateStructInitializationFromTree(item, typeNode.elementType!, 0)
    })
    .join(', ')
  return `${typeNode.goType}{${elements}}`
}

/**
 * Generates struct initialization
 */
function generateStructInitialization(data: any, typeNode: GoTypeNode, indentLevel: number): string {
  if (!typeNode.fields || typeNode.fields.length === 0) {
    return `${typeNode.goType}{}`
  }

  const fields: string[] = []

  for (const field of typeNode.fields) {
    const fieldData = data[field.jsonTag.replace('json:', '').replace(/"/g, '')]
    const valueStr = generateStructInitializationFromTree(fieldData, field.type, indentLevel + 1)
    fields.push(`${field.name}: ${valueStr}`)
  }

  // For simple cases with one field, use single-line format
  if (fields.length === 1) {
    return `${typeNode.goType}{${fields.join(', ')}}`
  }

  // For complex cases, use multi-line format
  const indent = '\t'.repeat(indentLevel + 1)
  const multiLineFields = fields.map((field) => `${indent}${field}`)
  return `${typeNode.goType}{
${multiLineFields.join(',\n')},
${'\t'.repeat(indentLevel)}}`
}

/**
 * Generates main struct initialization with separate structs
 */
function generateMainStructInitialization(
  data: any,
  structName: string,
  structDefinitions: StructDefinition[],
  typeRegistry: Map<string, GoTypeNode>,
): string {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return `${structName}{}`
  }

  const fields: string[] = []
  const indent = '\t'

  for (const [key, value] of Object.entries(data)) {
    const fieldName = capitalizeFirst(key)
    const valueStr = generateMainStructFieldInitialization(value, key, structName, structDefinitions, typeRegistry, 1)
    fields.push(`${indent}${fieldName}: ${valueStr}`)
  }

  return `${structName}{
${fields.join(',\n')},
}`
}

/**
 * Generates initialization for a field in the main struct
 */
function generateMainStructFieldInitialization(
  value: any,
  fieldKey: string,
  parentStructName: string,
  structDefinitions: StructDefinition[],
  typeRegistry: Map<string, GoTypeNode>,
  indentLevel: number,
): string {
  if (value === null || value === undefined) {
    return 'nil'
  }

  if (typeof value === 'string') {
    return `"${escapeString(value)}"`
  }

  if (typeof value === 'number') {
    return value.toString()
  }

  if (typeof value === 'boolean') {
    return value.toString()
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]interface{}{}'
    }
    const elementType = buildTypeTreeWithSeparateStructs(value[0], '', structDefinitions, typeRegistry)
    const elements = value
      .map((item) =>
        generateMainStructFieldInitialization(item, '', parentStructName, structDefinitions, typeRegistry, 0),
      )
      .join(', ')
    return `[]${elementType.goType}{${elements}}`
  }

  if (typeof value === 'object' && value !== null) {
    // Use separate struct initialization
    const nestedStructName = `${parentStructName}${capitalizeFirst(fieldKey)}`
    const fields: string[] = []
    const indent = '\t'.repeat(indentLevel + 1)

    for (const [key, val] of Object.entries(value)) {
      const fieldName = capitalizeFirst(key)
      const valueStr = generateMainStructFieldInitialization(
        val,
        key,
        nestedStructName,
        structDefinitions,
        typeRegistry,
        indentLevel + 1,
      )
      fields.push(`${indent}${fieldName}: ${valueStr}`)
    }

    return `${nestedStructName}{
${fields.join(',\n')},
${'\t'.repeat(indentLevel)}}`
  }

  return 'nil'
}

/**
 * Generates struct initialization with a specific struct name
 */
function generateStructInitializationWithName(
  data: any,
  typeNode: GoTypeNode,
  indentLevel: number,
  structName: string,
): string {
  if (!typeNode.fields || typeNode.fields.length === 0) {
    return `${structName}{}`
  }

  const fields: string[] = []
  const indent = '\t'.repeat(indentLevel + 1)

  for (const field of typeNode.fields) {
    const fieldData = data[field.jsonTag.replace('json:', '').replace(/"/g, '')]
    const valueStr = generateStructInitializationFromTree(fieldData, field.type, indentLevel + 1)
    fields.push(`${indent}${field.name}: ${valueStr}`)
  }

  return `${structName}{
${fields.join(',\n')},
${'\t'.repeat(indentLevel)}}`
}

/**
 * Generates inline struct initialization
 */
function generateInlineStructInitialization(data: any, typeNode: GoTypeNode, indentLevel: number): string {
  if (!typeNode.fields || typeNode.fields.length === 0) {
    return 'struct {}'
  }

  const fields: string[] = []
  const indent = '\t'.repeat(indentLevel + 1)

  for (const field of typeNode.fields) {
    const fieldData = data[field.jsonTag.replace('json:', '').replace(/"/g, '')]
    const valueStr = generateStructInitializationFromTree(fieldData, field.type, indentLevel + 1)
    fields.push(`${indent}${field.name}: ${valueStr}`)
  }

  return `struct {
${fields.join(',\n')},
${'\t'.repeat(indentLevel)}}`
}

/**
 * Capitalizes the first letter of a string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
