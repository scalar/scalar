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
export declare const nsDeclaration: (
  nsClass: string,
  name: string,
  parameters: Record<string, any>,
  indent?: boolean,
) => string
/**
 * Create a valid Objective-C string of a literal value according to its type.
 *
 * @param value Any JavaScript literal
 */
export declare const literalRepresentation: (
  value: any,
  indentation?: number,
) => string
