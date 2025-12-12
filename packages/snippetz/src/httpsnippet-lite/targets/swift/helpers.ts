/**
 * Create an string of given length filled with blank spaces
 *
 * @param length Length of the array to return
 * @param str String to pad out with
 */
const buildString = (length: number, str: string) => str.repeat(length)

/**
 * Create a string corresponding to a Dictionary or Array literal representation with pretty option and indentation.
 */
const concatArray = (arr: Array<string>, pretty: boolean, indentation: string, indentLevel: number): string => {
  const currentIndent = buildString(indentLevel, indentation)
  const closingBraceIndent = buildString(indentLevel - 1, indentation)
  const join = pretty ? `,\n${currentIndent}` : ', '
  if (pretty) {
    return `[\n${currentIndent}${arr.join(join)}\n${closingBraceIndent}]`
  }
  return `[${arr.join(join)}]`
}

interface Options {
  indent: string
  pretty: boolean
}

/**
 * Create a string corresponding to a valid declaration and initialization of a Swift array or dictionary literal
 *
 * @param name Desired name of the instance
 * @param parameters Key-value object of parameters to translate to a Swift object literal
 * @param opts Target options
 * @return {string}
 */

export const literalDeclaration = (name: string, parameters: unknown, opts: Options) =>
  `let ${name} = ${literalRepresentation(parameters, opts)}`
/**
 * Create a valid Swift string of a literal value according to its type.
 *
 * @param value Any JavaScript literal
 * @param opts Target options
 */
const literalRepresentation = (value: unknown, opts: Options, indentLevelInput?: number): string => {
  const indentLevel = indentLevelInput === undefined ? 1 : indentLevelInput + 1
  switch (Object.prototype.toString.call(value)) {
    case '[object Number]':
      return value as string
    case '[object Array]': {
      // Don't prettify arrays to avoid taking too much space
      let pretty = false
      const valuesRepresentation = (value as Array<unknown>).map((v) => {
        // Switch to prettify if the value is a dictionary with multiple keys
        if (Object.prototype.toString.call(v) === '[object Object]') {
          pretty = Object.keys(v as {}).length > 1
        }
        return literalRepresentation(v, opts, indentLevel)
      })

      return concatArray(valuesRepresentation, pretty, opts.indent, indentLevel)
    }
    case '[object Object]': {
      const keyValuePairs = []
      const _value = value as Record<string, unknown>
      for (const key in _value) {
        if (Object.hasOwn(_value, key)) {
          keyValuePairs.push(`"${key}": ${literalRepresentation(_value[key], opts, indentLevel)}`)
        }
      }
      return concatArray(keyValuePairs, opts.pretty && keyValuePairs.length > 1, opts.indent, indentLevel)
    }
    case '[object Boolean]':
      return (value as boolean).toString()

    default:
      if (value === null || value === undefined) {
        return ''
      }
      return `"${value.toString().replace(/"/g, '\\"')}"`
  }
}
