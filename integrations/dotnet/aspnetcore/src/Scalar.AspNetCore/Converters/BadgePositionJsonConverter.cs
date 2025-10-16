using System.Text.Json;
using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal sealed class BadgePositionJsonConverter : JsonConverter<BadgePosition>
{
    public override BadgePosition Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        // We don't have to implement this method because we don't need to deserialize the BadgePosition enum.
        default;

    public override void Write(Utf8JsonWriter writer, BadgePosition value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStringFast(true));
    }
}