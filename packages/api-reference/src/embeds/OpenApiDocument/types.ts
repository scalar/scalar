import type { ReferenceConfiguration } from '@/types'

export type OpenApiDocumentConfiguration = Partial<
  Pick<
    ReferenceConfiguration,
    | 'proxy'
    | 'baseServerURL'
    | 'servers'
    | 'spec'
    | 'authentication'
    | 'defaultHttpClient'
    | 'hiddenClients'
  >
>
