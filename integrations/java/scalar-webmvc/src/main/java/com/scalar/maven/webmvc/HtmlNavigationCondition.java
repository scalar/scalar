package com.scalar.maven.webmvc;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.mvc.condition.RequestCondition;

/** Matches explicit HTML navigation so wildcard asset requests reach resource handlers. */
final class HtmlNavigationCondition implements RequestCondition<HtmlNavigationCondition> {

    @Override
    public HtmlNavigationCondition combine(HtmlNavigationCondition other) {
        return this;
    }

    @Override
    public HtmlNavigationCondition getMatchingCondition(HttpServletRequest request) {
        boolean acceptsHtml = MediaType.parseMediaTypes(java.util.Collections.list(request.getHeaders("Accept"))).stream()
                .anyMatch(type -> "text".equalsIgnoreCase(type.getType())
                        && "html".equalsIgnoreCase(type.getSubtype()) && type.getQualityValue() > 0);
        return acceptsHtml ? this : null;
    }

    @Override
    public int compareTo(HtmlNavigationCondition other, HttpServletRequest request) {
        return 0;
    }
}
