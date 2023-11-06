/*	This work is licensed under Creative Commons GNU LGPL License.

	License: http://creativecommons.org/licenses/LGPL/2.1/
   Version: 0.9
	Author:  Stefan Goessner/2006
	Web:     http://goessner.net/
*/
export function json2xml(o, tab) {
  const toXml = function (v, name, ind) {
    let xml = ''
    if (v instanceof Array) {
      for (let i = 0, n = v.length; i < n; i++)
        xml += ind + toXml(v[i], name, ind + '\t') + '\n'
    } else if (typeof v == 'object') {
      let hasChild = false
      xml += ind + '<' + name
      for (const m in v) {
        if (m.charAt(0) == '@')
          xml += ' ' + m.substr(1) + '="' + v[m].toString() + '"'
        else hasChild = true
      }
      xml += hasChild ? '>' : '/>'
      if (hasChild) {
        for (const m in v) {
          if (m == '#text') xml += v[m]
          else if (m == '#cdata') xml += '<![CDATA[' + v[m] + ']]>'
          else if (m.charAt(0) != '@') xml += toXml(v[m], m, ind + '\t')
        }
        xml +=
          (xml.charAt(xml.length - 1) == '\n' ? ind : '') + '</' + name + '>'
      }
    } else {
      xml += ind + '<' + name + '>' + v.toString() + '</' + name + '>'
    }
    return xml
  }
  let xml = ''

  for (const m in o) {
    xml += toXml(o[m], m, '')
  }

  return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, '')
}
