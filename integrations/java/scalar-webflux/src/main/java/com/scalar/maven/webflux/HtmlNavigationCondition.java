package com.scalar.maven.webflux;

import org.springframework.http.InvalidMediaTypeException;
import org.springframework.web.reactive.result.condition.RequestCondition;
import org.springframework.web.server.ServerWebExchange;

/** Matches explicit HTML navigation so wildcard asset requests reach resource handlers. */
final class HtmlNavigationCondition implements RequestCondition<HtmlNavigationCondition> {

    @Override
    public HtmlNavigationCondition combine(HtmlNavigationCondition other) {
        return this;
    }

    @Override
    public HtmlNavigationCondition getMatchingCondition(ServerWebExchange request) {
        try {
            boolean acceptsHtml = request.getRequest().getHeaders().getAccept().stream()
                    .anyMatch(type -> "text".equalsIgnoreCase(type.getType())
                            && "html".equalsIgnoreCase(type.getSubtype()) && type.getQualityValue() > 0);
            return acceptsHtml ? this : null;
        } catch (InvalidMediaTypeException exception) {
            // Let Spring's normal handlers report invalid content negotiation.
            return null;
        }
    }

    @Override
    public int compareTo(HtmlNavigationCondition other, ServerWebExchange request) {
        return 0;
    }
}
