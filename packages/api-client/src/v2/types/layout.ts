/**
 * The layout of the client
 *  - modal: has no router, just sets active entities directly
 *  - web: uses the standard HTML5 history API
 *  - desktop: the electron app, uses the file routing API
 *
 * @default 'desktop'
 */
export type ClientLayout = 'modal' | 'web' | 'desktop'
