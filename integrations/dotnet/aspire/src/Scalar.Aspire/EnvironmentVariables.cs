namespace Scalar.Aspire;

internal static class EnvironmentVariables
{
    public const string ApiReferenceConfig = "API_REFERENCE_CONFIG";

    public const string CdnUrl = "CDN_URL";

    public const string DefaultProxy = "DEFAULT_PROXY";

    public const string AllowSelfSignedCertificates = "ALLOW_SELF_SIGNED_CERTIFICATES";

    public const string ForwardOriginalHostHeader = "FORWARD_ORIGINAL_HOST_HEADER";

    /// <summary>
    /// Inline OpenAPI document (JSON or YAML) the mock server should mock.
    /// </summary>
    public const string OpenApiDocument = "OPENAPI_DOCUMENT";

    /// <summary>
    /// URL the mock server fetches the OpenAPI document from at startup.
    /// </summary>
    public const string OpenApiDocumentUrl = "OPENAPI_DOCUMENT_URL";
}