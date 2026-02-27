import type { Request as HarRequest } from 'har-format'
import type { SecuritySchemeObjectSecret } from '@/temp/helpers/secret-types'
type ProcessedSecuritySchemesReturn = {
  headers: HarRequest['headers']
  queryString: HarRequest['queryString']
  cookies: HarRequest['cookies']
}
/**
 * Process security schemes into whichever parameters they are applicable to
 *
 * TODO: we probably want to be able to disable YOUR_SECRET_TOKEN placeholder text + or allow it to be customzied
 */
export declare const processSecuritySchemes: (
  securitySchemes: SecuritySchemeObjectSecret[],
) => ProcessedSecuritySchemesReturn
export {}
//# sourceMappingURL=process-security-schemes.d.ts.map
