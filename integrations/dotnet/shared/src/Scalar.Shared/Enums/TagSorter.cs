using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

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
/// Specifies the sorting options for tags in the Scalar API reference.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(TagSorterJsonConverter))]
public enum TagSorter
{
    /// <summary>
    /// Sort tags alphabetically.
    /// </summary>
    [Description("alpha")]
    Alpha
}