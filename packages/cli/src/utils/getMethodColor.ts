export type KleurColor = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' | 'grey'

export function getMethodColor(method: string) {
  const colors: Record<string, KleurColor> = {
    get: 'green',
    post: 'cyan',
    put: 'yellow',
    delete: 'red',
    patch: 'magenta',
  }

  return (colors[method.toLowerCase()] ?? 'grey') as KleurColor
}
