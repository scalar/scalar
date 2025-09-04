import { Type } from '@scalar/typebox'

/**
 * Reference definitions for OpenAPI 3.1 objects.
 * These can be used with Type.Ref to create references to these objects in other schemas.
 *
 * Referencing them this way helps avoid circular dependencies in TypeBox schemas while keeping the overhead performance lower.
 */
export const REF_DEFINITIONS = {
  ComponentsObject: 'ComponentsObject',
  SecurityRequirementObject: 'SecurityRequirementObject',
  TagObject: 'TagObject',
  CallbackObject: 'CallbackObject',
  PathsObject: 'PathsObject',
  PathItemObject: 'PathItemObject',
  OperationObject: 'OperationObject',
  SchemaObject: 'SchemaObject',
  EncodingObject: 'EncodingObject',
  HeaderObject: 'HeaderObject',
  MediaTypeObject: 'MediaTypeObject',
  ServerObject: 'ServerObject',
  ExternalDocumentationObject: 'ExternalDocumentationObject',
  InfoObject: 'InfoObject',
  ContactObject: 'ContactObject',
  LicenseObject: 'LicenseObject',
  ResponseObject: 'ResponseObject',
  ResponsesObject: 'ResponsesObject',
  ParameterObject: 'ParameterObject',
  ExampleObject: 'ExampleObject',
  RequestBodyObject: 'RequestBodyObject',
  SecuritySchemeObject: 'SecuritySchemeObject',
  LinkObject: 'LinkObject',
  XMLObject: 'XMLObject',
  DiscriminatorObject: 'DiscriminatorObject',
  OAuthFlowsObject: 'OAuthFlowsObject',
  ServerVariableObject: 'ServerVariableObject',
} as const

// Type alias for schema definitions
export const ComponentsObjectRef = Type.Ref(REF_DEFINITIONS.ComponentsObject)
export const SecurityRequirementObjectRef = Type.Ref(REF_DEFINITIONS.SecurityRequirementObject)
export const TagObjectRef = Type.Ref(REF_DEFINITIONS.TagObject)
export const CallbackObjectRef = Type.Ref(REF_DEFINITIONS.CallbackObject)
export const PathItemObjectRef = Type.Ref(REF_DEFINITIONS.PathItemObject)
export const PathsObjectRef = Type.Ref(REF_DEFINITIONS.PathsObject)
export const OperationObjectRef = Type.Ref(REF_DEFINITIONS.OperationObject)
export const SchemaObjectRef = Type.Ref(REF_DEFINITIONS.SchemaObject)
export const EncodingObjectRef = Type.Ref(REF_DEFINITIONS.EncodingObject)
export const HeaderObjectRef = Type.Ref(REF_DEFINITIONS.HeaderObject)
export const MediaTypeObjectRef = Type.Ref(REF_DEFINITIONS.MediaTypeObject)
export const ServerObjectRef = Type.Ref(REF_DEFINITIONS.ServerObject)
export const ExternalDocumentationObjectRef = Type.Ref(REF_DEFINITIONS.ExternalDocumentationObject)
export const InfoObjectRef = Type.Ref(REF_DEFINITIONS.InfoObject)
export const ContactObjectRef = Type.Ref(REF_DEFINITIONS.ContactObject)
export const LicenseObjectRef = Type.Ref(REF_DEFINITIONS.LicenseObject)
export const ResponseObjectRef = Type.Ref(REF_DEFINITIONS.ResponseObject)
export const ResponsesObjectRef = Type.Ref(REF_DEFINITIONS.ResponsesObject)
export const ParameterObjectRef = Type.Ref(REF_DEFINITIONS.ParameterObject)
export const ExampleObjectRef = Type.Ref(REF_DEFINITIONS.ExampleObject)
export const RequestBodyObjectRef = Type.Ref(REF_DEFINITIONS.RequestBodyObject)
export const SecuritySchemeObjectRef = Type.Ref(REF_DEFINITIONS.SecuritySchemeObject)
export const LinkObjectRef = Type.Ref(REF_DEFINITIONS.LinkObject)
export const XMLObjectRef = Type.Ref(REF_DEFINITIONS.XMLObject)
export const DiscriminatorObjectRef = Type.Ref(REF_DEFINITIONS.DiscriminatorObject)
export const OAuthFlowsObjectRef = Type.Ref(REF_DEFINITIONS.OAuthFlowsObject)
export const ServerVariableObjectRef = Type.Ref(REF_DEFINITIONS.ServerVariableObject)
