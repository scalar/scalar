import { unescapeJsonPointer } from '@scalar/helpers/json/unescape-json-pointer'
import { isObject } from '@scalar/helpers/object/is-object'

import { type DynamicScope, isDynamicRef, pushDynamicScope, resolveDynamicRef } from '@/helpers/dynamic-ref'
import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'
import type { SchemaObject } from '@/schemas/v3.2/strict/openapi-document'
import type { XMLObject } from '@/schemas/v3.2/strict/xml'

import {
  EXAMPLE_EVALUATION,
  type ExampleEvaluation,
  type ExampleEvaluationState,
} from '../builder/helpers/example-evaluation'
import {
  type GetExampleFromSchemaOptions,
  getExampleFromSchema,
  selectExampleComposition,
} from '../builder/helpers/get-example-from-schema'
import { matchXmlPropertyPattern } from './match-xml-property-pattern'
import { type WriteXmlOptions, writeXml } from './write-xml'
import type { XmlAttribute, XmlDiagnostic, XmlExampleResult, XmlName, XmlNode } from './xml-node'

/** XML options share the data generator's value and branch-selection policies. */
export type XmlExampleOptions = Omit<GetExampleFromSchemaOptions, 'xml' | typeof EXAMPLE_EVALUATION> &
  WriteXmlOptions & {
    /** Version-specific XML defaults. Existing descriptions default to OpenAPI 3.1 behavior. */
    openapiVersion?: string
    /** Context retained by callers before resolving a component reference. */
    rootName?: string
    /** Keep composition-selection keys aligned with the request editor. */
    schemaPath?: string[]
    /** Receives diagnostics; errors otherwise appear in the developer console instead of failing silently. */
    onDiagnostic?: (diagnostic: XmlDiagnostic) => void
  }

type XmlSchema = SchemaObject & { xml?: XMLObject }
type Context = { path: string[]; scope: DynamicScope; evaluation?: ExampleEvaluation; depth: number }
type Shape = { schema: XmlSchema; scope: DynamicScope; evaluations: ExampleEvaluation[] }
const xsi = 'http://www.w3.org/2001/XMLSchema-instance'

/** Keep failures visible even when a consumer only reads the XML string. */
const reportXmlResult = (result: XmlExampleResult, options: XmlExampleOptions): XmlExampleResult => {
  for (const diagnostic of result.diagnostics) {
    if (options.onDiagnostic) {
      options.onDiagnostic(diagnostic)
    } else if (diagnostic.severity === 'error') {
      console.warn('Unable to generate an XML example:', diagnostic)
    }
  }
  return result
}

/** Generate XML using the same value evaluator and selected branches as JSON examples. */
export const getXmlExampleFromSchema = (schema: SchemaObject, options: XmlExampleOptions = {}): XmlExampleResult => {
  const capture: ExampleEvaluationState = { stack: [] }
  const value = getExampleFromSchema(
    schema,
    { ...options, [EXAMPLE_EVALUATION]: capture },
    { schemaPath: options.schemaPath },
  )
  return reportXmlResult(buildXmlExample(value, schema, options, capture.root), options)
}

/** Serialize schema-ready example data. Serialized XML strings bypass this function at the media boundary. */
export const serializeXmlExample = (
  value: unknown,
  schema: SchemaObject,
  options: XmlExampleOptions = {},
): XmlExampleResult => reportXmlResult(buildXmlExample(value, schema, options), options)

