/** Event definitions for the operation */
export type OperationEvents = {
  /**
   * Update the selected example for the operation
   *
   * @param name - The name of the example to select
   */
  'update:selected-example': {
    name: string
  }
}
