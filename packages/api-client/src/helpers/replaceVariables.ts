/**
 * Replaces variables in a url with the values provided.
 */
export const replaceVariables = (
  url: string,
  variables: Record<string, string | number>,
) => {
  return Object.entries(variables).reduce((acc, [key, value]) => {
    return acc.replace(`{${key}}`, value.toString())
  }, url)
}
