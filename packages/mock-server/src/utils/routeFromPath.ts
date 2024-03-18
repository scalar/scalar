/**
 * Convert path to route
 * Example: /posts/{id} -> /posts/:id
 */
export function routeFromPath(path: string) {
  return path.replace(/{/g, ':').replace(/}/g, '')
}
