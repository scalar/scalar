/**
 * This file is the entry point for the CDN version of the API Reference.
 *
 * It’s responsible for finding the spec and configuration in the HTML, and mounting the Vue app.
 */
import { getConfigurationFromDataAttributes, mountScalarApiReference } from '@/standalone/lib/html-api'

mountScalarApiReference(document, getConfigurationFromDataAttributes(document))
