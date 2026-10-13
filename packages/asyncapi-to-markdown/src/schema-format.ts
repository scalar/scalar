/** Schema languages with JSON Schema keywords understood by the renderer and example generator. */
export const isJsonSchemaFormat = (format: unknown): boolean =>
  typeof format !== 'string' ||
  /^application\/(?:schema\+(?:json|yaml)|vnd\.aai\.asyncapi(?:\+json|\+yaml)?)(?:;|$)/.test(format)
