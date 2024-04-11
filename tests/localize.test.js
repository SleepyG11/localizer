const { default: Localizer } = require('../dist');

// TODO: test for options: { locale, key }

describe('`localize()` method', () => {
	describe('Passing invalid input', () => {
		let localizer = new Localizer();
		let safeLocalizer = new Localizer({ safe: true });

		it.each([undefined, null, 1, [], {}])(
			'When invalid first argument passed, it should throw an error (safe=false) or return null (safe=true)',
			(arg) => {
				expect(() => localizer.localize(arg)).toThrow();

				expect(safeLocalizer.localize(arg)).toBeNull();
			}
		);
		it('When locale passed without key, it should throw an error (safe=false) or return null (safe=true)', () => {
			expect(() => localizer.localize('en-US')).toThrow();
			expect(() => localizer.localize({ locale: 'en-US' })).toThrow();

			expect(safeLocalizer.localize('en-US')).toBeNull();
			expect(safeLocalizer.localize({ locale: 'en-US' })).toBeNull();
		});
		it('When raw as object passed without fallback, it should throw an error (safe=false) or return null (safe=true)', () => {
			expect(() => localizer.localize({ raw: { other: 'Object Other' } })).toThrow();

			expect(safeLocalizer.localize({ raw: { other: 'Object Other' } })).toBeNull();
		});
	});
	describe('Resolving data', () => {
		let localizer = new Localizer({
			intl: false,
			localization: {
				'en-US': {
					nullKey: null,
					undefinedKey: undefined,
					numberKey: 1,
					booleanKey: false,
					stringKey: 'Red Apple',
					objectKey: {
						'[1]': 'Object Exactly One',
						one: 'Object One',
						other: 'Object Other',
					},
				},
			},
		});
		it("When key doesn't exist, null or undefined, it should return key", () => {
			expect(localizer.localize('en-US', 'no.key')).toBe('no.key');

			expect(localizer.localize('en-US', 'nullKey')).toBe('nullKey');
			expect(localizer.localize('en-US', 'undefinedKey')).toBe('undefinedKey');

			expect(localizer.localize({ raw: null, fallback: 'nullKey' })).toBe('nullKey');
			expect(localizer.localize({ raw: undefined, fallback: 'undefinedKey' })).toBe('undefinedKey');
		});
		it('When value is string, it should return value', () => {
			expect(localizer.localize('en-US', 'stringKey')).toBe('Red Apple');
			expect(localizer.localize({ raw: 'Red Apple', fallback: 'stringKey' })).toBe('Red Apple');
		});
		it('When value is object, it should return "other" form', () => {
			expect(localizer.localize('en-US', 'objectKey')).toBe('Object Other');
			expect(
				localizer.localize({
					raw: { '[1]': 'Object Exactly One', one: 'Object One', other: 'Object Other' },
					fallback: 'objectKey',
				})
			).toBe('Object Other');
		});
		it('When value is not object or string, it should return value as string', () => {
			expect(localizer.localize('en-US', 'numberKey')).toBe('1');
			expect(localizer.localize('en-US', 'booleanKey')).toBe('false');

			expect(localizer.localize({ raw: 1, fallback: 'numberKey' })).toBe('1');
			expect(localizer.localize({ raw: false, fallback: 'booleanKey' })).toBe('false');
		});
	});
});
