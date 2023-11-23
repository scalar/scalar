var dom$1 = {};
var conventions$2 = {};
function freeze(object, oc) {
  if (oc === void 0) {
    oc = Object;
  }
  return oc && typeof oc.freeze === "function" ? oc.freeze(object) : object;
}
function assign(target, source) {
  if (target === null || typeof target !== "object") {
    throw new TypeError("target is not an object");
  }
  for (var key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
  return target;
}
var MIME_TYPE = freeze({
  /**
   * `text/html`, the only mime type that triggers treating an XML document as HTML.
   *
   * @see DOMParser.SupportedType.isHTML
   * @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
   * @see https://en.wikipedia.org/wiki/HTML Wikipedia
   * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
   * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring WHATWG HTML Spec
   */
  HTML: "text/html",
  /**
   * Helper method to check a mime type if it indicates an HTML document
   *
   * @param {string} [value]
   * @returns {boolean}
   *
   * @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
   * @see https://en.wikipedia.org/wiki/HTML Wikipedia
   * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
   * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring 	 */
  isHTML: function(value) {
    return value === MIME_TYPE.HTML;
  },
  /**
   * `application/xml`, the standard mime type for XML documents.
   *
   * @see https://www.iana.org/assignments/media-types/application/xml IANA MimeType registration
   * @see https://tools.ietf.org/html/rfc7303#section-9.1 RFC 7303
   * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
   */
  XML_APPLICATION: "application/xml",
  /**
   * `text/html`, an alias for `application/xml`.
   *
   * @see https://tools.ietf.org/html/rfc7303#section-9.2 RFC 7303
   * @see https://www.iana.org/assignments/media-types/text/xml IANA MimeType registration
   * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
   */
  XML_TEXT: "text/xml",
  /**
   * `application/xhtml+xml`, indicates an XML document that has the default HTML namespace,
   * but is parsed as an XML document.
   *
   * @see https://www.iana.org/assignments/media-types/application/xhtml+xml IANA MimeType registration
   * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument WHATWG DOM Spec
   * @see https://en.wikipedia.org/wiki/XHTML Wikipedia
   */
  XML_XHTML_APPLICATION: "application/xhtml+xml",
  /**
   * `image/svg+xml`,
   *
   * @see https://www.iana.org/assignments/media-types/image/svg+xml IANA MimeType registration
   * @see https://www.w3.org/TR/SVG11/ W3C SVG 1.1
   * @see https://en.wikipedia.org/wiki/Scalable_Vector_Graphics Wikipedia
   */
  XML_SVG_IMAGE: "image/svg+xml"
});
var NAMESPACE$3 = freeze({
  /**
   * The XHTML namespace.
   *
   * @see http://www.w3.org/1999/xhtml
   */
  HTML: "http://www.w3.org/1999/xhtml",
  /**
   * Checks if `uri` equals `NAMESPACE.HTML`.
   *
   * @param {string} [uri]
   *
   * @see NAMESPACE.HTML
   */
  isHTML: function(uri) {
    return uri === NAMESPACE$3.HTML;
  },
  /**
   * The SVG namespace.
   *
   * @see http://www.w3.org/2000/svg
   */
  SVG: "http://www.w3.org/2000/svg",
  /**
   * The `xml:` namespace.
   *
   * @see http://www.w3.org/XML/1998/namespace
   */
  XML: "http://www.w3.org/XML/1998/namespace",
  /**
   * The `xmlns:` namespace
   *
   * @see https://www.w3.org/2000/xmlns/
   */
  XMLNS: "http://www.w3.org/2000/xmlns/"
});
conventions$2.assign = assign;
conventions$2.freeze = freeze;
conventions$2.MIME_TYPE = MIME_TYPE;
conventions$2.NAMESPACE = NAMESPACE$3;
var conventions$1 = conventions$2;
var NAMESPACE$2 = conventions$1.NAMESPACE;
function notEmptyString(input) {
  return input !== "";
}
function splitOnASCIIWhitespace(input) {
  return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : [];
}
function orderedSetReducer(current, element) {
  if (!current.hasOwnProperty(element)) {
    current[element] = true;
  }
  return current;
}
function toOrderedSet(input) {
  if (!input)
    return [];
  var list = splitOnASCIIWhitespace(input);
  return Object.keys(list.reduce(orderedSetReducer, {}));
}
function arrayIncludes(list) {
  return function(element) {
    return list && list.indexOf(element) !== -1;
  };
}
function copy(src, dest) {
  for (var p in src) {
    if (Object.prototype.hasOwnProperty.call(src, p)) {
      dest[p] = src[p];
    }
  }
}
function _extends(Class, Super) {
  var pt = Class.prototype;
  if (!(pt instanceof Super)) {
    let t = function() {
    };
    t.prototype = Super.prototype;
    t = new t();
    copy(pt, t);
    Class.prototype = pt = t;
  }
  if (pt.constructor != Class) {
    if (typeof Class != "function") {
      console.error("unknown Class:" + Class);
    }
    pt.constructor = Class;
  }
}
var NodeType = {};
var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
var TEXT_NODE = NodeType.TEXT_NODE = 3;
var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
var NOTATION_NODE = NodeType.NOTATION_NODE = 12;
var ExceptionCode = {};
var ExceptionMessage = {};
ExceptionCode.INDEX_SIZE_ERR = (ExceptionMessage[1] = "Index size error", 1);
ExceptionCode.DOMSTRING_SIZE_ERR = (ExceptionMessage[2] = "DOMString size error", 2);
var HIERARCHY_REQUEST_ERR = ExceptionCode.HIERARCHY_REQUEST_ERR = (ExceptionMessage[3] = "Hierarchy request error", 3);
ExceptionCode.WRONG_DOCUMENT_ERR = (ExceptionMessage[4] = "Wrong document", 4);
ExceptionCode.INVALID_CHARACTER_ERR = (ExceptionMessage[5] = "Invalid character", 5);
ExceptionCode.NO_DATA_ALLOWED_ERR = (ExceptionMessage[6] = "No data allowed", 6);
ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = (ExceptionMessage[7] = "No modification allowed", 7);
var NOT_FOUND_ERR = ExceptionCode.NOT_FOUND_ERR = (ExceptionMessage[8] = "Not found", 8);
ExceptionCode.NOT_SUPPORTED_ERR = (ExceptionMessage[9] = "Not supported", 9);
var INUSE_ATTRIBUTE_ERR = ExceptionCode.INUSE_ATTRIBUTE_ERR = (ExceptionMessage[10] = "Attribute in use", 10);
ExceptionCode.INVALID_STATE_ERR = (ExceptionMessage[11] = "Invalid state", 11);
ExceptionCode.SYNTAX_ERR = (ExceptionMessage[12] = "Syntax error", 12);
ExceptionCode.INVALID_MODIFICATION_ERR = (ExceptionMessage[13] = "Invalid modification", 13);
ExceptionCode.NAMESPACE_ERR = (ExceptionMessage[14] = "Invalid namespace", 14);
ExceptionCode.INVALID_ACCESS_ERR = (ExceptionMessage[15] = "Invalid access", 15);
function DOMException(code, message) {
  if (message instanceof Error) {
    var error = message;
  } else {
    error = this;
    Error.call(this, ExceptionMessage[code]);
    this.message = ExceptionMessage[code];
    if (Error.captureStackTrace)
      Error.captureStackTrace(this, DOMException);
  }
  error.code = code;
  if (message)
    this.message = this.message + ": " + message;
  return error;
}
DOMException.prototype = Error.prototype;
copy(ExceptionCode, DOMException);
function NodeList() {
}
NodeList.prototype = {
  /**
   * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
   * @standard level1
   */
  length: 0,
  /**
   * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
   * @standard level1
   * @param index  unsigned long
   *   Index into the collection.
   * @return Node
   * 	The node at the indexth position in the NodeList, or null if that is not a valid index.
   */
  item: function(index2) {
    return this[index2] || null;
  },
  toString: function(isHTML, nodeFilter) {
    for (var buf = [], i = 0; i < this.length; i++) {
      serializeToString(this[i], buf, isHTML, nodeFilter);
    }
    return buf.join("");
  },
  /**
   * @private
   * @param {function (Node):boolean} predicate
   * @returns {Node | undefined}
   */
  find: function(predicate) {
    return Array.prototype.find.call(this, predicate);
  },
  /**
   * @private
   * @param {function (Node):boolean} predicate
   * @returns {Node[]}
   */
  filter: function(predicate) {
    return Array.prototype.filter.call(this, predicate);
  },
  /**
   * @private
   * @param {Node} item
   * @returns {number}
   */
  indexOf: function(item) {
    return Array.prototype.indexOf.call(this, item);
  }
};
function LiveNodeList(node, refresh) {
  this._node = node;
  this._refresh = refresh;
  _updateLiveList(this);
}
function _updateLiveList(list) {
  var inc = list._node._inc || list._node.ownerDocument._inc;
  if (list._inc != inc) {
    var ls = list._refresh(list._node);
    __set__(list, "length", ls.length);
    copy(ls, list);
    list._inc = inc;
  }
}
LiveNodeList.prototype.item = function(i) {
  _updateLiveList(this);
  return this[i];
};
_extends(LiveNodeList, NodeList);
function NamedNodeMap() {
}
function _findNodeIndex(list, node) {
  var i = list.length;
  while (i--) {
    if (list[i] === node) {
      return i;
    }
  }
}
function _addNamedNode(el, list, newAttr, oldAttr) {
  if (oldAttr) {
    list[_findNodeIndex(list, oldAttr)] = newAttr;
  } else {
    list[list.length++] = newAttr;
  }
  if (el) {
    newAttr.ownerElement = el;
    var doc = el.ownerDocument;
    if (doc) {
      oldAttr && _onRemoveAttribute(doc, el, oldAttr);
      _onAddAttribute(doc, el, newAttr);
    }
  }
}
function _removeNamedNode(el, list, attr) {
  var i = _findNodeIndex(list, attr);
  if (i >= 0) {
    var lastIndex = list.length - 1;
    while (i < lastIndex) {
      list[i] = list[++i];
    }
    list.length = lastIndex;
    if (el) {
      var doc = el.ownerDocument;
      if (doc) {
        _onRemoveAttribute(doc, el, attr);
        attr.ownerElement = null;
      }
    }
  } else {
    throw new DOMException(NOT_FOUND_ERR, new Error(el.tagName + "@" + attr));
  }
}
NamedNodeMap.prototype = {
  length: 0,
  item: NodeList.prototype.item,
  getNamedItem: function(key) {
    var i = this.length;
    while (i--) {
      var attr = this[i];
      if (attr.nodeName == key) {
        return attr;
      }
    }
  },
  setNamedItem: function(attr) {
    var el = attr.ownerElement;
    if (el && el != this._ownerElement) {
      throw new DOMException(INUSE_ATTRIBUTE_ERR);
    }
    var oldAttr = this.getNamedItem(attr.nodeName);
    _addNamedNode(this._ownerElement, this, attr, oldAttr);
    return oldAttr;
  },
  /* returns Node */
  setNamedItemNS: function(attr) {
    var el = attr.ownerElement, oldAttr;
    if (el && el != this._ownerElement) {
      throw new DOMException(INUSE_ATTRIBUTE_ERR);
    }
    oldAttr = this.getNamedItemNS(attr.namespaceURI, attr.localName);
    _addNamedNode(this._ownerElement, this, attr, oldAttr);
    return oldAttr;
  },
  /* returns Node */
  removeNamedItem: function(key) {
    var attr = this.getNamedItem(key);
    _removeNamedNode(this._ownerElement, this, attr);
    return attr;
  },
  // raises: NOT_FOUND_ERR,NO_MODIFICATION_ALLOWED_ERR
  //for level2
  removeNamedItemNS: function(namespaceURI, localName) {
    var attr = this.getNamedItemNS(namespaceURI, localName);
    _removeNamedNode(this._ownerElement, this, attr);
    return attr;
  },
  getNamedItemNS: function(namespaceURI, localName) {
    var i = this.length;
    while (i--) {
      var node = this[i];
      if (node.localName == localName && node.namespaceURI == namespaceURI) {
        return node;
      }
    }
    return null;
  }
};
function DOMImplementation$1() {
}
DOMImplementation$1.prototype = {
  /**
   * The DOMImplementation.hasFeature() method returns a Boolean flag indicating if a given feature is supported.
   * The different implementations fairly diverged in what kind of features were reported.
   * The latest version of the spec settled to force this method to always return true, where the functionality was accurate and in use.
   *
   * @deprecated It is deprecated and modern browsers return true in all cases.
   *
   * @param {string} feature
   * @param {string} [version]
   * @returns {boolean} always true
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/hasFeature MDN
   * @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-5CED94D7 DOM Level 1 Core
   * @see https://dom.spec.whatwg.org/#dom-domimplementation-hasfeature DOM Living Standard
   */
  hasFeature: function(feature, version) {
    return true;
  },
  /**
   * Creates an XML Document object of the specified type with its document element.
   *
   * __It behaves slightly different from the description in the living standard__:
   * - There is no interface/class `XMLDocument`, it returns a `Document` instance.
   * - `contentType`, `encoding`, `mode`, `origin`, `url` fields are currently not declared.
   * - this implementation is not validating names or qualified names
   *   (when parsing XML strings, the SAX parser takes care of that)
   *
   * @param {string|null} namespaceURI
   * @param {string} qualifiedName
   * @param {DocumentType=null} doctype
   * @returns {Document}
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocument MDN
   * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocument DOM Level 2 Core (initial)
   * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument  DOM Level 2 Core
   *
   * @see https://dom.spec.whatwg.org/#validate-and-extract DOM: Validate and extract
   * @see https://www.w3.org/TR/xml/#NT-NameStartChar XML Spec: Names
   * @see https://www.w3.org/TR/xml-names/#ns-qualnames XML Namespaces: Qualified names
   */
  createDocument: function(namespaceURI, qualifiedName, doctype) {
    var doc = new Document();
    doc.implementation = this;
    doc.childNodes = new NodeList();
    doc.doctype = doctype || null;
    if (doctype) {
      doc.appendChild(doctype);
    }
    if (qualifiedName) {
      var root = doc.createElementNS(namespaceURI, qualifiedName);
      doc.appendChild(root);
    }
    return doc;
  },
  /**
   * Returns a doctype, with the given `qualifiedName`, `publicId`, and `systemId`.
   *
   * __This behavior is slightly different from the in the specs__:
   * - this implementation is not validating names or qualified names
   *   (when parsing XML strings, the SAX parser takes care of that)
   *
   * @param {string} qualifiedName
   * @param {string} [publicId]
   * @param {string} [systemId]
   * @returns {DocumentType} which can either be used with `DOMImplementation.createDocument` upon document creation
   * 				  or can be put into the document via methods like `Node.insertBefore()` or `Node.replaceChild()`
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocumentType MDN
   * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocType DOM Level 2 Core
   * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocumenttype DOM Living Standard
   *
   * @see https://dom.spec.whatwg.org/#validate-and-extract DOM: Validate and extract
   * @see https://www.w3.org/TR/xml/#NT-NameStartChar XML Spec: Names
   * @see https://www.w3.org/TR/xml-names/#ns-qualnames XML Namespaces: Qualified names
   */
  createDocumentType: function(qualifiedName, publicId, systemId) {
    var node = new DocumentType();
    node.name = qualifiedName;
    node.nodeName = qualifiedName;
    node.publicId = publicId || "";
    node.systemId = systemId || "";
    return node;
  }
};
function Node() {
}
Node.prototype = {
  firstChild: null,
  lastChild: null,
  previousSibling: null,
  nextSibling: null,
  attributes: null,
  parentNode: null,
  childNodes: null,
  ownerDocument: null,
  nodeValue: null,
  namespaceURI: null,
  prefix: null,
  localName: null,
  // Modified in DOM Level 2:
  insertBefore: function(newChild, refChild) {
    return _insertBefore(this, newChild, refChild);
  },
  replaceChild: function(newChild, oldChild) {
    this.insertBefore(newChild, oldChild);
    if (oldChild) {
      this.removeChild(oldChild);
    }
  },
  removeChild: function(oldChild) {
    return _removeChild(this, oldChild);
  },
  appendChild: function(newChild) {
    return this.insertBefore(newChild, null);
  },
  hasChildNodes: function() {
    return this.firstChild != null;
  },
  cloneNode: function(deep) {
    return cloneNode(this.ownerDocument || this, this, deep);
  },
  // Modified in DOM Level 2:
  normalize: function() {
    var child = this.firstChild;
    while (child) {
      var next = child.nextSibling;
      if (next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE) {
        this.removeChild(next);
        child.appendData(next.data);
      } else {
        child.normalize();
        child = next;
      }
    }
  },
  // Introduced in DOM Level 2:
  isSupported: function(feature, version) {
    return this.ownerDocument.implementation.hasFeature(feature, version);
  },
  // Introduced in DOM Level 2:
  hasAttributes: function() {
    return this.attributes.length > 0;
  },
  /**
   * Look up the prefix associated to the given namespace URI, starting from this node.
   * **The default namespace declarations are ignored by this method.**
   * See Namespace Prefix Lookup for details on the algorithm used by this method.
   *
   * _Note: The implementation seems to be incomplete when compared to the algorithm described in the specs._
   *
   * @param {string | null} namespaceURI
   * @returns {string | null}
   * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespacePrefix
   * @see https://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespacePrefixAlgo
   * @see https://dom.spec.whatwg.org/#dom-node-lookupprefix
   * @see https://github.com/xmldom/xmldom/issues/322
   */
  lookupPrefix: function(namespaceURI) {
    var el = this;
    while (el) {
      var map = el._nsMap;
      if (map) {
        for (var n in map) {
          if (Object.prototype.hasOwnProperty.call(map, n) && map[n] === namespaceURI) {
            return n;
          }
        }
      }
      el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
    }
    return null;
  },
  // Introduced in DOM Level 3:
  lookupNamespaceURI: function(prefix) {
    var el = this;
    while (el) {
      var map = el._nsMap;
      if (map) {
        if (Object.prototype.hasOwnProperty.call(map, prefix)) {
          return map[prefix];
        }
      }
      el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
    }
    return null;
  },
  // Introduced in DOM Level 3:
  isDefaultNamespace: function(namespaceURI) {
    var prefix = this.lookupPrefix(namespaceURI);
    return prefix == null;
  }
};
function _xmlEncoder(c) {
  return c == "<" && "&lt;" || c == ">" && "&gt;" || c == "&" && "&amp;" || c == '"' && "&quot;" || "&#" + c.charCodeAt() + ";";
}
copy(NodeType, Node);
copy(NodeType, Node.prototype);
function _visitNode(node, callback) {
  if (callback(node)) {
    return true;
  }
  if (node = node.firstChild) {
    do {
      if (_visitNode(node, callback)) {
        return true;
      }
    } while (node = node.nextSibling);
  }
}
function Document() {
}
function _onAddAttribute(doc, el, newAttr) {
  doc && doc._inc++;
  var ns = newAttr.namespaceURI;
  if (ns === NAMESPACE$2.XMLNS) {
    el._nsMap[newAttr.prefix ? newAttr.localName : ""] = newAttr.value;
  }
}
function _onRemoveAttribute(doc, el, newAttr, remove) {
  doc && doc._inc++;
  var ns = newAttr.namespaceURI;
  if (ns === NAMESPACE$2.XMLNS) {
    delete el._nsMap[newAttr.prefix ? newAttr.localName : ""];
  }
}
function _onUpdateChild(doc, el, newChild) {
  if (doc && doc._inc) {
    doc._inc++;
    var cs = el.childNodes;
    if (newChild) {
      cs[cs.length++] = newChild;
    } else {
      var child = el.firstChild;
      var i = 0;
      while (child) {
        cs[i++] = child;
        child = child.nextSibling;
      }
      cs.length = i;
      delete cs[cs.length];
    }
  }
}
function _removeChild(parentNode, child) {
  var previous = child.previousSibling;
  var next = child.nextSibling;
  if (previous) {
    previous.nextSibling = next;
  } else {
    parentNode.firstChild = next;
  }
  if (next) {
    next.previousSibling = previous;
  } else {
    parentNode.lastChild = previous;
  }
  child.parentNode = null;
  child.previousSibling = null;
  child.nextSibling = null;
  _onUpdateChild(parentNode.ownerDocument, parentNode);
  return child;
}
function hasValidParentNodeType(node) {
  return node && (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE);
}
function hasInsertableNodeType(node) {
  return node && (isElementNode(node) || isTextNode(node) || isDocTypeNode(node) || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.PROCESSING_INSTRUCTION_NODE);
}
function isDocTypeNode(node) {
  return node && node.nodeType === Node.DOCUMENT_TYPE_NODE;
}
function isElementNode(node) {
  return node && node.nodeType === Node.ELEMENT_NODE;
}
function isTextNode(node) {
  return node && node.nodeType === Node.TEXT_NODE;
}
function isElementInsertionPossible(doc, child) {
  var parentChildNodes = doc.childNodes || [];
  if (parentChildNodes.find(isElementNode) || isDocTypeNode(child)) {
    return false;
  }
  var docTypeNode = parentChildNodes.find(isDocTypeNode);
  return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
}
function _insertBefore(parent, node, child) {
  if (!hasValidParentNodeType(parent)) {
    throw new DOMException(HIERARCHY_REQUEST_ERR, "Unexpected parent node type " + parent.nodeType);
  }
  if (child && child.parentNode !== parent) {
    throw new DOMException(NOT_FOUND_ERR, "child not in parent");
  }
  if (!hasInsertableNodeType(node) || // the sax parser currently adds top level text nodes, this will be fixed in 0.9.0
  // || (node.nodeType === Node.TEXT_NODE && parent.nodeType === Node.DOCUMENT_NODE)
  isDocTypeNode(node) && parent.nodeType !== Node.DOCUMENT_NODE) {
    throw new DOMException(
      HIERARCHY_REQUEST_ERR,
      "Unexpected node type " + node.nodeType + " for parent node type " + parent.nodeType
    );
  }
  var parentChildNodes = parent.childNodes || [];
  var nodeChildNodes = node.childNodes || [];
  if (parent.nodeType === Node.DOCUMENT_NODE) {
    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      let nodeChildElements = nodeChildNodes.filter(isElementNode);
      if (nodeChildElements.length > 1 || nodeChildNodes.find(isTextNode)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
      }
      if (nodeChildElements.length === 1 && !isElementInsertionPossible(parent, child)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
      }
    }
    if (isElementNode(node)) {
      if (parentChildNodes.find(isElementNode) || !isElementInsertionPossible(parent, child)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
      }
    }
    if (isDocTypeNode(node)) {
      if (parentChildNodes.find(isDocTypeNode)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
      }
      let parentElementChild = parentChildNodes.find(isElementNode);
      if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
      }
      if (!child && parentElementChild) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Doctype can not be appended since element is present");
      }
    }
  }
  var cp = node.parentNode;
  if (cp) {
    cp.removeChild(node);
  }
  if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
    var newFirst = node.firstChild;
    if (newFirst == null) {
      return node;
    }
    var newLast = node.lastChild;
  } else {
    newFirst = newLast = node;
  }
  var pre = child ? child.previousSibling : parent.lastChild;
  newFirst.previousSibling = pre;
  newLast.nextSibling = child;
  if (pre) {
    pre.nextSibling = newFirst;
  } else {
    parent.firstChild = newFirst;
  }
  if (child == null) {
    parent.lastChild = newLast;
  } else {
    child.previousSibling = newLast;
  }
  do {
    newFirst.parentNode = parent;
  } while (newFirst !== newLast && (newFirst = newFirst.nextSibling));
  _onUpdateChild(parent.ownerDocument || parent, parent);
  if (node.nodeType == DOCUMENT_FRAGMENT_NODE) {
    node.firstChild = node.lastChild = null;
  }
  return node;
}
function _appendSingleChild(parentNode, newChild) {
  if (newChild.parentNode) {
    newChild.parentNode.removeChild(newChild);
  }
  newChild.parentNode = parentNode;
  newChild.previousSibling = parentNode.lastChild;
  newChild.nextSibling = null;
  if (newChild.previousSibling) {
    newChild.previousSibling.nextSibling = newChild;
  } else {
    parentNode.firstChild = newChild;
  }
  parentNode.lastChild = newChild;
  _onUpdateChild(parentNode.ownerDocument, parentNode, newChild);
  return newChild;
}
Document.prototype = {
  //implementation : null,
  nodeName: "#document",
  nodeType: DOCUMENT_NODE,
  /**
   * The DocumentType node of the document.
   *
   * @readonly
   * @type DocumentType
   */
  doctype: null,
  documentElement: null,
  _inc: 1,
  insertBefore: function(newChild, refChild) {
    if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
      var child = newChild.firstChild;
      while (child) {
        var next = child.nextSibling;
        this.insertBefore(child, refChild);
        child = next;
      }
      return newChild;
    }
    _insertBefore(this, newChild, refChild);
    newChild.ownerDocument = this;
    if (this.documentElement === null && newChild.nodeType === ELEMENT_NODE) {
      this.documentElement = newChild;
    }
    return newChild;
  },
  removeChild: function(oldChild) {
    if (this.documentElement == oldChild) {
      this.documentElement = null;
    }
    return _removeChild(this, oldChild);
  },
  // Introduced in DOM Level 2:
  importNode: function(importedNode, deep) {
    return importNode(this, importedNode, deep);
  },
  // Introduced in DOM Level 2:
  getElementById: function(id) {
    var rtv = null;
    _visitNode(this.documentElement, function(node) {
      if (node.nodeType == ELEMENT_NODE) {
        if (node.getAttribute("id") == id) {
          rtv = node;
          return true;
        }
      }
    });
    return rtv;
  },
  /**
   * The `getElementsByClassName` method of `Document` interface returns an array-like object
   * of all child elements which have **all** of the given class name(s).
   *
   * Returns an empty list if `classeNames` is an empty string or only contains HTML white space characters.
   *
   *
   * Warning: This is a live LiveNodeList.
   * Changes in the DOM will reflect in the array as the changes occur.
   * If an element selected by this array no longer qualifies for the selector,
   * it will automatically be removed. Be aware of this for iteration purposes.
   *
   * @param {string} classNames is a string representing the class name(s) to match; multiple class names are separated by (ASCII-)whitespace
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByClassName
   * @see https://dom.spec.whatwg.org/#concept-getelementsbyclassname
   */
  getElementsByClassName: function(classNames) {
    var classNamesSet = toOrderedSet(classNames);
    return new LiveNodeList(this, function(base) {
      var ls = [];
      if (classNamesSet.length > 0) {
        _visitNode(base.documentElement, function(node) {
          if (node !== base && node.nodeType === ELEMENT_NODE) {
            var nodeClassNames = node.getAttribute("class");
            if (nodeClassNames) {
              var matches = classNames === nodeClassNames;
              if (!matches) {
                var nodeClassNamesSet = toOrderedSet(nodeClassNames);
                matches = classNamesSet.every(arrayIncludes(nodeClassNamesSet));
              }
              if (matches) {
                ls.push(node);
              }
            }
          }
        });
      }
      return ls;
    });
  },
  //document factory method:
  createElement: function(tagName) {
    var node = new Element();
    node.ownerDocument = this;
    node.nodeName = tagName;
    node.tagName = tagName;
    node.localName = tagName;
    node.childNodes = new NodeList();
    var attrs = node.attributes = new NamedNodeMap();
    attrs._ownerElement = node;
    return node;
  },
  createDocumentFragment: function() {
    var node = new DocumentFragment();
    node.ownerDocument = this;
    node.childNodes = new NodeList();
    return node;
  },
  createTextNode: function(data) {
    var node = new Text();
    node.ownerDocument = this;
    node.appendData(data);
    return node;
  },
  createComment: function(data) {
    var node = new Comment();
    node.ownerDocument = this;
    node.appendData(data);
    return node;
  },
  createCDATASection: function(data) {
    var node = new CDATASection();
    node.ownerDocument = this;
    node.appendData(data);
    return node;
  },
  createProcessingInstruction: function(target, data) {
    var node = new ProcessingInstruction();
    node.ownerDocument = this;
    node.tagName = node.target = target;
    node.nodeValue = node.data = data;
    return node;
  },
  createAttribute: function(name) {
    var node = new Attr();
    node.ownerDocument = this;
    node.name = name;
    node.nodeName = name;
    node.localName = name;
    node.specified = true;
    return node;
  },
  createEntityReference: function(name) {
    var node = new EntityReference();
    node.ownerDocument = this;
    node.nodeName = name;
    return node;
  },
  // Introduced in DOM Level 2:
  createElementNS: function(namespaceURI, qualifiedName) {
    var node = new Element();
    var pl = qualifiedName.split(":");
    var attrs = node.attributes = new NamedNodeMap();
    node.childNodes = new NodeList();
    node.ownerDocument = this;
    node.nodeName = qualifiedName;
    node.tagName = qualifiedName;
    node.namespaceURI = namespaceURI;
    if (pl.length == 2) {
      node.prefix = pl[0];
      node.localName = pl[1];
    } else {
      node.localName = qualifiedName;
    }
    attrs._ownerElement = node;
    return node;
  },
  // Introduced in DOM Level 2:
  createAttributeNS: function(namespaceURI, qualifiedName) {
    var node = new Attr();
    var pl = qualifiedName.split(":");
    node.ownerDocument = this;
    node.nodeName = qualifiedName;
    node.name = qualifiedName;
    node.namespaceURI = namespaceURI;
    node.specified = true;
    if (pl.length == 2) {
      node.prefix = pl[0];
      node.localName = pl[1];
    } else {
      node.localName = qualifiedName;
    }
    return node;
  }
};
_extends(Document, Node);
function Element() {
  this._nsMap = {};
}
Element.prototype = {
  nodeType: ELEMENT_NODE,
  hasAttribute: function(name) {
    return this.getAttributeNode(name) != null;
  },
  getAttribute: function(name) {
    var attr = this.getAttributeNode(name);
    return attr && attr.value || "";
  },
  getAttributeNode: function(name) {
    return this.attributes.getNamedItem(name);
  },
  setAttribute: function(name, value) {
    var attr = this.ownerDocument.createAttribute(name);
    attr.value = attr.nodeValue = "" + value;
    this.setAttributeNode(attr);
  },
  removeAttribute: function(name) {
    var attr = this.getAttributeNode(name);
    attr && this.removeAttributeNode(attr);
  },
  //four real opeartion method
  appendChild: function(newChild) {
    if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
      return this.insertBefore(newChild, null);
    } else {
      return _appendSingleChild(this, newChild);
    }
  },
  setAttributeNode: function(newAttr) {
    return this.attributes.setNamedItem(newAttr);
  },
  setAttributeNodeNS: function(newAttr) {
    return this.attributes.setNamedItemNS(newAttr);
  },
  removeAttributeNode: function(oldAttr) {
    return this.attributes.removeNamedItem(oldAttr.nodeName);
  },
  //get real attribute name,and remove it by removeAttributeNode
  removeAttributeNS: function(namespaceURI, localName) {
    var old = this.getAttributeNodeNS(namespaceURI, localName);
    old && this.removeAttributeNode(old);
  },
  hasAttributeNS: function(namespaceURI, localName) {
    return this.getAttributeNodeNS(namespaceURI, localName) != null;
  },
  getAttributeNS: function(namespaceURI, localName) {
    var attr = this.getAttributeNodeNS(namespaceURI, localName);
    return attr && attr.value || "";
  },
  setAttributeNS: function(namespaceURI, qualifiedName, value) {
    var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
    attr.value = attr.nodeValue = "" + value;
    this.setAttributeNode(attr);
  },
  getAttributeNodeNS: function(namespaceURI, localName) {
    return this.attributes.getNamedItemNS(namespaceURI, localName);
  },
  getElementsByTagName: function(tagName) {
    return new LiveNodeList(this, function(base) {
      var ls = [];
      _visitNode(base, function(node) {
        if (node !== base && node.nodeType == ELEMENT_NODE && (tagName === "*" || node.tagName == tagName)) {
          ls.push(node);
        }
      });
      return ls;
    });
  },
  getElementsByTagNameNS: function(namespaceURI, localName) {
    return new LiveNodeList(this, function(base) {
      var ls = [];
      _visitNode(base, function(node) {
        if (node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === "*" || node.namespaceURI === namespaceURI) && (localName === "*" || node.localName == localName)) {
          ls.push(node);
        }
      });
      return ls;
    });
  }
};
Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
_extends(Element, Node);
function Attr() {
}
Attr.prototype.nodeType = ATTRIBUTE_NODE;
_extends(Attr, Node);
function CharacterData() {
}
CharacterData.prototype = {
  data: "",
  substringData: function(offset, count) {
    return this.data.substring(offset, offset + count);
  },
  appendData: function(text) {
    text = this.data + text;
    this.nodeValue = this.data = text;
    this.length = text.length;
  },
  insertData: function(offset, text) {
    this.replaceData(offset, 0, text);
  },
  appendChild: function(newChild) {
    throw new Error(ExceptionMessage[HIERARCHY_REQUEST_ERR]);
  },
  deleteData: function(offset, count) {
    this.replaceData(offset, count, "");
  },
  replaceData: function(offset, count, text) {
    var start = this.data.substring(0, offset);
    var end = this.data.substring(offset + count);
    text = start + text + end;
    this.nodeValue = this.data = text;
    this.length = text.length;
  }
};
_extends(CharacterData, Node);
function Text() {
}
Text.prototype = {
  nodeName: "#text",
  nodeType: TEXT_NODE,
  splitText: function(offset) {
    var text = this.data;
    var newText = text.substring(offset);
    text = text.substring(0, offset);
    this.data = this.nodeValue = text;
    this.length = text.length;
    var newNode = this.ownerDocument.createTextNode(newText);
    if (this.parentNode) {
      this.parentNode.insertBefore(newNode, this.nextSibling);
    }
    return newNode;
  }
};
_extends(Text, CharacterData);
function Comment() {
}
Comment.prototype = {
  nodeName: "#comment",
  nodeType: COMMENT_NODE
};
_extends(Comment, CharacterData);
function CDATASection() {
}
CDATASection.prototype = {
  nodeName: "#cdata-section",
  nodeType: CDATA_SECTION_NODE
};
_extends(CDATASection, CharacterData);
function DocumentType() {
}
DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
_extends(DocumentType, Node);
function Notation() {
}
Notation.prototype.nodeType = NOTATION_NODE;
_extends(Notation, Node);
function Entity() {
}
Entity.prototype.nodeType = ENTITY_NODE;
_extends(Entity, Node);
function EntityReference() {
}
EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
_extends(EntityReference, Node);
function DocumentFragment() {
}
DocumentFragment.prototype.nodeName = "#document-fragment";
DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;
_extends(DocumentFragment, Node);
function ProcessingInstruction() {
}
ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
_extends(ProcessingInstruction, Node);
function XMLSerializer() {
}
XMLSerializer.prototype.serializeToString = function(node, isHtml, nodeFilter) {
  return nodeSerializeToString.call(node, isHtml, nodeFilter);
};
Node.prototype.toString = nodeSerializeToString;
function nodeSerializeToString(isHtml, nodeFilter) {
  var buf = [];
  var refNode = this.nodeType == 9 && this.documentElement || this;
  var prefix = refNode.prefix;
  var uri = refNode.namespaceURI;
  if (uri && prefix == null) {
    var prefix = refNode.lookupPrefix(uri);
    if (prefix == null) {
      var visibleNamespaces = [
        { namespace: uri, prefix: null }
        //{namespace:uri,prefix:''}
      ];
    }
  }
  serializeToString(this, buf, isHtml, nodeFilter, visibleNamespaces);
  return buf.join("");
}
function needNamespaceDefine(node, isHTML, visibleNamespaces) {
  var prefix = node.prefix || "";
  var uri = node.namespaceURI;
  if (!uri) {
    return false;
  }
  if (prefix === "xml" && uri === NAMESPACE$2.XML || uri === NAMESPACE$2.XMLNS) {
    return false;
  }
  var i = visibleNamespaces.length;
  while (i--) {
    var ns = visibleNamespaces[i];
    if (ns.prefix === prefix) {
      return ns.namespace !== uri;
    }
  }
  return true;
}
function addSerializedAttribute(buf, qualifiedName, value) {
  buf.push(" ", qualifiedName, '="', value.replace(/[<>&"\t\n\r]/g, _xmlEncoder), '"');
}
function serializeToString(node, buf, isHTML, nodeFilter, visibleNamespaces) {
  if (!visibleNamespaces) {
    visibleNamespaces = [];
  }
  if (nodeFilter) {
    node = nodeFilter(node);
    if (node) {
      if (typeof node == "string") {
        buf.push(node);
        return;
      }
    } else {
      return;
    }
  }
  switch (node.nodeType) {
    case ELEMENT_NODE:
      var attrs = node.attributes;
      var len = attrs.length;
      var child = node.firstChild;
      var nodeName = node.tagName;
      isHTML = NAMESPACE$2.isHTML(node.namespaceURI) || isHTML;
      var prefixedNodeName = nodeName;
      if (!isHTML && !node.prefix && node.namespaceURI) {
        var defaultNS;
        for (var ai = 0; ai < attrs.length; ai++) {
          if (attrs.item(ai).name === "xmlns") {
            defaultNS = attrs.item(ai).value;
            break;
          }
        }
        if (!defaultNS) {
          for (var nsi = visibleNamespaces.length - 1; nsi >= 0; nsi--) {
            var namespace = visibleNamespaces[nsi];
            if (namespace.prefix === "" && namespace.namespace === node.namespaceURI) {
              defaultNS = namespace.namespace;
              break;
            }
          }
        }
        if (defaultNS !== node.namespaceURI) {
          for (var nsi = visibleNamespaces.length - 1; nsi >= 0; nsi--) {
            var namespace = visibleNamespaces[nsi];
            if (namespace.namespace === node.namespaceURI) {
              if (namespace.prefix) {
                prefixedNodeName = namespace.prefix + ":" + nodeName;
              }
              break;
            }
          }
        }
      }
      buf.push("<", prefixedNodeName);
      for (var i = 0; i < len; i++) {
        var attr = attrs.item(i);
        if (attr.prefix == "xmlns") {
          visibleNamespaces.push({ prefix: attr.localName, namespace: attr.value });
        } else if (attr.nodeName == "xmlns") {
          visibleNamespaces.push({ prefix: "", namespace: attr.value });
        }
      }
      for (var i = 0; i < len; i++) {
        var attr = attrs.item(i);
        if (needNamespaceDefine(attr, isHTML, visibleNamespaces)) {
          var prefix = attr.prefix || "";
          var uri = attr.namespaceURI;
          addSerializedAttribute(buf, prefix ? "xmlns:" + prefix : "xmlns", uri);
          visibleNamespaces.push({ prefix, namespace: uri });
        }
        serializeToString(attr, buf, isHTML, nodeFilter, visibleNamespaces);
      }
      if (nodeName === prefixedNodeName && needNamespaceDefine(node, isHTML, visibleNamespaces)) {
        var prefix = node.prefix || "";
        var uri = node.namespaceURI;
        addSerializedAttribute(buf, prefix ? "xmlns:" + prefix : "xmlns", uri);
        visibleNamespaces.push({ prefix, namespace: uri });
      }
      if (child || isHTML && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)) {
        buf.push(">");
        if (isHTML && /^script$/i.test(nodeName)) {
          while (child) {
            if (child.data) {
              buf.push(child.data);
            } else {
              serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
            }
            child = child.nextSibling;
          }
        } else {
          while (child) {
            serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
            child = child.nextSibling;
          }
        }
        buf.push("</", prefixedNodeName, ">");
      } else {
        buf.push("/>");
      }
      return;
    case DOCUMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE:
      var child = node.firstChild;
      while (child) {
        serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
        child = child.nextSibling;
      }
      return;
    case ATTRIBUTE_NODE:
      return addSerializedAttribute(buf, node.name, node.value);
    case TEXT_NODE:
      return buf.push(
        node.data.replace(/[<&>]/g, _xmlEncoder)
      );
    case CDATA_SECTION_NODE:
      return buf.push("<![CDATA[", node.data, "]]>");
    case COMMENT_NODE:
      return buf.push("<!--", node.data, "-->");
    case DOCUMENT_TYPE_NODE:
      var pubid = node.publicId;
      var sysid = node.systemId;
      buf.push("<!DOCTYPE ", node.name);
      if (pubid) {
        buf.push(" PUBLIC ", pubid);
        if (sysid && sysid != ".") {
          buf.push(" ", sysid);
        }
        buf.push(">");
      } else if (sysid && sysid != ".") {
        buf.push(" SYSTEM ", sysid, ">");
      } else {
        var sub = node.internalSubset;
        if (sub) {
          buf.push(" [", sub, "]");
        }
        buf.push(">");
      }
      return;
    case PROCESSING_INSTRUCTION_NODE:
      return buf.push("<?", node.target, " ", node.data, "?>");
    case ENTITY_REFERENCE_NODE:
      return buf.push("&", node.nodeName, ";");
    default:
      buf.push("??", node.nodeName);
  }
}
function importNode(doc, node, deep) {
  var node2;
  switch (node.nodeType) {
    case ELEMENT_NODE:
      node2 = node.cloneNode(false);
      node2.ownerDocument = doc;
    case DOCUMENT_FRAGMENT_NODE:
      break;
    case ATTRIBUTE_NODE:
      deep = true;
      break;
  }
  if (!node2) {
    node2 = node.cloneNode(false);
  }
  node2.ownerDocument = doc;
  node2.parentNode = null;
  if (deep) {
    var child = node.firstChild;
    while (child) {
      node2.appendChild(importNode(doc, child, deep));
      child = child.nextSibling;
    }
  }
  return node2;
}
function cloneNode(doc, node, deep) {
  var node2 = new node.constructor();
  for (var n in node) {
    if (Object.prototype.hasOwnProperty.call(node, n)) {
      var v = node[n];
      if (typeof v != "object") {
        if (v != node2[n]) {
          node2[n] = v;
        }
      }
    }
  }
  if (node.childNodes) {
    node2.childNodes = new NodeList();
  }
  node2.ownerDocument = doc;
  switch (node2.nodeType) {
    case ELEMENT_NODE:
      var attrs = node.attributes;
      var attrs2 = node2.attributes = new NamedNodeMap();
      var len = attrs.length;
      attrs2._ownerElement = node2;
      for (var i = 0; i < len; i++) {
        node2.setAttributeNode(cloneNode(doc, attrs.item(i), true));
      }
      break;
    case ATTRIBUTE_NODE:
      deep = true;
  }
  if (deep) {
    var child = node.firstChild;
    while (child) {
      node2.appendChild(cloneNode(doc, child, deep));
      child = child.nextSibling;
    }
  }
  return node2;
}
function __set__(object, key, value) {
  object[key] = value;
}
try {
  if (Object.defineProperty) {
    let getTextContent = function(node) {
      switch (node.nodeType) {
        case ELEMENT_NODE:
        case DOCUMENT_FRAGMENT_NODE:
          var buf = [];
          node = node.firstChild;
          while (node) {
            if (node.nodeType !== 7 && node.nodeType !== 8) {
              buf.push(getTextContent(node));
            }
            node = node.nextSibling;
          }
          return buf.join("");
        default:
          return node.nodeValue;
      }
    };
    Object.defineProperty(LiveNodeList.prototype, "length", {
      get: function() {
        _updateLiveList(this);
        return this.$$length;
      }
    });
    Object.defineProperty(Node.prototype, "textContent", {
      get: function() {
        return getTextContent(this);
      },
      set: function(data) {
        switch (this.nodeType) {
          case ELEMENT_NODE:
          case DOCUMENT_FRAGMENT_NODE:
            while (this.firstChild) {
              this.removeChild(this.firstChild);
            }
            if (data || String(data)) {
              this.appendChild(this.ownerDocument.createTextNode(data));
            }
            break;
          default:
            this.data = data;
            this.value = data;
            this.nodeValue = data;
        }
      }
    });
    __set__ = function(object, key, value) {
      object["$$" + key] = value;
    };
  }
} catch (e) {
}
dom$1.DocumentType = DocumentType;
dom$1.DOMException = DOMException;
dom$1.DOMImplementation = DOMImplementation$1;
dom$1.Element = Element;
dom$1.Node = Node;
dom$1.NodeList = NodeList;
dom$1.XMLSerializer = XMLSerializer;
var domParser = {};
var entities$1 = {};
(function(exports) {
  var freeze2 = conventions$2.freeze;
  exports.XML_ENTITIES = freeze2({ amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' });
  exports.HTML_ENTITIES = freeze2({
    lt: "<",
    gt: ">",
    amp: "&",
    quot: '"',
    apos: "'",
    Agrave: "À",
    Aacute: "Á",
    Acirc: "Â",
    Atilde: "Ã",
    Auml: "Ä",
    Aring: "Å",
    AElig: "Æ",
    Ccedil: "Ç",
    Egrave: "È",
    Eacute: "É",
    Ecirc: "Ê",
    Euml: "Ë",
    Igrave: "Ì",
    Iacute: "Í",
    Icirc: "Î",
    Iuml: "Ï",
    ETH: "Ð",
    Ntilde: "Ñ",
    Ograve: "Ò",
    Oacute: "Ó",
    Ocirc: "Ô",
    Otilde: "Õ",
    Ouml: "Ö",
    Oslash: "Ø",
    Ugrave: "Ù",
    Uacute: "Ú",
    Ucirc: "Û",
    Uuml: "Ü",
    Yacute: "Ý",
    THORN: "Þ",
    szlig: "ß",
    agrave: "à",
    aacute: "á",
    acirc: "â",
    atilde: "ã",
    auml: "ä",
    aring: "å",
    aelig: "æ",
    ccedil: "ç",
    egrave: "è",
    eacute: "é",
    ecirc: "ê",
    euml: "ë",
    igrave: "ì",
    iacute: "í",
    icirc: "î",
    iuml: "ï",
    eth: "ð",
    ntilde: "ñ",
    ograve: "ò",
    oacute: "ó",
    ocirc: "ô",
    otilde: "õ",
    ouml: "ö",
    oslash: "ø",
    ugrave: "ù",
    uacute: "ú",
    ucirc: "û",
    uuml: "ü",
    yacute: "ý",
    thorn: "þ",
    yuml: "ÿ",
    nbsp: " ",
    iexcl: "¡",
    cent: "¢",
    pound: "£",
    curren: "¤",
    yen: "¥",
    brvbar: "¦",
    sect: "§",
    uml: "¨",
    copy: "©",
    ordf: "ª",
    laquo: "«",
    not: "¬",
    shy: "­­",
    reg: "®",
    macr: "¯",
    deg: "°",
    plusmn: "±",
    sup2: "²",
    sup3: "³",
    acute: "´",
    micro: "µ",
    para: "¶",
    middot: "·",
    cedil: "¸",
    sup1: "¹",
    ordm: "º",
    raquo: "»",
    frac14: "¼",
    frac12: "½",
    frac34: "¾",
    iquest: "¿",
    times: "×",
    divide: "÷",
    forall: "∀",
    part: "∂",
    exist: "∃",
    empty: "∅",
    nabla: "∇",
    isin: "∈",
    notin: "∉",
    ni: "∋",
    prod: "∏",
    sum: "∑",
    minus: "−",
    lowast: "∗",
    radic: "√",
    prop: "∝",
    infin: "∞",
    ang: "∠",
    and: "∧",
    or: "∨",
    cap: "∩",
    cup: "∪",
    "int": "∫",
    there4: "∴",
    sim: "∼",
    cong: "≅",
    asymp: "≈",
    ne: "≠",
    equiv: "≡",
    le: "≤",
    ge: "≥",
    sub: "⊂",
    sup: "⊃",
    nsub: "⊄",
    sube: "⊆",
    supe: "⊇",
    oplus: "⊕",
    otimes: "⊗",
    perp: "⊥",
    sdot: "⋅",
    Alpha: "Α",
    Beta: "Β",
    Gamma: "Γ",
    Delta: "Δ",
    Epsilon: "Ε",
    Zeta: "Ζ",
    Eta: "Η",
    Theta: "Θ",
    Iota: "Ι",
    Kappa: "Κ",
    Lambda: "Λ",
    Mu: "Μ",
    Nu: "Ν",
    Xi: "Ξ",
    Omicron: "Ο",
    Pi: "Π",
    Rho: "Ρ",
    Sigma: "Σ",
    Tau: "Τ",
    Upsilon: "Υ",
    Phi: "Φ",
    Chi: "Χ",
    Psi: "Ψ",
    Omega: "Ω",
    alpha: "α",
    beta: "β",
    gamma: "γ",
    delta: "δ",
    epsilon: "ε",
    zeta: "ζ",
    eta: "η",
    theta: "θ",
    iota: "ι",
    kappa: "κ",
    lambda: "λ",
    mu: "μ",
    nu: "ν",
    xi: "ξ",
    omicron: "ο",
    pi: "π",
    rho: "ρ",
    sigmaf: "ς",
    sigma: "σ",
    tau: "τ",
    upsilon: "υ",
    phi: "φ",
    chi: "χ",
    psi: "ψ",
    omega: "ω",
    thetasym: "ϑ",
    upsih: "ϒ",
    piv: "ϖ",
    OElig: "Œ",
    oelig: "œ",
    Scaron: "Š",
    scaron: "š",
    Yuml: "Ÿ",
    fnof: "ƒ",
    circ: "ˆ",
    tilde: "˜",
    ensp: " ",
    emsp: " ",
    thinsp: " ",
    zwnj: "‌",
    zwj: "‍",
    lrm: "‎",
    rlm: "‏",
    ndash: "–",
    mdash: "—",
    lsquo: "‘",
    rsquo: "’",
    sbquo: "‚",
    ldquo: "“",
    rdquo: "”",
    bdquo: "„",
    dagger: "†",
    Dagger: "‡",
    bull: "•",
    hellip: "…",
    permil: "‰",
    prime: "′",
    Prime: "″",
    lsaquo: "‹",
    rsaquo: "›",
    oline: "‾",
    euro: "€",
    trade: "™",
    larr: "←",
    uarr: "↑",
    rarr: "→",
    darr: "↓",
    harr: "↔",
    crarr: "↵",
    lceil: "⌈",
    rceil: "⌉",
    lfloor: "⌊",
    rfloor: "⌋",
    loz: "◊",
    spades: "♠",
    clubs: "♣",
    hearts: "♥",
    diams: "♦"
  });
  exports.entityMap = exports.HTML_ENTITIES;
})(entities$1);
var sax$1 = {};
var NAMESPACE$1 = conventions$2.NAMESPACE;
var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
var nameChar = new RegExp("[\\-\\.0-9" + nameStartChar.source.slice(1, -1) + "\\u00B7\\u0300-\\u036F\\u203F-\\u2040]");
var tagNamePattern = new RegExp("^" + nameStartChar.source + nameChar.source + "*(?::" + nameStartChar.source + nameChar.source + "*)?$");
var S_TAG = 0;
var S_ATTR = 1;
var S_ATTR_SPACE = 2;
var S_EQ = 3;
var S_ATTR_NOQUOT_VALUE = 4;
var S_ATTR_END = 5;
var S_TAG_SPACE = 6;
var S_TAG_CLOSE = 7;
function ParseError$1(message, locator) {
  this.message = message;
  this.locator = locator;
  if (Error.captureStackTrace)
    Error.captureStackTrace(this, ParseError$1);
}
ParseError$1.prototype = new Error();
ParseError$1.prototype.name = ParseError$1.name;
function XMLReader$1() {
}
XMLReader$1.prototype = {
  parse: function(source, defaultNSMap, entityMap) {
    var domBuilder = this.domBuilder;
    domBuilder.startDocument();
    _copy(defaultNSMap, defaultNSMap = {});
    parse(
      source,
      defaultNSMap,
      entityMap,
      domBuilder,
      this.errorHandler
    );
    domBuilder.endDocument();
  }
};
function parse(source, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
  function fixedFromCharCode(code) {
    if (code > 65535) {
      code -= 65536;
      var surrogate1 = 55296 + (code >> 10), surrogate2 = 56320 + (code & 1023);
      return String.fromCharCode(surrogate1, surrogate2);
    } else {
      return String.fromCharCode(code);
    }
  }
  function entityReplacer(a2) {
    var k = a2.slice(1, -1);
    if (Object.hasOwnProperty.call(entityMap, k)) {
      return entityMap[k];
    } else if (k.charAt(0) === "#") {
      return fixedFromCharCode(parseInt(k.substr(1).replace("x", "0x")));
    } else {
      errorHandler.error("entity not found:" + a2);
      return a2;
    }
  }
  function appendText(end2) {
    if (end2 > start) {
      var xt = source.substring(start, end2).replace(/&#?\w+;/g, entityReplacer);
      locator && position2(start);
      domBuilder.characters(xt, 0, end2 - start);
      start = end2;
    }
  }
  function position2(p, m) {
    while (p >= lineEnd && (m = linePattern.exec(source))) {
      lineStart = m.index;
      lineEnd = lineStart + m[0].length;
      locator.lineNumber++;
    }
    locator.columnNumber = p - lineStart + 1;
  }
  var lineStart = 0;
  var lineEnd = 0;
  var linePattern = /.*(?:\r\n?|\n)|.*$/g;
  var locator = domBuilder.locator;
  var parseStack = [{ currentNSMap: defaultNSMapCopy }];
  var closeMap = {};
  var start = 0;
  while (true) {
    try {
      var tagStart = source.indexOf("<", start);
      if (tagStart < 0) {
        if (!source.substr(start).match(/^\s*$/)) {
          var doc = domBuilder.doc;
          var text = doc.createTextNode(source.substr(start));
          doc.appendChild(text);
          domBuilder.currentElement = text;
        }
        return;
      }
      if (tagStart > start) {
        appendText(tagStart);
      }
      switch (source.charAt(tagStart + 1)) {
        case "/":
          var end = source.indexOf(">", tagStart + 3);
          var tagName = source.substring(tagStart + 2, end).replace(/[ \t\n\r]+$/g, "");
          var config = parseStack.pop();
          if (end < 0) {
            tagName = source.substring(tagStart + 2).replace(/[\s<].*/, "");
            errorHandler.error("end tag name: " + tagName + " is not complete:" + config.tagName);
            end = tagStart + 1 + tagName.length;
          } else if (tagName.match(/\s</)) {
            tagName = tagName.replace(/[\s<].*/, "");
            errorHandler.error("end tag name: " + tagName + " maybe not complete");
            end = tagStart + 1 + tagName.length;
          }
          var localNSMap = config.localNSMap;
          var endMatch = config.tagName == tagName;
          var endIgnoreCaseMach = endMatch || config.tagName && config.tagName.toLowerCase() == tagName.toLowerCase();
          if (endIgnoreCaseMach) {
            domBuilder.endElement(config.uri, config.localName, tagName);
            if (localNSMap) {
              for (var prefix in localNSMap) {
                if (Object.prototype.hasOwnProperty.call(localNSMap, prefix)) {
                  domBuilder.endPrefixMapping(prefix);
                }
              }
            }
            if (!endMatch) {
              errorHandler.fatalError("end tag name: " + tagName + " is not match the current start tagName:" + config.tagName);
            }
          } else {
            parseStack.push(config);
          }
          end++;
          break;
        case "?":
          locator && position2(tagStart);
          end = parseInstruction(source, tagStart, domBuilder);
          break;
        case "!":
          locator && position2(tagStart);
          end = parseDCC(source, tagStart, domBuilder, errorHandler);
          break;
        default:
          locator && position2(tagStart);
          var el = new ElementAttributes();
          var currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
          var end = parseElementStartPart(source, tagStart, el, currentNSMap, entityReplacer, errorHandler);
          var len = el.length;
          if (!el.closed && fixSelfClosed(source, end, el.tagName, closeMap)) {
            el.closed = true;
            if (!entityMap.nbsp) {
              errorHandler.warning("unclosed xml attribute");
            }
          }
          if (locator && len) {
            var locator2 = copyLocator(locator, {});
            for (var i = 0; i < len; i++) {
              var a = el[i];
              position2(a.offset);
              a.locator = copyLocator(locator, {});
            }
            domBuilder.locator = locator2;
            if (appendElement$1(el, domBuilder, currentNSMap)) {
              parseStack.push(el);
            }
            domBuilder.locator = locator;
          } else {
            if (appendElement$1(el, domBuilder, currentNSMap)) {
              parseStack.push(el);
            }
          }
          if (NAMESPACE$1.isHTML(el.uri) && !el.closed) {
            end = parseHtmlSpecialContent(source, end, el.tagName, entityReplacer, domBuilder);
          } else {
            end++;
          }
      }
    } catch (e) {
      if (e instanceof ParseError$1) {
        throw e;
      }
      errorHandler.error("element parse error: " + e);
      end = -1;
    }
    if (end > start) {
      start = end;
    } else {
      appendText(Math.max(tagStart, start) + 1);
    }
  }
}
function copyLocator(f, t) {
  t.lineNumber = f.lineNumber;
  t.columnNumber = f.columnNumber;
  return t;
}
function parseElementStartPart(source, start, el, currentNSMap, entityReplacer, errorHandler) {
  function addAttribute(qname, value2, startIndex) {
    if (el.attributeNames.hasOwnProperty(qname)) {
      errorHandler.fatalError("Attribute " + qname + " redefined");
    }
    el.addValue(
      qname,
      // @see https://www.w3.org/TR/xml/#AVNormalize
      // since the xmldom sax parser does not "interpret" DTD the following is not implemented:
      // - recursive replacement of (DTD) entity references
      // - trimming and collapsing multiple spaces into a single one for attributes that are not of type CDATA
      value2.replace(/[\t\n\r]/g, " ").replace(/&#?\w+;/g, entityReplacer),
      startIndex
    );
  }
  var attrName;
  var value;
  var p = ++start;
  var s = S_TAG;
  while (true) {
    var c = source.charAt(p);
    switch (c) {
      case "=":
        if (s === S_ATTR) {
          attrName = source.slice(start, p);
          s = S_EQ;
        } else if (s === S_ATTR_SPACE) {
          s = S_EQ;
        } else {
          throw new Error("attribute equal must after attrName");
        }
        break;
      case "'":
      case '"':
        if (s === S_EQ || s === S_ATTR) {
          if (s === S_ATTR) {
            errorHandler.warning('attribute value must after "="');
            attrName = source.slice(start, p);
          }
          start = p + 1;
          p = source.indexOf(c, start);
          if (p > 0) {
            value = source.slice(start, p);
            addAttribute(attrName, value, start - 1);
            s = S_ATTR_END;
          } else {
            throw new Error("attribute value no end '" + c + "' match");
          }
        } else if (s == S_ATTR_NOQUOT_VALUE) {
          value = source.slice(start, p);
          addAttribute(attrName, value, start);
          errorHandler.warning('attribute "' + attrName + '" missed start quot(' + c + ")!!");
          start = p + 1;
          s = S_ATTR_END;
        } else {
          throw new Error('attribute value must after "="');
        }
        break;
      case "/":
        switch (s) {
          case S_TAG:
            el.setTagName(source.slice(start, p));
          case S_ATTR_END:
          case S_TAG_SPACE:
          case S_TAG_CLOSE:
            s = S_TAG_CLOSE;
            el.closed = true;
          case S_ATTR_NOQUOT_VALUE:
          case S_ATTR:
          case S_ATTR_SPACE:
            break;
          default:
            throw new Error("attribute invalid close char('/')");
        }
        break;
      case "":
        errorHandler.error("unexpected end of input");
        if (s == S_TAG) {
          el.setTagName(source.slice(start, p));
        }
        return p;
      case ">":
        switch (s) {
          case S_TAG:
            el.setTagName(source.slice(start, p));
          case S_ATTR_END:
          case S_TAG_SPACE:
          case S_TAG_CLOSE:
            break;
          case S_ATTR_NOQUOT_VALUE:
          case S_ATTR:
            value = source.slice(start, p);
            if (value.slice(-1) === "/") {
              el.closed = true;
              value = value.slice(0, -1);
            }
          case S_ATTR_SPACE:
            if (s === S_ATTR_SPACE) {
              value = attrName;
            }
            if (s == S_ATTR_NOQUOT_VALUE) {
              errorHandler.warning('attribute "' + value + '" missed quot(")!');
              addAttribute(attrName, value, start);
            } else {
              if (!NAMESPACE$1.isHTML(currentNSMap[""]) || !value.match(/^(?:disabled|checked|selected)$/i)) {
                errorHandler.warning('attribute "' + value + '" missed value!! "' + value + '" instead!!');
              }
              addAttribute(value, value, start);
            }
            break;
          case S_EQ:
            throw new Error("attribute value missed!!");
        }
        return p;
      case "":
        c = " ";
      default:
        if (c <= " ") {
          switch (s) {
            case S_TAG:
              el.setTagName(source.slice(start, p));
              s = S_TAG_SPACE;
              break;
            case S_ATTR:
              attrName = source.slice(start, p);
              s = S_ATTR_SPACE;
              break;
            case S_ATTR_NOQUOT_VALUE:
              var value = source.slice(start, p);
              errorHandler.warning('attribute "' + value + '" missed quot(")!!');
              addAttribute(attrName, value, start);
            case S_ATTR_END:
              s = S_TAG_SPACE;
              break;
          }
        } else {
          switch (s) {
            case S_ATTR_SPACE:
              el.tagName;
              if (!NAMESPACE$1.isHTML(currentNSMap[""]) || !attrName.match(/^(?:disabled|checked|selected)$/i)) {
                errorHandler.warning('attribute "' + attrName + '" missed value!! "' + attrName + '" instead2!!');
              }
              addAttribute(attrName, attrName, start);
              start = p;
              s = S_ATTR;
              break;
            case S_ATTR_END:
              errorHandler.warning('attribute space is required"' + attrName + '"!!');
            case S_TAG_SPACE:
              s = S_ATTR;
              start = p;
              break;
            case S_EQ:
              s = S_ATTR_NOQUOT_VALUE;
              start = p;
              break;
            case S_TAG_CLOSE:
              throw new Error("elements closed character '/' and '>' must be connected to");
          }
        }
    }
    p++;
  }
}
function appendElement$1(el, domBuilder, currentNSMap) {
  var tagName = el.tagName;
  var localNSMap = null;
  var i = el.length;
  while (i--) {
    var a = el[i];
    var qName = a.qName;
    var value = a.value;
    var nsp = qName.indexOf(":");
    if (nsp > 0) {
      var prefix = a.prefix = qName.slice(0, nsp);
      var localName = qName.slice(nsp + 1);
      var nsPrefix = prefix === "xmlns" && localName;
    } else {
      localName = qName;
      prefix = null;
      nsPrefix = qName === "xmlns" && "";
    }
    a.localName = localName;
    if (nsPrefix !== false) {
      if (localNSMap == null) {
        localNSMap = {};
        _copy(currentNSMap, currentNSMap = {});
      }
      currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
      a.uri = NAMESPACE$1.XMLNS;
      domBuilder.startPrefixMapping(nsPrefix, value);
    }
  }
  var i = el.length;
  while (i--) {
    a = el[i];
    var prefix = a.prefix;
    if (prefix) {
      if (prefix === "xml") {
        a.uri = NAMESPACE$1.XML;
      }
      if (prefix !== "xmlns") {
        a.uri = currentNSMap[prefix || ""];
      }
    }
  }
  var nsp = tagName.indexOf(":");
  if (nsp > 0) {
    prefix = el.prefix = tagName.slice(0, nsp);
    localName = el.localName = tagName.slice(nsp + 1);
  } else {
    prefix = null;
    localName = el.localName = tagName;
  }
  var ns = el.uri = currentNSMap[prefix || ""];
  domBuilder.startElement(ns, localName, tagName, el);
  if (el.closed) {
    domBuilder.endElement(ns, localName, tagName);
    if (localNSMap) {
      for (prefix in localNSMap) {
        if (Object.prototype.hasOwnProperty.call(localNSMap, prefix)) {
          domBuilder.endPrefixMapping(prefix);
        }
      }
    }
  } else {
    el.currentNSMap = currentNSMap;
    el.localNSMap = localNSMap;
    return true;
  }
}
function parseHtmlSpecialContent(source, elStartEnd, tagName, entityReplacer, domBuilder) {
  if (/^(?:script|textarea)$/i.test(tagName)) {
    var elEndStart = source.indexOf("</" + tagName + ">", elStartEnd);
    var text = source.substring(elStartEnd + 1, elEndStart);
    if (/[&<]/.test(text)) {
      if (/^script$/i.test(tagName)) {
        domBuilder.characters(text, 0, text.length);
        return elEndStart;
      }
      text = text.replace(/&#?\w+;/g, entityReplacer);
      domBuilder.characters(text, 0, text.length);
      return elEndStart;
    }
  }
  return elStartEnd + 1;
}
function fixSelfClosed(source, elStartEnd, tagName, closeMap) {
  var pos = closeMap[tagName];
  if (pos == null) {
    pos = source.lastIndexOf("</" + tagName + ">");
    if (pos < elStartEnd) {
      pos = source.lastIndexOf("</" + tagName);
    }
    closeMap[tagName] = pos;
  }
  return pos < elStartEnd;
}
function _copy(source, target) {
  for (var n in source) {
    if (Object.prototype.hasOwnProperty.call(source, n)) {
      target[n] = source[n];
    }
  }
}
function parseDCC(source, start, domBuilder, errorHandler) {
  var next = source.charAt(start + 2);
  switch (next) {
    case "-":
      if (source.charAt(start + 3) === "-") {
        var end = source.indexOf("-->", start + 4);
        if (end > start) {
          domBuilder.comment(source, start + 4, end - start - 4);
          return end + 3;
        } else {
          errorHandler.error("Unclosed comment");
          return -1;
        }
      } else {
        return -1;
      }
    default:
      if (source.substr(start + 3, 6) == "CDATA[") {
        var end = source.indexOf("]]>", start + 9);
        domBuilder.startCDATA();
        domBuilder.characters(source, start + 9, end - start - 9);
        domBuilder.endCDATA();
        return end + 3;
      }
      var matchs = split(source, start);
      var len = matchs.length;
      if (len > 1 && /!doctype/i.test(matchs[0][0])) {
        var name = matchs[1][0];
        var pubid = false;
        var sysid = false;
        if (len > 3) {
          if (/^public$/i.test(matchs[2][0])) {
            pubid = matchs[3][0];
            sysid = len > 4 && matchs[4][0];
          } else if (/^system$/i.test(matchs[2][0])) {
            sysid = matchs[3][0];
          }
        }
        var lastMatch = matchs[len - 1];
        domBuilder.startDTD(name, pubid, sysid);
        domBuilder.endDTD();
        return lastMatch.index + lastMatch[0].length;
      }
  }
  return -1;
}
function parseInstruction(source, start, domBuilder) {
  var end = source.indexOf("?>", start);
  if (end) {
    var match = source.substring(start, end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
    if (match) {
      match[0].length;
      domBuilder.processingInstruction(match[1], match[2]);
      return end + 2;
    } else {
      return -1;
    }
  }
  return -1;
}
function ElementAttributes() {
  this.attributeNames = {};
}
ElementAttributes.prototype = {
  setTagName: function(tagName) {
    if (!tagNamePattern.test(tagName)) {
      throw new Error("invalid tagName:" + tagName);
    }
    this.tagName = tagName;
  },
  addValue: function(qName, value, offset) {
    if (!tagNamePattern.test(qName)) {
      throw new Error("invalid attribute:" + qName);
    }
    this.attributeNames[qName] = this.length;
    this[this.length++] = { qName, value, offset };
  },
  length: 0,
  getLocalName: function(i) {
    return this[i].localName;
  },
  getLocator: function(i) {
    return this[i].locator;
  },
  getQName: function(i) {
    return this[i].qName;
  },
  getURI: function(i) {
    return this[i].uri;
  },
  getValue: function(i) {
    return this[i].value;
  }
  //	,getIndex:function(uri, localName)){
  //		if(localName){
  //
  //		}else{
  //			var qName = uri
  //		}
  //	},
  //	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
  //	getType:function(uri,localName){}
  //	getType:function(i){},
};
function split(source, start) {
  var match;
  var buf = [];
  var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
  reg.lastIndex = start;
  reg.exec(source);
  while (match = reg.exec(source)) {
    buf.push(match);
    if (match[1])
      return buf;
  }
}
sax$1.XMLReader = XMLReader$1;
sax$1.ParseError = ParseError$1;
var conventions = conventions$2;
var dom = dom$1;
var entities = entities$1;
var sax = sax$1;
var DOMImplementation = dom.DOMImplementation;
var NAMESPACE = conventions.NAMESPACE;
var ParseError = sax.ParseError;
var XMLReader = sax.XMLReader;
function normalizeLineEndings(input) {
  return input.replace(/\r[\n\u0085]/g, "\n").replace(/[\r\u0085\u2028]/g, "\n");
}
function DOMParser$1(options) {
  this.options = options || { locator: {} };
}
DOMParser$1.prototype.parseFromString = function(source, mimeType) {
  var options = this.options;
  var sax2 = new XMLReader();
  var domBuilder = options.domBuilder || new DOMHandler();
  var errorHandler = options.errorHandler;
  var locator = options.locator;
  var defaultNSMap = options.xmlns || {};
  var isHTML = /\/x?html?$/.test(mimeType);
  var entityMap = isHTML ? entities.HTML_ENTITIES : entities.XML_ENTITIES;
  if (locator) {
    domBuilder.setDocumentLocator(locator);
  }
  sax2.errorHandler = buildErrorHandler(errorHandler, domBuilder, locator);
  sax2.domBuilder = options.domBuilder || domBuilder;
  if (isHTML) {
    defaultNSMap[""] = NAMESPACE.HTML;
  }
  defaultNSMap.xml = defaultNSMap.xml || NAMESPACE.XML;
  var normalize = options.normalizeLineEndings || normalizeLineEndings;
  if (source && typeof source === "string") {
    sax2.parse(
      normalize(source),
      defaultNSMap,
      entityMap
    );
  } else {
    sax2.errorHandler.error("invalid doc source");
  }
  return domBuilder.doc;
};
function buildErrorHandler(errorImpl, domBuilder, locator) {
  if (!errorImpl) {
    if (domBuilder instanceof DOMHandler) {
      return domBuilder;
    }
    errorImpl = domBuilder;
  }
  var errorHandler = {};
  var isCallback = errorImpl instanceof Function;
  locator = locator || {};
  function build(key) {
    var fn = errorImpl[key];
    if (!fn && isCallback) {
      fn = errorImpl.length == 2 ? function(msg) {
        errorImpl(key, msg);
      } : errorImpl;
    }
    errorHandler[key] = fn && function(msg) {
      fn("[xmldom " + key + "]	" + msg + _locator(locator));
    } || function() {
    };
  }
  build("warning");
  build("error");
  build("fatalError");
  return errorHandler;
}
function DOMHandler() {
  this.cdata = false;
}
function position(locator, node) {
  node.lineNumber = locator.lineNumber;
  node.columnNumber = locator.columnNumber;
}
DOMHandler.prototype = {
  startDocument: function() {
    this.doc = new DOMImplementation().createDocument(null, null, null);
    if (this.locator) {
      this.doc.documentURI = this.locator.systemId;
    }
  },
  startElement: function(namespaceURI, localName, qName, attrs) {
    var doc = this.doc;
    var el = doc.createElementNS(namespaceURI, qName || localName);
    var len = attrs.length;
    appendElement(this, el);
    this.currentElement = el;
    this.locator && position(this.locator, el);
    for (var i = 0; i < len; i++) {
      var namespaceURI = attrs.getURI(i);
      var value = attrs.getValue(i);
      var qName = attrs.getQName(i);
      var attr = doc.createAttributeNS(namespaceURI, qName);
      this.locator && position(attrs.getLocator(i), attr);
      attr.value = attr.nodeValue = value;
      el.setAttributeNode(attr);
    }
  },
  endElement: function(namespaceURI, localName, qName) {
    var current = this.currentElement;
    current.tagName;
    this.currentElement = current.parentNode;
  },
  startPrefixMapping: function(prefix, uri) {
  },
  endPrefixMapping: function(prefix) {
  },
  processingInstruction: function(target, data) {
    var ins = this.doc.createProcessingInstruction(target, data);
    this.locator && position(this.locator, ins);
    appendElement(this, ins);
  },
  ignorableWhitespace: function(ch, start, length) {
  },
  characters: function(chars, start, length) {
    chars = _toString.apply(this, arguments);
    if (chars) {
      if (this.cdata) {
        var charNode = this.doc.createCDATASection(chars);
      } else {
        var charNode = this.doc.createTextNode(chars);
      }
      if (this.currentElement) {
        this.currentElement.appendChild(charNode);
      } else if (/^\s*$/.test(chars)) {
        this.doc.appendChild(charNode);
      }
      this.locator && position(this.locator, charNode);
    }
  },
  skippedEntity: function(name) {
  },
  endDocument: function() {
    this.doc.normalize();
  },
  setDocumentLocator: function(locator) {
    if (this.locator = locator) {
      locator.lineNumber = 0;
    }
  },
  //LexicalHandler
  comment: function(chars, start, length) {
    chars = _toString.apply(this, arguments);
    var comm = this.doc.createComment(chars);
    this.locator && position(this.locator, comm);
    appendElement(this, comm);
  },
  startCDATA: function() {
    this.cdata = true;
  },
  endCDATA: function() {
    this.cdata = false;
  },
  startDTD: function(name, publicId, systemId) {
    var impl = this.doc.implementation;
    if (impl && impl.createDocumentType) {
      var dt = impl.createDocumentType(name, publicId, systemId);
      this.locator && position(this.locator, dt);
      appendElement(this, dt);
      this.doc.doctype = dt;
    }
  },
  /**
   * @see org.xml.sax.ErrorHandler
   * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
   */
  warning: function(error) {
    console.warn("[xmldom warning]	" + error, _locator(this.locator));
  },
  error: function(error) {
    console.error("[xmldom error]	" + error, _locator(this.locator));
  },
  fatalError: function(error) {
    throw new ParseError(error, this.locator);
  }
};
function _locator(l) {
  if (l) {
    return "\n@" + (l.systemId || "") + "#[line:" + l.lineNumber + ",col:" + l.columnNumber + "]";
  }
}
function _toString(chars, start, length) {
  if (typeof chars == "string") {
    return chars.substr(start, length);
  } else {
    if (chars.length >= start + length || start) {
      return new java.lang.String(chars, start, length) + "";
    }
    return chars;
  }
}
"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(key) {
  DOMHandler.prototype[key] = function() {
    return null;
  };
});
function appendElement(hander, node) {
  if (!hander.currentElement) {
    hander.doc.appendChild(node);
  } else {
    hander.currentElement.appendChild(node);
  }
}
domParser.__DOMHandler = DOMHandler;
domParser.normalizeLineEndings = normalizeLineEndings;
domParser.DOMParser = DOMParser$1;
var DOMParser = domParser.DOMParser;
const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DOMParser
}, Symbol.toStringTag, { value: "Module" }));
export {
  index as i
};
