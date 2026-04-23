import { createElement } from 'react'

/**
 * Keep the React Server Components export lightweight.
 * This avoids pulling the full client runtime into server tracing.
 */
export const ApiReferenceReact = () => createElement('div')
