import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({
  url: '/openapi.json',
  cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.67.0',
  pageTitle: 'Orbit API | Scalar',
})
