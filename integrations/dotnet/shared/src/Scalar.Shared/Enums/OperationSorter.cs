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
/// Specifies the sorting options for operations in the Scalar API reference.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(OperationSorterJsonConverter))]
public enum OperationSorter
{
    /// <summary>
    /// Sort operations alphabetically.
    /// </summary>
    [Description("alpha")]
    Alpha,

    /// <summary>
    /// Sort operations by method.
    /// </summary>
    [Description("method")]
    Method
}