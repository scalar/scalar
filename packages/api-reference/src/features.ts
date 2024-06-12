/**
 * We’re slowly switching from `@scalar/api-client@1.x` to 2.0, currently living in `packages/client-app`.
 *
 * To enable the new API client, copy `packages/api-reference/.env.example` to `packages/api-reference/.env`
 * and set `NEW_API_CLIENT=true`.
 **/
export const NEW_API_MODAL = import.meta.env.VITE_NEW_API_CLIENT === 'true'
