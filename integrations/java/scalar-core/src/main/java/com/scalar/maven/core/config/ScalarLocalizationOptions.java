package com.scalar.maven.core.config;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/**
 * Localization configuration options.
 * Controls the language and text direction of the API Reference UI.
 *
 * @see <a href="https://github.com/scalar/scalar/blob/main/documentation/localization.md">Localization</a>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarLocalizationOptions {

    /**
     * Locale used for the built-in UI translations, for example "de" or
     * "zh-CN". Unknown locales fall back to English.
     */
    private String locale;

    /**
     * Text direction: "ltr", "rtl" or "auto". With "auto" (or when omitted)
     * the direction is derived from the locale.
     */
    private String direction;

    /**
     * Custom UI translations, merged with the selected locale and the English
     * fallback.
     */
    private Map<String, Object> translations;

    /**
     * Creates empty localization options.
     */
    public ScalarLocalizationOptions() {
    }

    /**
     * Gets the locale used for the built-in UI translations.
     *
     * @return the locale or null
     */
    public String getLocale() {
        return locale;
    }

    /**
     * Sets the locale used for the built-in UI translations.
     *
     * @param locale the locale
     */
    public void setLocale(String locale) {
        this.locale = locale;
    }

    /**
     * Gets the text direction.
     *
     * @return the direction or null
     */
    public String getDirection() {
        return direction;
    }

    /**
     * Sets the text direction.
     *
     * @param direction "ltr", "rtl" or "auto"
     */
    public void setDirection(String direction) {
        this.direction = direction;
    }

    /**
     * Gets the custom UI translations.
     *
     * @return the translations or null
     */
    public Map<String, Object> getTranslations() {
        return translations;
    }

    /**
     * Sets the custom UI translations.
     *
     * @param translations the translations, keyed like the frontend translation object
     */
    public void setTranslations(Map<String, Object> translations) {
        this.translations = translations;
    }
}
