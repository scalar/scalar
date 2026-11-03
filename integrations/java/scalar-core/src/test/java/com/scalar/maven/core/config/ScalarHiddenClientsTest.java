package com.scalar.maven.core.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ScalarHiddenClientsTest {

    @Test
    void preservesExplicitEmptyClientLists() throws Exception {
        ScalarHiddenClients options = new ScalarHiddenClients();
        options.setClients(List.of());
        assertThat(new ObjectMapper().writeValueAsString(options)).isEqualTo("[]");
    }

    @Test
    void rejectsConflictingFormsAndNestedTargetMaps() {
        ScalarHiddenClients options = new ScalarHiddenClients();
        options.setAll(true);
        assertThatThrownBy(() -> options.setClients(List.of("fetch"))).isInstanceOf(IllegalArgumentException.class);
        options.setAll(null);
        options.setClients(null);
        ScalarHiddenClients target = new ScalarHiddenClients();
        target.setTargets(Map.of());
        assertThatThrownBy(() -> options.setTargets(Map.of("node", target))).isInstanceOf(IllegalArgumentException.class);
    }
}
