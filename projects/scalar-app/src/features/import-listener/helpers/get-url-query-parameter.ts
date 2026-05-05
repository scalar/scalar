/**
 * Gets the value of a specific query parameter from the current URL.
 *
 * @param parameterName - The name of the query parameter to retrieve
 * @returns The value of the query parameter, or null if it does not exist
 */
export const getUrlQueryParameter = (parameterName: string): string | null => {
  const queryParameters = new URLSearchParams(window.location.search)
  return queryParameters.get(parameterName)
}
