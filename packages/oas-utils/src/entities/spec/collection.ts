import { nanoidSchema } from '@/entities/shared'
import { z } from 'zod'

import { oasSecurityRequirementSchema } from './security'
import { oasExternalDocumentationSchema, oasInfoSchema } from './spec-objects'

const oasCollectionSchema = z.object({
  type: z.literal('collection').optional().default('collection'),
  openapi: z
    .union([
      z.string(),
      z.literal('3.0.0'),
      z.literal('3.1.0'),
      z.literal('4.0.0'),
    ])
    .optional()
    .default('3.1.0'),
  jsonSchemaDialect: z.string().optional(),
  info: oasInfoSchema.optional(),
  /**
   * A declaration of which security mechanisms can be used across the API. The list of
   * values includes alternative security requirement objects that can be used. Only
   * one of the security requirement objects need to be satisfied to authorize a request.
   * Individual operations can override this definition. To make security optional, an empty
   * security requirement ({}) can be included in the array.
   */
  security: z.array(oasSecurityRequirementSchema).optional().default([]),
  externalDocs: oasExternalDocumentationSchema.optional(),
  /** TODO: Type these */
  components: z.record(z.string(), z.unknown()).optional(),
  /** TODO: Type these */
  webhooks: z.record(z.string(), z.unknown()).optional(),
  // These properties will be stripped out and mapped back as id lists
  // servers
  // paths/**
  // servers
  // tags
  // security
})

export const extendedCollectionSchema = z.object({
  uid: nanoidSchema,
  /** A list of security schemes UIDs associated with the collection */
  securitySchemes: z.string().array().default([]),
  /** The currently selected server */
  selectedServerUid: z.string().default(''),
  /** UIDs which refer to servers on the workspace base */
  servers: nanoidSchema.array().default([]),
  /** Request UIDs associated with a collection */
  requests: nanoidSchema.array().default([]),
  /** Tag UIDs associated with the collection */
  tags: nanoidSchema.array().default([]),
  /** List of requests without tags and top level tag "folders" */
  children: nanoidSchema.array().default([]),
})

export const collectionSchema = oasCollectionSchema.merge(
  extendedCollectionSchema,
)
export type Collection = z.infer<typeof collectionSchema>
export type CollectionPayload = z.input<typeof collectionSchema>
