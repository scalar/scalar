using System.Text.Json;
using System.Text.Json.Serialization;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#else
namespace Scalar.AspNetCore;
#endif

internal sealed class ScalarThemeJsonConverter : JsonConverter<ScalarTheme>
{
    public override ScalarTheme Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        // We don't have to implement this method because we don't need to deserialize the ScalarTheme enum.
        default;

    public override void Write(Utf8JsonWriter writer, ScalarTheme value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStringFast(true));
    }
}