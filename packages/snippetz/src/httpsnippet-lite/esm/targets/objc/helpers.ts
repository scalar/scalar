// @ts-nocheck
/**
 * Create a string corresponding to a valid declaration and initialization of an Objective-C object literal.
 *
 * @param nsClass Class of the litteral
 * @param name Desired name of the instance
 * @param parameters Key-value object of parameters to translate to an Objective-C object litearal
 * @param indent If true, will declare the litteral by indenting each new key/value pair.
 * @return A valid Objective-C declaration and initialization of an Objective-C object litteral.
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
export const nsDeclaration = (nsClass, name, parameters, indent) => {
  const opening = `${nsClass} *${name} = `
  const literal = literalRepresentation(
    parameters,
    indent ? opening.length : undefined,
  )
  return `${opening}${literal};`
}
/**
 * Create a valid Objective-C string of a literal value according to its type.
 *
 * @param value Any JavaScript literal
 */
export const literalRepresentation = (value, indentation) => {
  const join =
    indentation === undefined ? ', ' : `,\n   ${' '.repeat(indentation)}`
  switch (Object.prototype.toString.call(value)) {
    case '[object Number]':
      return `@${value}`
    case '[object Array]': {
      const valuesRepresentation = value.map((value) =>
        literalRepresentation(value),
      )
      return `@[ ${valuesRepresentation.join(join)} ]`
    }
    case '[object Object]': {
      const keyValuePairs = []
      for (const key in value) {
        keyValuePairs.push(`@"${key}": ${literalRepresentation(value[key])}`)
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
