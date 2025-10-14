using System.Buffers;
using System.Text;
using System.Text.Json;

namespace Scalar.Aspire;

internal static class AsyncEnumerableExtensions
{
    internal static async Task<string> SerializeToJsonAsync<T>(
        this IAsyncEnumerable<T> source,
        JsonSerializerOptions? options,
        CancellationToken cancellationToken)
    {
        var buffer = new ArrayBufferWriter<byte>();
        await using var writer = new Utf8JsonWriter(buffer);

        writer.WriteStartArray();

        await foreach (var item in source.WithCancellation(cancellationToken))
        {
            JsonSerializer.Serialize(writer, item, options);
        }

        writer.WriteEndArray();
        await writer.FlushAsync(cancellationToken);


        return Encoding.UTF8.GetString(buffer.WrittenSpan);
    }
}