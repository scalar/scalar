package com.scalar.maven.core.internal;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/**
 * Serializes the Scalar configuration to JSON using whichever Jackson Databind
 * implementation is present on the runtime classpath.
 *
 * <p>
 * Scalar only depends on {@code jackson-annotations} at build time, which is the
 * same artifact and Java package ({@code com.fasterxml.jackson.annotation}) for
 * both Jackson 2.x and Jackson 3.x. The serialization engine itself is resolved
 * at runtime by reflection, so a single artifact works against either major
 * version:
 * </p>
 * <ul>
 *   <li>Jackson 3.x: {@code tools.jackson.databind.json.JsonMapper}</li>
 *   <li>Jackson 2.x: {@code com.fasterxml.jackson.databind.ObjectMapper}</li>
 * </ul>
 *
 * <p>
 * A fresh mapper with default settings is used rather than the host
 * application's configured mapper, so the rendered configuration is never
 * affected by global Jackson customization such as a property naming strategy.
 * </p>
 *
 * <p>
 * <strong>Warning:</strong> This class is internal API and should not be used
 * directly. It may change without notice in future versions.
 * </p>
 */
public final class JacksonJsonSerializer {

    /**
     * The resolved mapper instance together with its
     * {@code writeValueAsString(Object)} method, cached after the first lookup.
     */
    private static final class Engine {
        private final Object mapper;
        private final Method writeValueAsString;

        private Engine(Object mapper, Method writeValueAsString) {
            this.mapper = mapper;
            this.writeValueAsString = writeValueAsString;
        }
    }

    private static volatile Engine engine;

    private JacksonJsonSerializer() {
        // Utility class - prevent instantiation
    }

    /**
     * Serializes the given value to a JSON string.
     *
     * @param value the value to serialize
     * @return the JSON representation of the value
     * @throws IllegalStateException if no Jackson Databind implementation is present on the classpath
     * @throws RuntimeException      if serialization fails
     */
    public static String serialize(Object value) {
        Engine resolved = resolveEngine();
        try {
            return (String) resolved.writeValueAsString.invoke(resolved.mapper, value);
        } catch (InvocationTargetException e) {
            // Unwrap the underlying Jackson failure (checked in v2, unchecked in v3).
            throw new RuntimeException("Failed to serialize Scalar configuration", e.getCause());
        } catch (IllegalAccessException e) {
            throw new RuntimeException("Failed to serialize Scalar configuration", e);
        }
    }

    private static Engine resolveEngine() {
        Engine local = engine;
        if (local == null) {
            synchronized (JacksonJsonSerializer.class) {
                local = engine;
                if (local == null) {
                    local = createEngine();
                    engine = local;
                }
            }
        }
        return local;
    }

    private static Engine createEngine() {
        // Prefer Jackson 3.x when present, falling back to Jackson 2.x. Either
        // produces the same output for the annotation-driven configuration model.
        Engine jackson3 = tryCreate("tools.jackson.databind.json.JsonMapper", true);
        if (jackson3 != null) {
            return jackson3;
        }
        Engine jackson2 = tryCreate("com.fasterxml.jackson.databind.ObjectMapper", false);
        if (jackson2 != null) {
            return jackson2;
        }
        throw new IllegalStateException(
                "No Jackson Databind found on the classpath. Add either "
                        + "com.fasterxml.jackson.core:jackson-databind (Jackson 2.x) or "
                        + "tools.jackson.core:jackson-databind (Jackson 3.x) to your dependencies.");
    }

    private static Engine tryCreate(String mapperClassName, boolean useBuilder) {
        final Class<?> mapperClass;
        try {
            mapperClass = Class.forName(mapperClassName);
        } catch (ClassNotFoundException e) {
            return null;
        }
        try {
            Object mapper = useBuilder
                    ? buildWithBuilder(mapperClass)
                    : mapperClass.getDeclaredConstructor().newInstance();
            Method writeValueAsString = mapper.getClass().getMethod("writeValueAsString", Object.class);
            return new Engine(mapper, writeValueAsString);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Failed to initialize Jackson mapper: " + mapperClassName, e);
        }
    }

    /**
     * Builds a mapper through its {@code builder().build()} chain. Jackson 3
     * mappers are immutable and are constructed via a builder rather than a
     * public no-argument constructor.
     */
    private static Object buildWithBuilder(Class<?> mapperClass) throws ReflectiveOperationException {
        Object builder = mapperClass.getMethod("builder").invoke(null);
        return builder.getClass().getMethod("build").invoke(builder);
    }
}
