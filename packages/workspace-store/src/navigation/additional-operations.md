# Additional operation methods

`OperationMethod`, exported from `@scalar/workspace-store/schemas/navigation`, is the method type for traversed operations and webhooks. It combines known HTTP method literals with an open string type to retain editor completion. It does not validate tokens or catch misspelled custom methods. Consumers must handle unknown strings, including a default branch in switches; exhaustive checking over only the fixed method set is no longer possible. This public type change is included in the workspace-store minor release.

The fixed-field `HttpMethod` type in `@scalar/helpers/http/http-methods` remains a closed union, and Path Item Object schemas still enumerate their fixed operation fields. Use that narrow type for code that only accepts fixed fields. The wider `OperationMethod` belongs at boundaries that also carry document-defined additional operations; making it a branded string would require consumers to construct or cast every parsed method without validating the API description.

## Navigation links

HTTP method tokens are case-sensitive ([RFC 9110, section 9.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.1)). Custom `COPY` and `copy` therefore retain distinct anchors and wire spellings. Changing their case changes their links. Normalizing these anchors would make two authored operations collide.

Fixed OpenAPI fields retain established uppercase anchors: `get` maps to `GET/path`. Authored uppercase or mixed-case variants under `additionalOperations` use their own namespace, such as `additionalOperations/GET/path`, so fixed and additional operations remain distinct. The same rule applies to webhooks.

`query` is a known fixed field in the current working model: its anchor is `QUERY/path`, while `additionalOperations.QUERY` uses `additionalOperations/QUERY/path`. Lowercase known fixed keys inside `additionalOperations` are not separate custom operations; declare those operations in the fixed fields. Custom methods such as `COPY` are not prefixed, preserving existing links.

The compatibility field in the 3.1 store schema preserves 3.2 data for consumers of that shared working model. It does not claim that `additionalOperations` is allowed by OpenAPI 3.1 document validation.

## Mock server deployments

The mock server routes custom methods with their authored capitalization. The HTTP runtime and any reverse proxy must also accept and forward those methods; a proxy method allowlist can reject a request before it reaches Scalar. Configure the deployment to forward the methods declared by the API description.
