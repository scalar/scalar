export type PostProcessor = (unreplacedCode: string) => string
export type CodeBuilderOptions = {
  /**
   * Desired indentation character for aggregated lines of code
   * @default ''
   */
  indent?: string
  /**
   * Desired character to join each line of code
   * @default \n
   */
  join?: string
}
export declare class CodeBuilder {
  postProcessors: PostProcessor[]
  code: string[]
  indentationCharacter: string
  lineJoin: string
  /**
   * Helper object to format and aggragate lines of code.
   * Lines are aggregated in a `code` array, and need to be joined to obtain a proper code snippet.
   */
  constructor({ indent, join }?: CodeBuilderOptions)
  /**
   * Add given indentation level to given line of code
   */
  indentLine: (line: string, indentationLevel?: number) => string
  /**
   * Add the line at the beginning of the current lines
   */
  unshift: (line: string, indentationLevel?: number) => void
  /**
   * Add the line at the end of the current lines
   */
  push: (line: string, indentationLevel?: number) => void
  /**
   * Add an empty line at the end of current lines
   */
  blank: () => void
  /**
   * Concatenate all current lines using the given lineJoin, then apply any replacers that may have been added
   */
  join: () => string
  /**
   * Often when writing modules you may wish to add a literal tag or bit of metadata that you wish to transform after other processing as a final step.
   * To do so, you can provide a PostProcessor function and it will be run automatically for you when you call `join()` later on.
   */
  addPostProcessor: (postProcessor: PostProcessor) => void
}
