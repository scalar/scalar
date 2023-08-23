import type { Spec, Operation, ContentSchema } from '../types';

const formatProperty = (key: string, obj: any): string => {
  let output = key;
  const isRequired = obj.required && obj.required.includes(key);
  output += isRequired ? ' REQUIRED ' : ' optional ';
  output += obj.properties[key].type;

  if (obj.properties[key].description) {
    output += ' ' + obj.properties[key].description;
  }

  return output;
};

const recursiveLogger = (obj: ContentSchema): string[] => {
  const results: string[] = ['Body'];

  Object.keys(obj.schema.properties).forEach((key) => {
    results.push(formatProperty(key, obj));

    const isNestedObject = obj.schema.properties[key].type === 'object' && obj.schema.properties[key].properties;
    if (isNestedObject) {
      Object.keys(obj.schema.properties[key].properties).forEach((subKey) => {
        results.push(`${subKey} ${obj.schema.properties[key].properties[subKey].type}`);
      });
    }
  });

  return results;
};

const extractRequestBody = (operation: Operation): string[] | boolean => {
  try {
    const body = operation?.information?.requestBody?.content['application/json'];
    if (!body) throw new Error("Body not found");
    return recursiveLogger(body);
  } catch (error) {
    return false;
  }
};

export { formatProperty, recursiveLogger, extractRequestBody };
