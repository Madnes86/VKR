import { expect, test } from 'vitest';
import { objectValidation } from './other';

test('валидация строки', () => {
	expect(objectValidation('  123 Привет!  ')).toBe('Привет');
	expect(objectValidation('много   пробелов')).toBe('много пробелов');
});
