import { EncodingObjectSchema as E } from '@/schemas/v3.1/strict/encoding'
import { HeaderObjectSchema as H } from '@/schemas/v3.1/strict/header'
import { MediaTypeObjectSchema as M } from '@/schemas/v3.1/strict/media-type'
import { Type, type Static } from '@scalar/typebox'

const module = Type.Module({
  Encoding: E,
  Header: H,
  MediaType: M,
})

export const EncodingObjectSchema = module.Import('Encoding')

export const HeaderObjectSchema = module.Import('Header')

export const MediaTypeObjectSchema = module.Import('MediaType')

export type HeaderObject = Static<typeof H>

export type MediaTypeObject = Static<typeof M>

export type EncodingObject = Static<typeof E>
