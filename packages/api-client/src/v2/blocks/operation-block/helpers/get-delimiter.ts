/**
 * Gets the delimiter for the given parameter style
 *
 * @param style - The style of the parameter
 * @returns The delimiter for the given style
 */
export const getDelimiter = (style: string): string => {
  switch (style) {
    // color=blue black brown
    case 'spaceDelimited':
      return ' '
    // color=blue|black|brown
    case 'pipeDelimited':
      return '|'
    // color=blue,black,brown
    case 'form':
    default:
      return ','
  }
}
