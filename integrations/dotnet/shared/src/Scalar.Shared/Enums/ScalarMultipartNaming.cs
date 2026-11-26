using System.Text.Json.Serialization;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#elif SCALAR_AZURE_FUNCTIONS
namespace Scalar.Azure.Functions;
#elif SCALAR_AWS_LAMBDA
namespace Scalar.Aws.Lambda;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Naming convention for named multipart request fields.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<ScalarMultipartNaming>))]
public enum ScalarMultipartNaming
{
    /// <summary>
    /// Use dots for object fields and brackets for array indices, such as items[0].file.
    /// </summary>
    [JsonStringEnumMemberName("indexed-dot")]
    IndexedDot
}
