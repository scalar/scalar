/**
 * Create a string corresponding to a valid declaration and initialization of a Swift array or dictionary literal
 *
 * @param name Desired name of the instance
 * @param parameters Key-value object of parameters to translate to a Swift object litearal
 * @param opts Target options
 * @return {string}
 */
export declare const literalDeclaration: <T, U>(
  name: string,
  parameters: T,
  opts: U,
) => string
/**
 * Create a valid Swift string of a literal value according to its type.
 *
 * @param value Any JavaScript literal
 * @param opts Target options
 */
export declare const literalRepresentation: <T, U>(
  value: T,
  opts: U,
  indentLevel?: number,
) => number | string
