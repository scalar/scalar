import { selectedSecuritySchemeUidSchema } from '@/entities/shared/utility'
import { xScalarEnvironmentsSchema } from '@/entities/spec/x-scalar-environments'
import { xScalarSecretsSchema } from '@/entities/spec/x-scalar-secrets'
import { oasSecurityRequirementSchema } from '@scalar/types/entities'
import { type ENTITY_BRANDS, nanoidSchema } from '@scalar/types/utils'
import { z } from 'zod'

import { oasExternalDocumentationSchema, oasInfoSchema } from './spec-objects'

export const oasCollectionSchema = z.object({
  /**
   * @deprecated
   *
   * Needs to be remove as it is not a spec property
   */
  'type': z.literal('collection').optional().default('collection'),
  'openapi': z
    .union([z.string(), z.literal('3.0.0'), z.literal('3.1.0'), z.literal('4.0.0')])
    .optional()
    .default('3.1.0'),
  'jsonSchemaDialect': z.string().optional(),
  'info': oasInfoSchema.catch({
    title: 'API',
    version: '1.0',
  }),
  /**
   * A declaration of which security mechanisms can be used across the API. The list of
   * values includes alternative security requirement objects that can be used. Only
   * one of the security requirement objects need to be satisfied to authorize a request.
   * Individual operations can override this definition. To make security optional, an empty
   * security requirement ({}) can be included in the array.
   */
  'security': z.array(oasSecurityRequirementSchema).optional().default([]),
  'externalDocs': oasExternalDocumentationSchema.optional().catch(undefined),
  /** TODO: Type these */
  'components': z.record(z.string(), z.unknown()).optional(),
  /** TODO: Type these */
  'webhooks': z.record(z.string(), z.unknown()).optional(),
  /** A custom icon representing the collection */
  'x-scalar-icon': z.string().optional().default('interface-content-folder'),
  'x-scalar-active-environment': z.string().optional(),
  'x-scalar-environments': xScalarEnvironmentsSchema.optional(),
  'x-scalar-secrets': xScalarSecretsSchema.optional(),
  // These properties will be stripped out and mapped back as id lists
  // servers
  // paths/**
  // servers
  // tags
  // security
})

export const extendedCollectionSchema = z.object({
  uid: nanoidSchema.brand<ENTITY_BRANDS['COLLECTION']>(),
  /** A list of security schemes UIDs associated with the collection */
  securitySchemes: z.string().array().default([]),
  /** List of currently selected security scheme UIDs, these can be overridden per request */
  selectedSecuritySchemeUids: selectedSecuritySchemeUidSchema,
  /** The currently selected server */
  selectedServerUid: z.string().brand<ENTITY_BRANDS['SERVER']>().optional(),
  /** UIDs which refer to servers on the workspace base */
  servers: z.string().brand<ENTITY_BRANDS['SERVER']>().array().default([]),
  /** Request UIDs associated with a collection */
  requests: z.string().brand<ENTITY_BRANDS['OPERATION']>().array().default([]),
  /** Tag UIDs associated with the collection */
  tags: z.string().brand<ENTITY_BRANDS['TAG']>().array().default([]),
  /** List of requests without tags and top level tag "folders" */
  children: z
    .union([z.string().brand<ENTITY_BRANDS['OPERATION']>(), z.string().brand<ENTITY_BRANDS['TAG']>()])
    .array()
    .default([]),
  /**
   * A link to where this document is stored
   *
   * - Used for watch mode
   * - Possibly useful for Git sync down the line
   */
  documentUrl: z.string().optional(),
  /**
   * Enables polling of OpenAPI document urls
   *
   * @remarks Only effective when `documentUrl` is set
   */
  watchMode: z.boolean().optional().default(false),
  /** Keeps track of which integration is associated with the specific collection */
  integration: z.string().nullable().optional(),
  /**
   * Selected authentication will be set at the collection level instead of the request level
   *
   * @default false
   */
  useCollectionSecurity: z.boolean().optional().default(false),
  /**
   * Status of the watcher from above
   *
   * @defaults to idle for all collections, doesn't mean that it can watch for changes
   */
  watchModeStatus: z.enum(['IDLE', 'WATCHING', 'ERROR']).optional().default('IDLE'),
})

export const collectionSchema = oasCollectionSchema.merge(extendedCollectionSchema)
export type Collection = z.infer<typeof collectionSchema>
export type CollectionPayload = z.input<typeof collectionSchema>
