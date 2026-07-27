import type { CollectionFormatObject } from './collection-format.js'
import type { DefaultObject } from './default.js'
import type { EnumObject } from './enum.js'
import type { ExclusiveMaximumObject } from './exclusive-maximum.js'
import type { ExclusiveMinimumObject } from './exclusive-minimum.js'
import type { MaxItemsObject } from './max-items.js'
import type { MaxLengthObject } from './max-length.js'
import type { MaximumObject } from './maximum.js'
import type { MinItemsObject } from './min-items.js'
import type { MinLengthObject } from './min-length.js'
import type { MinimumObject } from './minimum.js'
import type { MultipleOfObject } from './multiple-of.js'
import type { PatternObject } from './pattern.js'
import type { UniqueItemsObject } from './unique-items.js'
export type PrimitivesItemsObject = {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array'
  format?: string
  items?: PrimitivesItemsObject
  collectionFormat?: CollectionFormatObject
  default?: DefaultObject
  maximum?: MaximumObject
  exclusiveMaximum?: ExclusiveMaximumObject
  minimum?: MinimumObject
  exclusiveMinimum?: ExclusiveMinimumObject
  maxLength?: MaxLengthObject
  minLength?: MinLengthObject
  pattern?: PatternObject
  maxItems?: MaxItemsObject
  minItems?: MinItemsObject
  uniqueItems?: UniqueItemsObject
  enum?: EnumObject
  multipleOf?: MultipleOfObject
}
