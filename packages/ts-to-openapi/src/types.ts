/** Takes in two file names and returns a string which resolves to a path for the targetsFileName */
export type FileNameResolver = (
  sourceFileName: string,
  targetFileName: string,
) => string
