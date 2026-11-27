/** A single authored description is used by the browser store, server chunks, and exports. */
export const overlayBase = {
  openapi: '3.1.1',
  info: { title: 'Partner API', version: '1.0.0' },
  tags: [{ name: 'Public' }],
  paths: {
    '/pets': {
      get: {
        tags: ['Public'],
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/internal': { get: { responses: { '204': { description: 'No Content' } } } },
  },
}

export const partnerOverlay = {
  overlay: '1.2.0',
  info: { title: 'Partner view', version: '1.0.0' },
  extends: '../openapi.yaml',
  components: {
    actions: {
      'example/~public': {
        fields: {
          update: { examples: { partner: { value: { name: 'Rufus' } } } },
        },
      },
    },
  },
  actions: [
    { target: "$.paths['/internal'].get", remove: true },
    {
      $ref: '#/components/actions/example~1~0public',
      target: "$.paths['/pets'].get.responses['200'].content['application/json']",
    },
    { target: '$.tags', update: { name: 'Partner' } },
  ],
}
