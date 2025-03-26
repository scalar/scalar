import { RuntimeExpressionSchema as OriginalRuntimeExpressionSchema } from '../processed/runtime-expression'

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
export const RuntimeExpressionSchema = OriginalRuntimeExpressionSchema
