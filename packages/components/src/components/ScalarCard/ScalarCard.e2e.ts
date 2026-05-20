import { takeSnapshot, test } from '@test/helpers'

test.describe('ScalarCard', () => ['Base', 'With Actions', 'Minimal'].forEach((story) => test(story, takeSnapshot)))
