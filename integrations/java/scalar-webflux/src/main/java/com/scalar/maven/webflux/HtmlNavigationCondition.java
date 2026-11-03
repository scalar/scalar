package com.scalar.maven.webflux;

import org.springframework.http.MediaType;
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
        boolean acceptsHtml = request.getRequest().getHeaders().getAccept().stream()
                .anyMatch(type -> "text".equalsIgnoreCase(type.getType())
                        && "html".equalsIgnoreCase(type.getSubtype()) && type.getQualityValue() > 0);
        return acceptsHtml ? this : null;
    }

    @Override
    public int compareTo(HtmlNavigationCondition other, ServerWebExchange request) {
        return 0;
    }
}
