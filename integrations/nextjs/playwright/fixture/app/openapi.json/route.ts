/** Keep the browser test independent of external API-description services. */
export const GET = (): Response =>
  Response.json({
    openapi: '3.1.0',
    info: { title: 'Compatibility API', version: '1.0.0' },
    paths: {},
  })
