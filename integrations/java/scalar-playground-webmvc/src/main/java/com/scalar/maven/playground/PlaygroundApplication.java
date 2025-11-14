package com.scalar.maven.playground;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Example Spring Boot application demonstrating Scalar API Reference integration.
 *
 * <p>
 * Run this application with:
 * </p>
 * <pre>
 * mvn spring-boot:run
 * </pre>
 *
 * <p>
 * Then visit {@code http://localhost:8080/scalar} to see the API Reference.
 * </p>
 */
@SpringBootApplication
public class PlaygroundApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlaygroundApplication.class, args);
    }
}

