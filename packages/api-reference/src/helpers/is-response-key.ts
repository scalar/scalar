/** Checks whether a key in an OpenAPI Responses Object identifies a response. */
export const isResponseKey = (key: string): boolean => key === 'default' || /^[1-5](?:[0-9]{2}|XX)$/.test(key)
