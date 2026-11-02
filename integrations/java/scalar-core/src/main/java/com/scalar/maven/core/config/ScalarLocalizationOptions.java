package com.scalar.maven.core.config;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/**
 * UI localization options shared by the Java integrations.
 * Unset values use the frontend defaults.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarLocalizationOptions {

    private String locale;
    private String direction;
    private Map<String, Object> translations;

    /**
     * Gets the locale used for built-in UI translations.
     *
     * @return the locale, or null to use English
     */
    public String getLocale() {
        return locale;
    }

    /**
     * Sets the locale used for built-in UI translations.
     *
     * @param locale a locale identifier such as en or zh-CN
     */
    public void setLocale(String locale) {
        this.locale = locale;
    }

    /**
     * Gets the text direction preference.
     *
     * @return auto, ltr, rtl, or null to use the frontend default
     */
    public String getDirection() {
        return direction;
    }

    /**
     * Sets the text direction preference.
     *
     * @param direction auto to derive direction from the locale, ltr, or rtl
     */
    public void setDirection(String direction) {
        this.direction = direction;
    }

    /**
     * Gets custom UI translations.
     *
     * @return the nested translation map, or null
     */
    public Map<String, Object> getTranslations() {
        return translations;
    }

    /**
     * Sets custom UI translations merged with built-in translations and English fallback.
     *
     * @param translations nested translation keys with string values, such as search.label
     */
    public void setTranslations(Map<String, Object> translations) {
        this.translations = translations;
    }
}
