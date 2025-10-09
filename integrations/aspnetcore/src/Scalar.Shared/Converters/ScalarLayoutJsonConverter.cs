using System.Text.Json;
using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal sealed class ScalarLayoutJsonConverter : JsonConverter<ScalarLayout>
{
    public override ScalarLayout Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        // We don't have to implement this method because we don't need to deserialize the ScalarLayout enum.
        default;

    public override void Write(Utf8JsonWriter writer, ScalarLayout value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStringFast(true));
    }
}