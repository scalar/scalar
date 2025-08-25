using System.Text.Json;
using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal sealed class ThemeModeJsonConverter : JsonConverter<ThemeMode>
{
    public override ThemeMode Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        // We don't have to implement this method because we don't need to deserialize the ThemeMode enum.
        default;

    public override void Write(Utf8JsonWriter writer, ThemeMode value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStringFast(true));
    }
}