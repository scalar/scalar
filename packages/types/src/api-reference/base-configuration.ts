import z from 'zod'

import { apiClientPluginSchema } from './api-client-plugin'

export const OLD_PROXY_URL = 'https://api.scalar.com/request-proxy'
export const NEW_PROXY_URL = 'https://proxy.scalar.com'

/** Shared configuration for the Api Reference and Api Client */
export const baseConfigurationSchema = z.object({
  /**
   * The title of the OpenAPI document.
   *
   * @example 'Scalar Galaxy'
   */
  title: z.string().optional(),
  /**
   * The slug of the OpenAPI document used in the URL.
   *
   * If none is passed, the title will be used.
   *
   * If no title is used, it'll just use the index.
   *
   * @example 'scalar-galaxy'
   */
  slug: z.string().optional(),
  /** Prefill authentication */
  authentication: z.any().optional(), // Temp until we bring in the new auth
  /** Base URL for the API server */
  baseServerURL: z.string().optional(),
  /**
   * Whether to hide the client button
   * @default false
   */
  hideClientButton: z.boolean().optional().default(false).catch(false),
  /** URL to a request proxy for the API client */
  proxyUrl: z.string().optional(),
  /** Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k) */
  searchHotKey: z
    .enum([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z',
    ])
    .optional(),
  /** List of OpenAPI server objects */
  servers: z.array(z.any()).optional(), // Using any for OpenAPIV3_1.ServerObject
  /**
   * Whether to show the sidebar
   * @default true
   */
  showSidebar: z.boolean().optional().default(true).catch(true),
  /**
   * Sets the visibility of the developer tools
   * @default 'localhost' to only show the toolbar on localhost or similar hosts
   */
  showToolbar: z.enum(['always', 'localhost', 'never']).optional().default('localhost').catch('localhost'),
  /**
   * Whether to use the operation summary or the operation path for the sidebar and search
   * @default 'summary'
   */
  operationTitleSource: z.enum(['summary', 'path']).optional().default('summary').catch('summary'),
  /** A string to use one of the color presets */
  theme: z
    .enum([
      'alternate',
      'default',
      'moon',
      'purple',
      'solarized',
      'bluePlanet',
      'deepSpace',
      'saturn',
      'kepler',
      'elysiajs',
      'fastify',
      'mars',
      'laserwave',
      'none',
    ])
    .optional()
    .default('default')
    .catch('default'),
  /** Integration type identifier */
  _integration: z
    .enum([
      'adonisjs',
      'docusaurus',
      'dotnet',
      'elysiajs',
      'express',
      'fastapi',
      'fastify',
      'go',
      'hono',
      'html',
      'laravel',
      'litestar',
      'nestjs',
      'nextjs',
      'nitro',
      'nuxt',
      'platformatic',
      'react',
      'rust',
      'svelte',
      'vue',
    ])
    .nullable()
    .optional(),
  /** onRequestSent is fired when a request is sent */
  onRequestSent: z
    .function({
      input: [z.string()],
      output: z.void(),
    })
    .optional(),
  /** Whether to persist auth to local storage */
  persistAuth: z.boolean().optional().default(false).catch(false),
  /** Plugins for the API client */
  plugins: z.array(apiClientPluginSchema).optional(),
  /** Enables / disables telemetry*/
  telemetry: z.boolean().optional().default(true),
})
