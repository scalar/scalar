#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#elif SCALAR_AZURE_FUNCTIONS
namespace Scalar.Azure.Functions;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Specifies the type of an API document.
/// </summary>
public enum DocumentType
{
    /// <summary>
    /// An OpenAPI document.
    /// </summary>
    OpenApi,

    /// <summary>
    /// An AsyncAPI document.
    /// </summary>
    AsyncApi
}
