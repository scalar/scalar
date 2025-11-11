using System.Text.Json;
using System.Text.Json.Serialization;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#else
namespace Scalar.AspNetCore;
#endif

internal sealed class DeveloperToolsVisibilityJsonConverter : JsonConverter<DeveloperToolsVisibility>
{
    public override DeveloperToolsVisibility Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        // We don't have to implement this method because we don't need to deserialize the DeveloperToolsVisibility enum.
        default;

    public override void Write(Utf8JsonWriter writer, DeveloperToolsVisibility value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStringFast(true));
    }
}

