// @ts-nocheck
const DEFAULT_INDENTATION_CHARACTER = ''
const DEFAULT_LINE_JOIN = '\n'
export class CodeBuilder {
  /**
   * Helper object to format and aggragate lines of code.
   * Lines are aggregated in a `code` array, and need to be joined to obtain a proper code snippet.
   */
  constructor({ indent, join } = {}) {
    this.postProcessors = []
    this.code = []
    this.indentationCharacter = DEFAULT_INDENTATION_CHARACTER
    this.lineJoin = DEFAULT_LINE_JOIN
    /**
     * Add given indentation level to given line of code
     */
    this.indentLine = (line, indentationLevel = 0) => {
      const whitespace = this.indentationCharacter.repeat(indentationLevel)
      return `${whitespace}${line}`
    }
    /**
     * Add the line at the beginning of the current lines
     */
    this.unshift = (line, indentationLevel) => {
      const newLine = this.indentLine(line, indentationLevel)
      this.code.unshift(newLine)
    }
    /**
     * Add the line at the end of the current lines
     */
    this.push = (line, indentationLevel) => {
      const newLine = this.indentLine(line, indentationLevel)
      this.code.push(newLine)
    }
    /**
     * Add an empty line at the end of current lines
     */
    this.blank = () => {
      this.code.push('')
    }
    /**
     * Concatenate all current lines using the given lineJoin, then apply any replacers that may have been added
     */
    this.join = () => {
      const unreplacedCode = this.code.join(this.lineJoin)
      const replacedOutput = this.postProcessors.reduce(
        (accumulator, replacer) => replacer(accumulator),
        unreplacedCode,
      )
      return replacedOutput
    }
    /**
     * Often when writing modules you may wish to add a literal tag or bit of metadata that you wish to transform after other processing as a final step.
     * To do so, you can provide a PostProcessor function and it will be run automatically for you when you call `join()` later on.
     */
    this.addPostProcessor = (postProcessor) => {
      this.postProcessors = [...this.postProcessors, postProcessor]
    }
    this.indentationCharacter = indent || DEFAULT_INDENTATION_CHARACTER
    this.lineJoin = join !== null && join !== void 0 ? join : DEFAULT_LINE_JOIN
  }
}
