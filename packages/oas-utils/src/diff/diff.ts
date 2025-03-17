import microdiff from 'microdiff'

const types = {
  CREATE: 'add',
  REMOVE: 'remove',
  CHANGE: 'modify',
} as const

export type DiffChangeType = (typeof types)[keyof typeof types]

/**
 * Compare two specs and return the changes for each request entry
 *
 */
export function diffSpec(a: object, b: object) {
  const diff = microdiff(a, b)

  const requestChanges: Record<
    string,
    {
      type: DiffChangeType
      mutations: object[]
      value?: object
    }
  > = {}

  diff
    .filter((d) => d.path[0] === 'paths')
    .forEach((d) => {
      const key = d.path
        .slice(0, 3)
        .map((p) => String(p).replaceAll('/', '~1'))
        .join('/')

      if (!requestChanges[key]) {
        requestChanges[key] = {
          type: types[d.type],
          mutations: [],
        }
      }

      if (d.type === 'CHANGE') {
        requestChanges[key].mutations.push({
          ...d,
          path: d.path.slice(3),
        })
      } else if (d.type === 'CREATE') {
        requestChanges[key].value = d.value
      }
    })

  return JSON.stringify(requestChanges, null, 2)
}
