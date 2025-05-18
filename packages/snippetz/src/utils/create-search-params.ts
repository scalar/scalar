import type { HarRequest } from '@scalar/types/snippetz'

/** Creates a new URL search params object and sets query params so we can handle arrays */
export const createSearchParams = (query: HarRequest['queryString'] = []) => {
  const searchParams = new URLSearchParams()
  query.forEach((q) => {
    searchParams.append(q.name, q.value)
  })
  return searchParams
}
