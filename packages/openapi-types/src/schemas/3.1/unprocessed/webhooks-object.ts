import { z } from 'zod'
import { PathItemObjectSchemaWithoutCallbacks } from './path-item-object-without-callbacks'

/**
 * Webhooks Object
 *
 * The incoming webhooks that MAY be received as part of this API and that the API consumer MAY choose to implement.
 * Closely related to the callbacks feature, this section describes requests initiated other than by an API call, for
 * example by an out of band registration.
 *
 * The key name is a unique string to refer to each webhook, while the
 * (optionally referenced) Path Item Object describes a request that may be initiated by the API provider and the
 * expected responses. An example is available.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#oas-webhooks
 */
export const WebhooksObjectSchema = z.record(z.string(), PathItemObjectSchemaWithoutCallbacks)
