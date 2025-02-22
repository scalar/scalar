/**
 * Aliases Request to Operation which is closer to the spec,
 * also will not conflict with the builtin Request class
 */
import { type RequestPayload, type Request as RequestType, requestSchema } from './requests'

export type Operation = RequestType
export type OperationPayload = RequestPayload
export const operationSchema = requestSchema
