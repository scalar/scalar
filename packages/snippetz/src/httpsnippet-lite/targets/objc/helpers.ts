/**
 * Create a string corresponding to a valid declaration and initialization of an Objective-C object literal.
 *
 * @param nsClass Class of the literal
 * @param name Desired name of the instance
 * @param parameters Key-value object of parameters to translate to an Objective-C object literal
 * @param indent If true, will declare the literal by indenting each new key/value pair.
 * @return A valid Objective-C declaration and initialization of an Objective-C object literal.
 *
 * @example
 *   nsDeclaration('NSDictionary', 'params', {a: 'b', c: 'd'}, true)
 *   // returns:
 *   NSDictionary *params = @{ @"a": @"b",
 *                             @"c": @"d" };
 *
 *   nsDeclaration('NSDictionary', 'params', {a: 'b', c: 'd'})
 *   // returns:
 *   NSDictionary *params = @{ @"a": @"b", @"c": @"d" };
 */
export const nsDeclaration = (nsClass: string, name: string, parameters: unknown, indent: boolean): string => {
  const opening = `${nsClass} *${name} = `
  const literal = literalRepresentation(parameters, indent ? opening.length : undefined)
  return `${opening}${literal};`
}

/**
 * Create a valid Objective-C string of a literal value according to its type.
 *
 * @param value Any JavaScript literal
 */
const literalRepresentation = (value: unknown, indentation?: number): string => {
  const join = indentation === undefined ? ', ' : `,\n   ${' '.repeat(indentation)}`
  switch (Object.prototype.toString.call(value)) {
    case '[object Number]':
      return `@${value}`
    case '[object Array]': {
      const valuesRepresentation = (value as Array<unknown>).map((value) => literalRepresentation(value))
      return `@[ ${valuesRepresentation.join(join)} ]`
    }
    case '[object Object]': {
      const keyValuePairs = []
      const _value = value as Record<string, unknown>
      for (const key in _value) {
        if (Object.hasOwn(_value, key)) {
          keyValuePairs.push(`@"${key}": ${literalRepresentation(_value[key])}`)
        }
      }
      return `@{ ${keyValuePairs.join(join)} }`
    }
    case '[object Boolean]':
      return value ? '@YES' : '@NO'
    default:
      if (value === null || value === undefined) {
        return ''
      }
      return `@"${value.toString().replace(/"/g, '\\"')}"`
  }
}
