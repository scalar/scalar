import type { ScalarIcon } from '@scalar/components/icon'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

type Integration = NonNullable<ApiReferenceConfiguration['_integration']>
type Logo = NonNullable<InstanceType<typeof ScalarIcon>['$props']['logo']>

/** A server framework an API can run on Scalar, as the developer tools name and show it */
type ServerFramework = {
  name: string
  logo: Logo
}

/**
 * The server frameworks an API can run on Scalar, keyed by the integration that serves the reference.
 * Integrations that only render documentation (Docusaurus, Astro, React, Vue, Svelte, plain HTML)
 * are not in here, so Deploy talks about the API in general for them.
 */
const SERVER_FRAMEWORKS: Partial<Record<Integration, ServerFramework>> = {
  adonisjs: { name: 'AdonisJS', logo: 'Adonisjs' },
  dotnet: { name: '.NET', logo: 'Dotnet' },
  elysiajs: { name: 'Elysia', logo: 'Elysiajs' },
  express: { name: 'Express', logo: 'Express' },
  fastapi: { name: 'FastAPI', logo: 'Fastapi' },
  fastify: { name: 'Fastify', logo: 'Fastify' },
  go: { name: 'Go', logo: 'Go' },
  hono: { name: 'Hono', logo: 'Hono' },
  laravel: { name: 'Laravel', logo: 'Laravel' },
  litestar: { name: 'Litestar', logo: 'Litestar' },
  nestjs: { name: 'NestJS', logo: 'Nestjs' },
  nextjs: { name: 'Next.js', logo: 'Nextjs' },
  nitro: { name: 'Nitro', logo: 'Nitro' },
  nuxt: { name: 'Nuxt', logo: 'Nuxt' },
  platformatic: { name: 'Platformatic', logo: 'Platformatic' },
  rust: { name: 'Rust', logo: 'Rust' },
}

/** The server framework behind an integration, or undefined when the reference is not served by one */
export const getServerFramework = (
  integration: ApiReferenceConfiguration['_integration'] | undefined,
): ServerFramework | undefined => (integration ? SERVER_FRAMEWORKS[integration] : undefined)
