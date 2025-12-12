/**
 * Execute the built fetch request
 *
 * @param request The built fetch request
 * @returns The response from the fetch request
 */
export const sendRequest = (request: Request) => {
  return fetch(request)
}
