import { ComponentsObjectSchema as OriginalComponentsObjectSchema } from '../processed/components-object'

/**
 * Components Object
 *
 * Holds a set of reusable objects for different aspects of the OAS. All objects defined within the Components Object
 * will have no effect on the API unless they are explicitly referenced from outside the Components Object.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#components-object
 */
export const ComponentsObjectSchema = OriginalComponentsObjectSchema
