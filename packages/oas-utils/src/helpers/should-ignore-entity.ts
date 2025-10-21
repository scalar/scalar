/**
 * Check if an entity should be ignored
 */
export const shouldIgnoreEntity = (data: { 'x-internal'?: boolean; 'x-scalar-ignore'?: boolean }) =>
  data?.['x-internal'] === true || data?.['x-scalar-ignore'] === true
