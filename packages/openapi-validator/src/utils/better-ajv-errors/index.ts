import prettify from './helpers'

type BetterAjvErrorsOptions = {
  indent?: number
  json?: string
}

// TODO: Check if this is the correct type
type AjvError = {
  keyword: string
  dataPath: string
  schemaPath: string
  params: any
  message: string
  schema: any
  parentSchema: any
  data: any
}

export function betterAjvErrors(schema: any, data: any, errors: AjvError[], options: BetterAjvErrorsOptions = {}) {
  const { indent = null, json = null } = options

  const jsonRaw = json || JSON.stringify(data, null, indent)

  const customErrorToStructure = (error) => error.getError()
  const customErrors = prettify(errors, {
    data,
    schema,
    jsonRaw,
  })

  return customErrors.map(customErrorToStructure)
}
