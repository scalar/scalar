// import { codeFrameColumns } from '@babel/code-frame';
// import chalk from 'chalk';
// import { getMetaFromPath } from '@/json/index'

export default class BaseValidationError {
  constructor(options = { isIdentifierLocation: false }, { data, schema, jsonAst, jsonRaw }) {
    this.options = options
    this.data = data
    this.schema = schema
    this.jsonAst = jsonAst
    this.jsonRaw = jsonRaw
  }

  /**
   * @return {string}
   */
  get instancePath() {
    return typeof this.options.instancePath !== 'undefined' ? this.options.instancePath : this.options.dataPath
  }

  getError() {
    throw new Error(`Implement the 'getError' method inside ${this.constructor.name}!`)
  }
}
