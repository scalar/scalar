import { any, array, boolean, fn, literal, nullable, object, optional, string, union } from "@scalar/validation";

const externalUrlsSchema = object({
  dashboardUrl: string({ default: 'https://dashboard.scalar.com' }),
  registryUrl: string({ default: 'https://registry.scalar.com' }),
  proxyUrl: string({ default: 'https://proxy.scalar.com' }),
  apiBaseUrl: string({ default: 'https://api.scalar.com' }),
}, {
  typeComment: 'External service URLs used by Scalar packages',
})

export const baseConfigurationSchema = object({
  title: optional(string(), {
    typeComment: 'The title of the OpenAPI document.',
  }),
  slug: optional(string(), {
    typeComment: 'The slug of the OpenAPI document used in the URL. If none is passed, the title will be used. If no title is used, it will just use the index.',
  }),
  authentication: optional(any(), {
    typeComment: 'Prefill authentication',
  }),
  baseServerURL: optional(string(), {
    typeComment: 'Base URL for the API server',
  }),
  hideClientButton: boolean({
    default: false,
    typeComment: 'Whether to hide the client button',
  }),
  proxyUrl: optional(string(), {
    typeComment: 'URL to a request proxy for the API client',
  }),
  oauth2RedirectUri: optional(string(), {
    typeComment: 'Default OAuth 2.0 redirect URI used to prefill auth flows in the API client.',
  }),
  searchHotKey: optional(union([
    literal('a'),
    literal('b'),
    literal('c'),
    literal('d'),
    literal('e'),
    literal('f'),
    literal('g'),
    literal('h'),
    literal('i'),
    literal('j'),
    literal('k'),
    literal('l'),
    literal('m'),
    literal('n'),
    literal('o'),
    literal('p'),
    literal('q'),
    literal('r'),
    literal('s'),
    literal('t'),
    literal('u'),
    literal('v'),
    literal('w'),
    literal('x'),
    literal('y'),
    literal('z'),
  ]), {
    typeComment: 'Key used with CTRL/CMD to open the search modal (defaults to \'k\' e.g. CMD+k)',
  }),
  servers: optional(array(any()), {
    typeComment: 'List of OpenAPI server objects',
  }),
  showSidebar: boolean({
    default: true,
    typeComment: 'Whether to show the sidebar',
  }),
  showDeveloperTools: union([
    literal('localhost'),
    literal('always'),
    literal('never'),
  ], {
    typeComment: 'Whether and when to show the developer tools.',
  }),
  showToolbar: union([
    literal('localhost'),
    literal('always'),
    literal('never'),
  ], {
    typeComment: '@deprecated Use showDeveloperTools instead',
  }),
  operationTitleSource: union([
    literal('summary'),
    literal('path'),
  ], {
    typeComment: 'Whether to use the operation summary or the operation path for the sidebar and search',
  }),
  theme: union([
    literal('default'),
    literal('alternate'),
    literal('moon'),
    literal('purple'),
    literal('solarized'),
    literal('bluePlanet'),
    literal('deepSpace'),
    literal('saturn'),
    literal('kepler'),
    literal('elysiajs'),
    literal('fastify'),
    literal('mars'),
    literal('laserwave'),
    literal('none'),
  ], {
    typeComment: 'A string to use one of the color presets',
  }),
  _integration: optional(union([
    literal('adonisjs'),
    literal('astro'),
    literal('docusaurus'),
    literal('dotnet'),
    literal('elysiajs'),
    literal('express'),
    literal('fastapi'),
    literal('fastify'),
    literal('go'),
    literal('hono'),
    literal('html'),
    literal('laravel'),
    literal('litestar'),
    literal('nestjs'),
    literal('nextjs'),
    literal('nitro'),
    literal('nuxt'),
    literal('platformatic'),
    literal('react'),
    literal('rust'),
    literal('svelte'),
    literal('vue'),
    nullable()
  ]), {
    typeComment: 'Integration type identifier',
  }),
  onRequestSent: optional(fn<(input: string) => void>(), {
    typeComment: 'onRequestSent is fired when a request is sent',
  }),
  persistAuth: boolean({
    default: false,
    typeComment: 'Whether to persist auth to local storage',
  }),
  telemetry: boolean({
    default: true,
    typeComment: 'Enables / disables telemetry',
  }),
  externalUrls: externalUrlsSchema,
})