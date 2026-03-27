import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { InjectionKey, Ref } from 'vue'

export const ACTIVE_DOCUMENT_SYMBOL: InjectionKey<Ref<OpenApiDocument | null>> = Symbol('ACTIVE_DOCUMENT')
