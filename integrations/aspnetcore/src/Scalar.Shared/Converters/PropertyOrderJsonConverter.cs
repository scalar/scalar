using System.Text.Json;
using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal sealed class PropertyOrderJsonConverter : JsonConverter<PropertyOrder>
{
    public override PropertyOrder Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        // We don't have to implement this method because we don't need to deserialize the PropertyOrder enum.
        default;

    public override void Write(Utf8JsonWriter writer, PropertyOrder value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStringFast(true));
    }
}