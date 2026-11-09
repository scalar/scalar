import type * as protobuf from 'proto-parser'

import { type Definition, isEnum, isMessage } from './ast'

const int32Min = -2147483648
const int32Max = 2147483647
const fieldMax = 536870911

/** proto-parser stores parsed reserved ranges with inclusive endpoints. Check after all declarations. */
const isReserved = (
  definition: protobuf.MessageDefinition | protobuf.EnumDefinition,
  name: string,
  id: number,
): boolean =>
  definition.reserved?.some((range) =>
    typeof range === 'string'
      ? range === name
      : range[0] !== undefined && range[1] !== undefined && range[0] <= id && id <= range[1],
  ) ?? false

const validateReservations = (definition: protobuf.MessageDefinition | protobuf.EnumDefinition): void => {
  const minimum = isEnum(definition) ? int32Min : 1
  const maximum = isEnum(definition) ? int32Max : fieldMax
  for (const range of definition.reserved ?? []) {
    // proto-parser collapses enum `max` to the field-number limit; the original endpoint is lost.
    if (isEnum(definition) && typeof range !== 'string' && range[1] === fieldMax) {
      throw new Error('Ambiguous Protobuf enum reserved endpoint')
    }
    if (
      typeof range !== 'string' &&
      (range[0] === undefined ||
        range[1] === undefined ||
        range[0] < minimum ||
        range[1] > maximum ||
        range[0] > range[1])
    ) {
      throw new Error('Invalid Protobuf reserved range')
    }
  }
}

/** Reject options whose semantics the documentation adapter does not understand. */
export const checkOptions = (options: Record<string, unknown> | undefined, allowed?: readonly string[]): void => {
  for (const [key, value] of Object.entries(options ?? {})) {
    if (key.startsWith('(') || (allowed && !allowed.includes(key))) {
      throw new Error('Unsupported Protobuf option')
    }
    if (['deprecated', 'allow_alias', 'packed', 'proto3_optional'].includes(key) && typeof value !== 'boolean') {
      throw new Error('Invalid Protobuf boolean option')
    }
    if (key === 'json_name' && typeof value !== 'string') {
      throw new Error('Invalid Protobuf JSON name')
    }
  }
}

/** Enum symbols share the enclosing namespace, rather than introducing their own scope. */
export const validateNamespace = (namespace: Definition): void => {
  checkOptions(namespace.options)
  const names = new Set(
    Object.values(('nested' in namespace ? namespace.nested : undefined) ?? {}).map(({ name }) => name),
  )
  const add = (name: string): void => {
    if (names.has(name)) {
      throw new Error('Conflicting Protobuf symbol')
    }
    names.add(name)
  }
  if (isMessage(namespace)) {
    validateReservations(namespace)
    for (const field of Object.values(namespace.fields)) {
      add(field.name)
      if (field.map) {
        const entryName = `${field.name.replace(/(^|_|[0-9])([a-z])/g, (_match, prefix: string, letter: string) => `${/^\d$/.test(prefix) ? prefix : ''}${letter.toUpperCase()}`).replaceAll('_', '')}Entry`
        add(entryName)
      }
    }
    for (const oneof of Object.values(namespace.oneofs ?? {})) {
      add(oneof.name)
      checkOptions(oneof.options, [])
    }
  }
  for (const nested of Object.values(('nested' in namespace ? namespace.nested : undefined) ?? {})) {
    if (isEnum(nested)) {
      for (const name of Object.keys(nested.values)) {
        add(name)
      }
    }
  }
}

/** Enforce enum value and reservation rules that syntax parsing alone does not guarantee. */
export const validateEnum = (definition: protobuf.EnumDefinition, version: string): void => {
  validateReservations(definition)
  checkOptions(definition.options, ['allow_alias', 'deprecated'])
  const values = Object.entries(definition.values)
  if (!values.length || (version === '3' && values[0]?.[1] !== 0)) {
    throw new Error('Invalid Protobuf first enum value')
  }
  for (const [name, value] of values) {
    if (value < int32Min || value > int32Max || isReserved(definition, name, value)) {
      throw new Error('Invalid or reserved Protobuf enum value')
    }
    checkOptions(definition.valuesOptions?.[name], ['deprecated'])
  }
}

const validDefault = (field: protobuf.FieldDefinition, target: Definition | null, value: unknown): boolean => {
  if (isEnum(target)) {
    return typeof value === 'string' && Object.hasOwn(target.values, value)
  }
  if (field.type.value === 'bool') {
    return typeof value === 'boolean'
  }
  if (['string', 'bytes'].includes(field.type.value)) {
    return typeof value === 'string'
  }
  if (['double', 'float'].includes(field.type.value)) {
    return typeof value === 'number'
  }
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    return false
  }
  if (['uint32', 'fixed32'].includes(field.type.value)) {
    return value >= 0 && value <= 4294967295
  }
  if (['int32', 'sint32', 'sfixed32'].includes(field.type.value)) {
    return value >= int32Min && value <= int32Max
  }
  // Source fallback preserves 64-bit defaults beyond JavaScript's exact numeric range.
  return !['uint64', 'fixed64'].includes(field.type.value) || value >= 0
}

/** Check semantic field restrictions without resolving features or generating constructors. */
export const validateField = (
  definition: protobuf.MessageDefinition,
  field: protobuf.FieldDefinition,
  target: Definition | null,
  version: string,
): void => {
  if (
    (version === '3' && field.rule === 'required') ||
    field.id < 1 ||
    field.id > fieldMax ||
    (field.id >= 19000 && field.id <= 19999) ||
    isReserved(definition, field.name, field.id)
  ) {
    throw new Error('Invalid or reserved Protobuf field number or name')
  }
  const options: Record<string, unknown> = field.options ?? {}
  checkOptions(options, ['default', 'packed', 'deprecated', 'json_name', 'proto3_optional'])
  if (
    options.packed !== undefined &&
    (!field.repeated || ['string', 'bytes'].includes(field.type.value) || isMessage(target))
  ) {
    throw new Error('Only repeated numeric and enum fields can be packed')
  }
  if (
    Object.hasOwn(options, 'default') &&
    (version !== '2' ||
      field.repeated ||
      Object.values(definition.oneofs ?? {}).some((oneof) => oneof.oneof.includes(field.name)) ||
      field.map ||
      isMessage(target) ||
      !validDefault(field, target, options.default))
  ) {
    throw new Error('Invalid Protobuf default')
  }
}
