package com.scalar.maven.core;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class ScalarSelectedClientPersistenceTest {

    @Test
    void enablesSelectedClientPersistenceByDefault() throws Exception {
        ScalarProperties properties = new ScalarProperties();

        assertThat(properties.isPersistSelectedClient()).isTrue();
        assertThat(ScalarHtmlRenderer.render(properties)).contains("\"persistSelectedClient\":true");
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void serializesSelectedClientPersistenceIndependentlyOfAuth(boolean persistSelectedClient) throws Exception {
        ScalarProperties properties = new ScalarProperties();
        properties.setPersistSelectedClient(persistSelectedClient);
        properties.setPersistAuth(true);

        String html = ScalarHtmlRenderer.render(properties);

        assertThat(html).contains("\"persistSelectedClient\":" + persistSelectedClient);
        assertThat(html).contains("\"persistAuth\":true");
    }
}
