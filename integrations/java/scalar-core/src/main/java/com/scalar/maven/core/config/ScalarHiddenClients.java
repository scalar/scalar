package com.scalar.maven.core.config;

import com.fasterxml.jackson.annotation.JsonValue;

import java.util.List;
import java.util.Map;

/**
 * Code sample client visibility. Set exactly one of all, clients, or targets.
 * Target entries can hide all clients for that target or a list of client names.
 */
public class ScalarHiddenClients {

    private Boolean all;
    private List<String> clients;
    private Map<String, ScalarHiddenClients> targets;

    /** @return whether every client is hidden, or null */
    public Boolean getAll() {
        return all;
    }

    /** @param all true to hide every client, false to hide none */
    public void setAll(Boolean all) {
        validate(all, this.clients, this.targets);
        this.all = all;
    }

    /** @return the hidden client identifiers, or null */
    public List<String> getClients() {
        return clients;
    }

    /** @param clients hidden target names, client names, or full client identifiers */
    public void setClients(List<String> clients) {
        validate(this.all, clients, this.targets);
        this.clients = clients;
    }

    /** @return visibility settings keyed by target, or null */
    public Map<String, ScalarHiddenClients> getTargets() {
        return targets;
    }

    /** @param targets target-specific settings using all or clients */
    public void setTargets(Map<String, ScalarHiddenClients> targets) {
        validate(this.all, this.clients, targets);
        this.targets = targets;
    }

    /**
     * Converts the Spring-friendly options to the frontend union.
     *
     * @return true, a list of clients, or a target map
     * @throws IllegalArgumentException if multiple forms or nested target maps are configured
     */
    @JsonValue
    public Object toJson() {
        validate(all, clients, targets);
        if (targets != null) {
            return targets;
        }
        if (clients != null) {
            return clients;
        }
        // The frontend accepts true to hide all, but uses [] to show all.
        return Boolean.TRUE.equals(all) ? true : List.of();
    }

    private static void validate(Boolean all, List<String> clients, Map<String, ScalarHiddenClients> targets) {
        int forms = (all == null ? 0 : 1) + (clients == null ? 0 : 1) + (targets == null ? 0 : 1);
        if (forms > 1) {
            throw new IllegalArgumentException("Set only one of hiddenClients.all, clients, or targets");
        }
        if (targets != null) {
            for (ScalarHiddenClients target : targets.values()) {
                if (target == null || target.getTargets() != null) {
                    throw new IllegalArgumentException("Hidden client targets must use all or clients");
                }
            }
        }
    }
}
