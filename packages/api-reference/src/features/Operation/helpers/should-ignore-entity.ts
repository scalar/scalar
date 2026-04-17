/**
 * Check if an entity should be ignored
 */
export const shouldIgnoreEntity = (data: { 'x-internal'?: boolean; 'x-scalar-ignore'?: boolean }) =>
  Boolean(data?.['x-internal'] || data?.['x-scalar-ignore'])
