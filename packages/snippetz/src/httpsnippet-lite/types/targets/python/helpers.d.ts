/**
 * Create a valid Python string of a literal value according to its type.
 *
 * @param {*} value Any JavaScript literal
 * @param {object} opts Target options
 * @return {string}
 */
export declare const literalRepresentation: (
  value: any,
  opts: Record<string, any>,
  indentLevel?: number,
) => any
