import microdiff from 'microdiff'

const types = {
  CREATE: 'add',
  REMOVE: 'delete',
  CHANGE: 'edit',
} as const

/** TODO: add a ref dictionary to the parser to handle components */
const allowedProperties: Record<string, boolean> = {
  info: true,
  servers: true,
  security: true,
  tags: true,
  paths: true,
}

export type DiffChangeType = (typeof types)[keyof typeof types]

/**
 * Compare two specs and return the changes for each request entry
 */
export function diffSpec(a: object, b: object) {
  const diff = microdiff(a, b)

  const requestChanges: Record<
    string,
    {
      type: DiffChangeType
      path: (string | number)[]
      mutations: object[]
      value?: object
    }
  > = {}

  diff
    .filter((d) => allowedProperties[d.path[0]])
    .forEach((d) => {
      const key = d.path
        .slice(0, 3)
        .map((p) => String(p).replaceAll('/', '~1'))
        .join('/')

      if (!requestChanges[key])
        requestChanges[key] = {
          type: types[d.type],
          path: d.path,
          mutations: [],
        }

      if (d.type === 'CHANGE') {
        requestChanges[key].mutations.push(d)
      } else if (d.type === 'CREATE') {
        requestChanges[key].value = d.value
      }
    })

  return requestChanges
}
