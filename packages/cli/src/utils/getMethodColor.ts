export function getMethodColor(method: string) {
  const colors = {
    get: 'green',
    post: 'cyan',
    put: 'yellow',
    delete: 'red',
    patch: 'magenta',
  }

  return colors[method.toLowerCase()] ?? 'grey'
}
