using System.Text.Json;
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

internal sealed class TextDirectionJsonConverter : JsonConverter<TextDirection>
{
    public override TextDirection Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        // Configuration is only serialized for the browser.
        default;

    public override void Write(Utf8JsonWriter writer, TextDirection value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStringFast(true));
    }
}
