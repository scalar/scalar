using System.Text.Json;
using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal sealed class ScalarClientJsonConverter : JsonConverter<ScalarClient>
{
    public override ScalarClient Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        // We don't have to implement this method because we don't need to deserialize the ScalarClient enum.
        default;

    public override void Write(Utf8JsonWriter writer, ScalarClient value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStringFast(true));
    }
}