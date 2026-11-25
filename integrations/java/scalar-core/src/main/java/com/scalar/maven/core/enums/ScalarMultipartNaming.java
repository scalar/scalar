package com.scalar.maven.core.enums;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Naming convention for named multipart request fields. */
public enum ScalarMultipartNaming {
    /** Use dots for object fields and brackets for array indices, such as items[0].file. */
    @JsonProperty("indexed-dot")
    INDEXED_DOT
}
