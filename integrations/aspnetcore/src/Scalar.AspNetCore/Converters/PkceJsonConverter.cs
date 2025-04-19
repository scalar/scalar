using System.Text.Json;
using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal sealed class PkceJsonConverter : JsonConverter<Pkce>
{
    public override Pkce Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        // We don't have to implement this method because we don't need to deserialize the Pkce enum.
        return default;
    }

    public override void Write(Utf8JsonWriter writer, Pkce value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStringFast(true));
    }
}