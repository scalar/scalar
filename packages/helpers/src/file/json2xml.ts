/**
 * This function converts an object to XML.
 */
export function json2xml(
  data: Record<string, any>,
  options: {
    indent?: string
    format?: boolean
    xmlDeclaration?: boolean
  } = {},
) {
  const { indent = '  ', format = true, xmlDeclaration = true } = options

  const toXml = (value: any, key: string, currentIndent: string): string => {
    let xml = ''

    if (Array.isArray(value)) {
      for (let i = 0, n = value.length; i < n; i++) {
        xml += toXml(value[i], key, currentIndent)
      }
    } else if (typeof value === 'object' && value !== null) {
      let hasChild = false
      let attributes = ''
      let children = ''

      // Handle attributes (keys starting with @)
      for (const attr in value) {
        if (attr.charAt(0) === '@') {
          attributes += ' ' + attr.substr(1) + '="' + value[attr].toString() + '"'
        }
      }

      // Handle children and special content
      for (const child in value) {
        if (child === '#text') {
          children += value[child]
        } else if (child === '#cdata') {
          children += '<![CDATA[' + value[child] + ']]>'
        } else if (child.charAt(0) !== '@') {
          hasChild = true
          children += toXml(value[child], child, currentIndent + indent)
        }
      }

      if (hasChild) {
        xml += currentIndent + '<' + key + attributes + '>\n'
        xml += children
        xml += currentIndent + '</' + key + '>\n'
      } else {
        xml += currentIndent + '<' + key + attributes + '/>\n'
      }
    } else {
      xml += currentIndent + '<' + key + '>' + (value?.toString() || '') + '</' + key + '>\n'
    }

    return xml
  }

  let xml = ''

  // Add XML declaration if requested
  if (xmlDeclaration) {
    xml += '<?xml version="1.0" encoding="UTF-8"?>'
    if (format) {
      xml += '\n'
    }
  }

  // Convert data to XML
  for (const key in data) {
    if (Object.hasOwn(data, key)) {
      xml += toXml(data[key], key, '')
    }
  }

  // Format or compact the output
  if (format) {
    return xml.trim()
  }

  // Remove all newlines and extra spaces, but keep the XML declaration clean
  return xml.replace(/\n/g, '').replace(/>\s+</g, '><').trim()
}
