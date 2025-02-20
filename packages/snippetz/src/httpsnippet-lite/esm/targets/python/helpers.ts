// @ts-nocheck
/**
 * Create a string corresponding to a Dictionary or Array literal representation with pretty option
 * and indentation.
 */
function concatValues(concatType, values, pretty, indentation, indentLevel) {
  const currentIndent = indentation.repeat(indentLevel)
  const closingBraceIndent = indentation.repeat(indentLevel - 1)
  const join = pretty ? `,\n${currentIndent}` : ', '
  const openingBrace = concatType === 'object' ? '{' : '['
  const closingBrace = concatType === 'object' ? '}' : ']'
  if (pretty) {
    return `${openingBrace}\n${currentIndent}${values.join(join)}\n${closingBraceIndent}${closingBrace}`
  }
  if (concatType === 'object' && values.length > 0) {
    return `${openingBrace} ${values.join(join)} ${closingBrace}`
  }
  return `${openingBrace}${values.join(join)}${closingBrace}`
}
/**
 * Create a valid Python string of a literal value according to its type.
 *
 * @param {*} value Any JavaScript literal
 * @param {object} opts Target options
 * @return {string}
 */
export const literalRepresentation = (value, opts, indentLevel) => {
  indentLevel = indentLevel === undefined ? 1 : indentLevel + 1
  switch (Object.prototype.toString.call(value)) {
    case '[object Number]':
      return value
    case '[object Array]': {
      let pretty = false
      const valuesRepresentation = value.map((v) => {
        // Switch to prettify if the value is a dictionary with multiple keys
        if (Object.prototype.toString.call(v) === '[object Object]') {
          pretty = Object.keys(v).length > 1
        }
        return literalRepresentation(v, opts, indentLevel)
      })
      return concatValues(
        'array',
        valuesRepresentation,
        pretty,
        opts.indent,
        indentLevel,
      )
    }
    case '[object Object]': {
      const keyValuePairs = []
      for (const key in value) {
        keyValuePairs.push(
          `"${key}": ${literalRepresentation(value[key], opts, indentLevel)}`,
        )
      }
      return concatValues(
        'object',
        keyValuePairs,
        opts.pretty && keyValuePairs.length > 1,
        opts.indent,
        indentLevel,
      )
    }
    case '[object Null]':
      return 'None'
    case '[object Boolean]':
      return value ? 'True' : 'False'
    default:
      if (value === null || value === undefined) {
        return ''
      }
      return `"${value.toString().replace(/"/g, '\\"')}"`
  }
}
