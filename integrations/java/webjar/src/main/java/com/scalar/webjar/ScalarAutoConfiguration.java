package com.scalar.webjar;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(ScalarProperties.class)
@ConditionalOnProperty(prefix = "scalar", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ScalarAutoConfiguration {

    @Bean
    public ScalarController scalarController(ScalarProperties properties) {
        return new ScalarController(properties);
    }
} 
