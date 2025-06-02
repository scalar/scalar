/**
 * This function converts an object to XML.
 */
export function json2xml(data: Record<string, any>, tab?: string) {
  const toXml = (value: any, key: string, indentation: string) => {
    let xml = ''

    if (Array.isArray(value)) {
      for (let i = 0, n = value.length; i < n; i++) {
        xml += indentation + toXml(value[i], key, indentation + '\t') + '\n'
      }
    } else if (typeof value === 'object') {
      let hasChild = false
      xml += indentation + '<' + key

      for (const m in value) {
        if (m.charAt(0) === '@') {
          xml += ' ' + m.substr(1) + '="' + value[m].toString() + '"'
        } else {
          hasChild = true
        }
      }

      xml += hasChild ? '>' : '/>'

      if (hasChild) {
        for (const m in value) {
          if (m === '#text') {
            xml += value[m]
          } else if (m === '#cdata') {
            xml += '<![CDATA[' + value[m] + ']]>'
          } else if (m.charAt(0) !== '@') {
            xml += toXml(value[m], m, indentation + '\t')
          }
        }
        xml += (xml.charAt(xml.length - 1) === '\n' ? indentation : '') + '</' + key + '>'
      }
    } else {
      xml += indentation + '<' + key + '>' + value.toString() + '</' + key + '>'
    }
    return xml
  }

  let xml = ''

  for (const key in data) {
    if (Object.hasOwn(data, key)) {
      xml += toXml(data[key], key, '')
    }
  }

  return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, '')
}
