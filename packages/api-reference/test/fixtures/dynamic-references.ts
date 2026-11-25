/** URI-qualified dynamic references and static fallbacks in one response. */
export const dynamicReferencesDocument = {
  openapi: '3.2.0',
  info: { title: 'Dynamic reference resolution', version: '1.0.0' },
  paths: {
    '/items': {
      get: {
        summary: 'Get items',
        responses: {
          '200': {
            description: 'Items with dynamic and static targets',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Result' } },
              'application/xml': { schema: { $ref: '#/components/schemas/Result' } },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Result: {
        $id: 'https://example.com/bindings/result.json',
        $ref: 'https://example.com/schemas/content/schema.json',
        $defs: {
          binding: {
            $dynamicAnchor: 'item',
            type: 'object',
            properties: { bound: { type: 'string', const: 'selected', xml: { nodeType: 'attribute' } } },
          },
          pointerOverride: { $dynamicAnchor: 'pointer', type: 'string', const: 'wrong pointer' },
        },
      },
      Resources: {
        $id: 'https://example.com/schemas/resources.json',
        $defs: {
          content: {
            $id: 'content/schema.json',
            type: 'object',
            xml: { name: 'result' },
            $defs: {
              item: { $dynamicAnchor: 'item', type: 'boolean' },
              alias: { $dynamicRef: '#/$defs/pointer' },
              pointer: { $dynamicAnchor: 'pointer', type: 'string', const: 'pointer value' },
            },
            properties: {
              fragment: { $dynamicRef: '#item' },
              relative: { $dynamicRef: '../defaults.json#item' },
              absolute: { $dynamicRef: 'https://example.com/schemas/defaults.json#item' },
              ordinary: { $dynamicRef: '../static.json#item' },
              pointer: { $dynamicRef: '#/$defs/pointer' },
              alias: { $dynamicRef: '#/$defs/alias' },
              indirect: { $ref: '#/$defs/alias' },
            },
          },
          defaults: { $id: 'defaults.json', $dynamicAnchor: 'item', type: 'number' },
          static: { $id: 'static.json', $anchor: 'item', type: 'string', const: 'ordinary anchor' },
        },
      },
    },
  },
}
