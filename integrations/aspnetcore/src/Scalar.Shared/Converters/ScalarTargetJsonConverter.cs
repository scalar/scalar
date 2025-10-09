using System.Text.Json;
using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal sealed class ScalarTargetJsonConverter : JsonConverter<ScalarTarget>
{
    public override ScalarTarget Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        // We don't have to implement this method because we don't need to deserialize the ScalarTarget type.
        default;

    public override void Write(Utf8JsonWriter writer, ScalarTarget value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStringFast(true));
    }

    public override void WriteAsPropertyName(Utf8JsonWriter writer, ScalarTarget value, JsonSerializerOptions options)
    {
        // This method is used to write the ScalarTarget as a property name in the JSON.
        writer.WritePropertyName(value.ToStringFast(true));
    }
}