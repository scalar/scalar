using System.Text.Json;
using System.Text.Json.Serialization;

namespace Scalar.Aspire;

internal sealed class CredentialsLocationConverter : JsonConverter<CredentialsLocation>
{
    public override CredentialsLocation Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        // We don't have to implement this method because we don't need to deserialize the CredentialsLocation enum.
        default;

    public override void Write(Utf8JsonWriter writer, CredentialsLocation value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStringFast(true));
    }
}