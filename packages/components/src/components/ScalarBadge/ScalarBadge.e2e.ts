import { takeSnapshot, test } from '@test/helpers'

test.describe('ScalarBadge', () => ['Base', 'Colored', 'Variants'].forEach((story) => test(story, takeSnapshot)))
