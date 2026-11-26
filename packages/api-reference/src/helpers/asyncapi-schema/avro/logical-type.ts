/** Unknown or invalid Avro logical annotations must fall back to the underlying type. */
export const logicalTypeDetails = (schema: Record<string, unknown>, version: string): string[] => {
  const { type, logicalType, precision, size } = schema
  const scale = schema.scale ?? 0
  if (logicalType === 'decimal') {
    if (
      !['bytes', 'fixed'].includes(String(type)) ||
      typeof precision !== 'number' ||
      !Number.isSafeInteger(precision) ||
      precision <= 0 ||
      typeof scale !== 'number' ||
      !Number.isSafeInteger(scale) ||
      scale < 0 ||
      scale > precision ||
      (type === 'fixed' && (typeof size !== 'number' || precision > Math.floor((8 * size - 1) * Math.log10(2))))
    ) {
      return []
    }
    return [
      'Logical type: decimal',
      `precision: ${precision}`,
      ...(schema.scale !== undefined ? [`scale: ${scale}`] : []),
    ]
  }
  const valid =
    (['date', 'time-millis'].includes(String(logicalType)) && type === 'int') ||
    (['time-micros', 'timestamp-millis', 'timestamp-micros'].includes(String(logicalType)) && type === 'long') ||
    (logicalType === 'uuid' && version === '1.9.0' && type === 'string') ||
    (logicalType === 'duration' && type === 'fixed' && size === 12)
  return valid ? [`Logical type: ${logicalType}`] : []
}
