import type { ReferenceConfiguration } from '@/types'

export type OpenApiDocumentConfiguration = Partial<
  Pick<
    ReferenceConfiguration,
    | 'proxy' // deprecated, but still supported
    | 'proxyUrl'
    | 'baseServerURL'
    | 'servers'
    | 'spec'
    | 'authentication'
    | 'defaultHttpClient'
    | 'hideClientButton'
    | 'hiddenClients'
    | 'theme'
  >
>