const buildXmlExample = (
  value: unknown,
  input: SchemaObject,
  options: XmlExampleOptions,
  evaluation?: ExampleEvaluation,
): XmlExampleResult => {
  const diagnostics: XmlDiagnostic[] = []
  const report = (severity: XmlDiagnostic['severity'], code: string, message: string, path: string[]): void => {
    diagnostics.push({ severity, code, message, path })
  }
  const componentNameFromRef = (reference: string | undefined, path: string[]): string | undefined => {
    const name = reference?.match(/\/schemas\/([^/]+)$/)?.[1]
    if (name === undefined) {
      return undefined
    }
    try {
      return unescapeJsonPointer(name)
    } catch {
      report('error', 'invalid-reference', 'The component reference contains invalid URI escaping.', path)
      return undefined
    }
  }

  const mergeXml = (
    base: XMLObject | undefined,
    next: XMLObject | undefined,
    path: string[],
  ): XMLObject | undefined => {
    if (!base) {
      return next
    }
    if (!next) {
      return base
    }
    for (const key of ['name', 'namespace', 'prefix', 'nodeType', 'attribute', 'wrapped'] as const) {
      if (base[key] !== undefined && next[key] !== undefined && base[key] !== next[key]) {
        report('error', 'composition-xml-conflict', `Composition members disagree on xml.${key}.`, path)
      }
    }
    return { ...base, ...next }
  }
  const version32 = options.openapiVersion !== undefined && /^3\.[2-9](?:\.|$)/.test(options.openapiVersion)
  // Flatten composition contributions, keeping the evaluator's property provenance and branch choices.
  const shape = (source: SchemaObject, context: Context, seen = new Set<object>()): Shape => {
    if (!source || typeof source !== 'object' || seen.has(source) || seen.size > 50) {
      return { schema: {} as XmlSchema, scope: context.scope, evaluations: [] }
    }
    seen.add(source)
    if (!context.evaluation && '$ref' in source && !('$ref-value' in source && source['$ref-value'] !== undefined)) {
      report('error', 'unresolved-reference', 'Resolve schema references before generating XML.', context.path)
    }
    if (version32 && '$ref-value' in source && source['$ref-value']) {
      return { schema: source as XmlSchema, scope: context.scope, evaluations: context.evaluation?.children ?? [] }
    }
    let schema = getResolvedRef(source, mergeSiblingReferences) as XmlSchema
    if (isDynamicRef(schema)) {
      const bound = resolveDynamicRef(schema.$dynamicRef, context.scope)
      if (bound) {
        return shape(bound, context, seen)
      }
    }
    const scope = pushDynamicScope(context.scope, schema)
    const evaluations = [...(context.evaluation?.children ?? [])]
    const contributions =
      context.evaluation?.children.filter(
        (child) =>
          child.path.length === context.path.length ||
          (child.name === undefined &&
            child.path.length === context.path.length + 1 &&
            /^\d+$/.test(child.path.at(-1) ?? '')),
      ) ?? []
    const members: { schema: SchemaObject; path: string[]; evaluation?: ExampleEvaluation }[] = []
    const selectedSource = selectExampleComposition(schema, context.path, options, context.path.at(-1) === 'items')
    // Captured evaluations can retain a reference name after resolution. Check the
    // original selected members so unresolved references do not become null examples.
    for (const member of selectedSource ? [selectedSource] : (schema.allOf ?? [])) {
      if (member && '$ref' in member && !('$ref-value' in member && member['$ref-value'] !== undefined)) {
        report('error', 'unresolved-reference', 'Resolve schema references before generating XML.', context.path)
        return { schema, scope, evaluations }
      }
    }
    if (version32 && selectedSource) {
      members.push({ schema: selectedSource, path: context.path, evaluation: contributions[0] })
    } else if (contributions.length && !(version32 && schema.allOf)) {
      members.push(...contributions.map((child) => ({ schema: child.schema, path: child.path, evaluation: child })))
    } else {
      const selected = selectExampleComposition(schema, context.path, options, context.path.at(-1) === 'items')
      if (selected) {
        members.push({ schema: selected, path: context.path })
      } else if (schema.allOf) {
        let choice = 0
        for (const member of schema.allOf) {
          const resolved = getResolvedRef(member as SchemaObject, mergeSiblingReferences)
          const isChoice = resolved && (resolved.oneOf || resolved.anyOf)
          members.push({
            schema: member as SchemaObject,
            path: isChoice ? [...context.path, String(choice++)] : context.path,
          })
        }
      }
    }
    for (const member of members) {
      const contribution = shape(
        member.schema,
        { ...context, scope, path: member.path, evaluation: member.evaluation },
        new Set(seen),
      )
      const properties = 'properties' in schema ? schema.properties : undefined
      const extra = 'properties' in contribution.schema ? contribution.schema.properties : undefined
      const xml = mergeXml(schema.xml, contribution.schema.xml, context.path)
      const combinedProperties = { ...properties, ...extra }
      for (const key of Object.keys(properties ?? {})) {
        if (properties?.[key] && extra?.[key]) {
          combinedProperties[key] = { allOf: [properties[key], extra[key]] } as SchemaObject
        }
      }
      schema = {
        ...schema,
        ...contribution.schema,
        ...(properties || extra ? { properties: combinedProperties } : {}),
        xml,
      } as XmlSchema
      evaluations.push(...contribution.evaluations)
    }
    return { schema, scope, evaluations }
  }
  const active = new Set<object>()
  let count = 0
  const map = (
    data: unknown,
    source: SchemaObject,
    inheritedName: string | undefined,
    context: Context,
    parentAttributes: XmlAttribute[],
  ): XmlNode[] => {
    // Mapping receives original property/item schemas, before evaluator resolution can erase targets.
    if (source && '$ref' in source && !('$ref-value' in source && source['$ref-value'] !== undefined)) {
      report('error', 'unresolved-reference', 'Resolve schema references before generating XML.', context.path)
      return []
    }
    if (data === undefined) {
      return []
    }
    if (++count > 10000 || context.depth > 50) {
      report('error', 'limit-exceeded', 'The XML example exceeds the node or depth limit.', context.path)
      return []
    }
    // In 3.2 a reference site and its target can describe different XML nodes.
    // Resolving them into one object would erase an explicit wrapper or a transparent target.
    const referenceTarget = source && '$ref-value' in source ? source['$ref-value'] : undefined
    const dynamicTarget = isDynamicRef(source) ? resolveDynamicRef(source.$dynamicRef, context.scope) : undefined
    const target = referenceTarget ?? dynamicTarget
    if (version32 && target && typeof target === 'object') {
      const localXml = (source as XmlSchema).xml ?? {}
      const localKind = localXml.nodeType ?? (localXml.attribute ? 'attribute' : 'none')
      const referenceName =
        '$ref' in source && typeof source.$ref === 'string'
          ? componentNameFromRef(source.$ref, context.path)
          : undefined
      const attributes: XmlAttribute[] = localKind === 'none' ? parentAttributes : []
      const children = map(
        data,
        target as SchemaObject,
        referenceName ?? inheritedName,
        {
          ...context,
          depth: context.depth + 1,
          scope: pushDynamicScope(context.scope, source),
          evaluation: dynamicTarget ? context.evaluation?.children[0] : context.evaluation,
        },
        attributes,
      )
      if (localKind === 'none') {
        return children
      }
      if (localKind !== 'element') {
        report(
          'error',
          'reference-node-type',
          'A reference wrapper must be an element or a transparent node.',
          context.path,
        )
        return []
      }
      return [
        {
          type: 'element',
          name: localXml.name ?? inheritedName ?? 'root',
          namespace: localXml.namespace,
          prefix: localXml.prefix,
          attributes,
          children,
        },
      ]
    }
    const { schema, scope, evaluations } = shape(source, context)
    if (version32 && '$ref-value' in schema && schema['$ref-value']) {
      return map(
        data,
        schema,
        inheritedName,
        { ...context, scope, evaluation: undefined, depth: context.depth + 1 },
        parentAttributes,
      )
    }
    if (
      schema.deprecated ||
      (options.mode === 'write' && schema.readOnly) ||
      (options.mode === 'read' && schema.writeOnly)
    ) {
      return []
    }
    const xml = schema.xml ?? {}
    if (xml.namespace !== undefined && !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(xml.namespace)) {
      report('error', 'relative-namespace', 'XML namespaces must be non-relative IRIs.', context.path)
    }
    if (xml.nodeType !== undefined && (xml.attribute !== undefined || xml.wrapped !== undefined)) {
      report(
        'error',
        'conflicting-node-type',
        'xml.nodeType cannot be combined with xml.attribute or xml.wrapped.',
        context.path,
      )
    }
    if (xml.nodeType && options.openapiVersion && !/^3\.[2-9](?:\.|$)/.test(options.openapiVersion)) {
      report('warning', 'xml-version', 'xml.nodeType requires OpenAPI 3.2.', context.path)
    }
    const kind =
      xml.nodeType ?? (xml.attribute ? 'attribute' : Array.isArray(data) && !xml.wrapped ? 'none' : 'element')
    const selectedComponentName =
      context.depth === 0 && '$ref' in schema && typeof schema.$ref === 'string'
        ? componentNameFromRef(schema.$ref, context.path)
        : undefined
    const nodeName =
      kind === 'none' || kind === 'text' || kind === 'cdata'
        ? inheritedName
        : (xml.name ?? inheritedName ?? selectedComponentName)
    const name: XmlName = { name: nodeName ?? 'root', namespace: xml.namespace, prefix: xml.prefix }
    if (kind === 'attribute') {
      if (data === null) {
        report('warning', 'null-attribute', 'A null XML attribute is omitted.', context.path)
      } else if (typeof data === 'object') {
        report('error', 'attribute-value', 'An XML attribute requires a primitive value.', context.path)
      } else {
        parentAttributes.push({ ...name, value: String(data) })
      }
      return []
    }
    if (kind === 'text' || kind === 'cdata') {
      if (data !== null && typeof data !== 'object') {
        return [{ type: kind, value: String(data) }]
      }
      report('error', 'text-value', 'XML text and CDATA require a non-null primitive value.', context.path)
      return []
    }
    if (typeof data === 'object' && data !== null) {
      if (active.has(data)) {
        report('error', 'circular-value', 'The supplied XML example contains a circular value.', context.path)
        return []
      }
      active.add(data)
    }
    const attributes: XmlAttribute[] = kind === 'none' ? parentAttributes : []
    const children: XmlNode[] = []
    if (data === null) {
      if (kind === 'none') {
        report('error', 'null-fragment', 'A null value cannot be represented by an XML fragment.', context.path)
      } else {
        attributes.push({ name: 'nil', prefix: 'xsi', namespace: xsi, value: 'true' })
      }
    } else if (Array.isArray(data)) {
      const prefixes = 'prefixItems' in schema ? schema.prefixItems : undefined
      const itemSchema = 'items' in schema && typeof schema.items === 'object' ? schema.items : {}
      for (let index = 0; index < data.length; index++) {
        if (count > 10000) {
          break
        }
        const itemPath = prefixes?.[index]
          ? [...context.path, 'prefixItems', String(index)]
          : [...context.path, 'items']
        const itemEvaluations = evaluations.filter((child) => child.path.join('.') === itemPath.join('.'))
        const itemEvaluation = itemEvaluations.length === data.length ? itemEvaluations[index] : itemEvaluations[0]
        children.push(
          ...map(
            data[index],
            (prefixes?.[index] ?? itemSchema) as SchemaObject,
            inheritedName ?? nodeName,
            {
              path: itemPath,
              scope: itemEvaluation?.dynamicScope ?? scope,
              evaluation: itemEvaluation,
              depth: context.depth + 1,
            },
            attributes,
          ),
        )
      }
    } else if (isObject(data)) {
      const properties = 'properties' in schema ? schema.properties : undefined
      const evaluationByName = new Map(evaluations.map((child) => [child.name ?? child.path.at(-1), child]))
      for (const [key, childValue] of Object.entries(data)) {
        if (count > 10000) {
          break
        }
        const childEvaluation = evaluationByName.get(key)
        const additional =
          'additionalProperties' in schema && typeof schema.additionalProperties === 'object'
            ? schema.additionalProperties
            : undefined
        const property = properties?.[key]
        const patterns = 'patternProperties' in schema ? schema.patternProperties : undefined
        const matchingPatterns = Object.entries(patterns ?? {}).flatMap(([pattern, patternSchema]) => {
          const matches = matchXmlPropertyPattern(pattern, key)
          if (matches === undefined) {
            report('error', 'unsupported-pattern', 'Property patterns must use the bounded XML matching subset.', [
              ...context.path,
              key,
            ])
          }
          return matches ? [patternSchema] : []
        })
        const propertySchemas = [...(property ? [property] : []), ...matchingPatterns]
        const childSchema = (
          propertySchemas.length > 1
            ? { allOf: propertySchemas }
            : (propertySchemas[0] ?? childEvaluation?.schema ?? additional ?? {})
        ) as SchemaObject
        const resolved = getResolvedRef(childSchema, mergeSiblingReferences)
        if (
          resolved?.deprecated ||
          (options.mode === 'write' && resolved?.readOnly) ||
          (options.mode === 'read' && resolved?.writeOnly)
        ) {
          continue
        }
        children.push(
          ...map(
            childValue,
            childSchema,
            key,
            {
              path: [...context.path, key],
              scope: childEvaluation?.dynamicScope ?? scope,
              evaluation: childEvaluation,
              depth: context.depth + 1,
            },
            attributes,
          ),
        )
      }
    } else {
      children.push({ type: 'text', value: String(data) })
    }
    if (typeof data === 'object' && data !== null) {
      active.delete(data)
    }
    return kind === 'none' ? children : [{ type: 'element', ...name, attributes, children }]
  }
  const reference = input && '$ref' in input && typeof input.$ref === 'string' ? input.$ref : undefined
  const componentName = componentNameFromRef(reference, options.schemaPath ?? [])
  const rootName = options.rootName ?? componentName
  const rootAttributes: XmlAttribute[] = []
  const nodes = map(
    value,
    input,
    rootName,
    { path: options.schemaPath ?? [], scope: [], evaluation, depth: 0 },
    rootAttributes,
  )
  if (rootAttributes.length) {
    report('error', 'root-attribute', 'An XML attribute requires a parent element.', [])
  }
  if (
    !rootName &&
    nodes.length === 1 &&
    nodes[0]?.type === 'element' &&
    nodes[0].name === 'root' &&
    !(input as XmlSchema).xml?.name
  ) {
    report('warning', 'root-name-fallback', 'No XML root name was supplied; using root.', [])
  }
  if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return { xml: undefined, diagnostics }
  }
  if (value === undefined) {
    return { xml: undefined, diagnostics }
  }
  const result = writeXml(nodes, options)
  return { xml: result.xml, diagnostics: [...diagnostics, ...result.diagnostics] }
}
