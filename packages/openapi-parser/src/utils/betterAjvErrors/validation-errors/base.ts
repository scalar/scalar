// import { codeFrameColumns } from '@babel/code-frame';
// import chalk from 'chalk';
// import { getMetaFromPath } from '../json/index'

export interface BaseValidationErrorOptions {
  isIdentifierLocation?: boolean
  isSkipEndLocation?: boolean
  instancePath?: string
  dataPath?: string
  keyword?: string
  message?: string
  params?: Record<string, any>
  propertyName?: string
}

export default class BaseValidationError {
  options: BaseValidationErrorOptions
  data?: any
  schema?: any
  jsonAst?: any
  jsonRaw?: any
  name?: string

  constructor(
    options: BaseValidationErrorOptions = { isIdentifierLocation: false },
    { data, schema, jsonAst, jsonRaw }: { data?: any; schema?: any; jsonAst?: any; jsonRaw?: any } = {},
  ) {
    this.options = options
    this.data = data
    this.schema = schema
    this.jsonAst = jsonAst
    this.jsonRaw = jsonRaw
  }

  /**
   * @return {string}
   */
  get instancePath(): string | undefined {
    return typeof this.options.instancePath !== 'undefined' ? this.options.instancePath : this.options.dataPath
  }

  getError(): any {
    throw new Error(`Implement the 'getError' method inside ${this.constructor.name}!`)
  }
}
