import { readFileSync } from 'node:fs'

/** Deterministic descriptions exercising reuse, recursive models, and Markdown-heavy input. */
export const scenarios = [
  { name: 'galaxy-full', mode: 'full' },
  { name: 'small-full', operations: 10, properties: 8, mode: 'full' },
  { name: 'large-full', operations: 200, properties: 30, mode: 'full' },
  { name: 'description-heavy', operations: 100, properties: 12, descriptions: true, mode: 'full' },
  { name: 'single-operation', operations: 200, properties: 30, mode: 'operation' },
  { name: 'all-operation-pages', operations: 100, properties: 20, mode: 'pages' },
]

/** Shared references deliberately occur in requests, responses, and component sections. */
export const createFixture = ({ name, operations, properties, descriptions = false }) => {
  if (name === 'galaxy-full')
    return readFileSync(new URL('../../galaxy/src/documents/3.1.yaml', import.meta.url), 'utf8')
  const description = descriptions
    ? Array.from(
        { length: 6 },
        (_, index) =>
          `### Usage ${index}\n\nUse **carefully** with [documentation](https://example.com/docs).\n\n- First step\n- Second step with \`inline code\`\n\n| Name | Value |\n| --- | --- |\n| Mode | Active |\n\n\`\`\`json\n{"message":"hello", "enabled":true}\n\`\`\``,
      ).join('\n\n')
    : 'A shared object used by this API.'
  return {
    openapi: '3.1.1',
    info: { title: 'Markdown benchmark', version: '1.0', description },
    servers: [{ url: 'https://example.com/api' }],
    security: [{ bearer: [] }],
    tags: [{ name: 'Resources', description: 'Resource operations' }],
    paths: Object.fromEntries(
      Array.from({ length: operations }, (_, index) => [
        `/resources/${index}`,
        {
          post: {
            operationId: `resource${index}`,
            summary: `Resource ${index}`,
            description,
            tags: ['Resources'],
            parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }],
            requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Resource' } } } },
            responses: {
              '200': {
                description: 'Success',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Resource' } } },
              },
            },
          },
        },
      ]),
    ),
    components: {
      securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } },
      schemas: {
        Resource: {
          type: 'object',
          description,
          required: ['field0'],
          properties: {
            ...Object.fromEntries(
              Array.from({ length: properties }, (_, index) => [
                `field${index}`,
                { type: 'string', description: `Field ${index}`, example: `value${index}` },
              ]),
            ),
            owner: { $ref: '#/components/schemas/Owner' },
            parent: { $ref: '#/components/schemas/Resource' },
          },
        },
        Owner: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
      },
    },
  }
}
