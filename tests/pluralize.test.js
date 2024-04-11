const { default: Localizer } = require('../dist');

// TODO: test for options: { locale, key }

describe('`pluralize()` method', () => {
	describe('Passing invalid input', () => {
		let localizer = new Localizer();
		let safeLocalizer = new Localizer({ safe: true });

		it.each([undefined, null, 1, [], {}])(
			'When invalid first argument passed, it should throw an error (safe=false) or return null (safe=true)',
			(arg) => {
				expect(() => localizer.pluralize(arg)).toThrow();
				expect(safeLocalizer.pluralize(arg)).toBeNull();
			}
		);
		it('When locale passed without key, it should throw an error (safe=false) or return null (safe=true)', () => {
			expect(() => localizer.pluralize('en-US')).toThrow();
			expect(() => localizer.pluralize({ locale: 'en-US' })).toThrow();

			expect(safeLocalizer.pluralize('en-US')).toBeNull();
			expect(safeLocalizer.pluralize({ locale: 'en-US' })).toBeNull();
		});
		it('When raw as object passed without fallback, it should throw an error (safe=false) or return null (safe=true)', () => {
			expect(() => localizer.pluralize({ raw: { other: 'Object Other' } })).toThrow();

			expect(safeLocalizer.pluralize({ raw: { other: 'Object Other' } })).toBeNull();
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
				},
			},
		});
		it("When key doesn't exist, null or undefined, it should return key", () => {
			expect(localizer.pluralize('en-US', 'no.key')).toBe('no.key');

			expect(localizer.pluralize('en-US', 'nullKey')).toBe('nullKey');
			expect(localizer.pluralize('en-US', 'undefinedKey')).toBe('undefinedKey');

			expect(localizer.pluralize({ raw: null, fallback: 'nullKey' })).toBe('nullKey');
			expect(localizer.pluralize({ raw: undefined, fallback: 'undefinedKey' })).toBe('undefinedKey');
		});
		it('When value is string, it should return value', () => {
			expect(localizer.pluralize('en-US', 'stringKey')).toBe('Red Apple');
			expect(localizer.pluralize({ raw: 'Red Apple', fallback: 'stringKey' })).toBe('Red Apple');
		});
		it('When value is not object or string, it should return value as string', () => {
			expect(localizer.pluralize('en-US', 'numberKey')).toBe('1');
			expect(localizer.pluralize('en-US', 'booleanKey')).toBe('false');

			expect(localizer.pluralize({ raw: 1, fallback: 'numberKey' })).toBe('1');
			expect(localizer.pluralize({ raw: false, fallback: 'booleanKey' })).toBe('false');
		});
	});
	describe('Pluralizing data', () => {
		it('When intervals present, it should be resolved according to ISO 31-11 + inverting with "!"', () => {
			let localizer = new Localizer({
				localization: {
					'en-US': {
						key: {
							'[0]': 'Exact zero',
							'[1]': 'Exact one',
							'![2]': 'Not two',
							'![3]': 'Not three',
						},
					},
				},
			});

			expect(localizer.ln('en-US', 'key', 0)).toBe('Exact zero');
			expect(localizer.ln('en-US', 'key', 1)).toBe('Exact one');
			expect(localizer.ln('en-US', 'key', 2)).toBe('Not three');
			expect(localizer.ln('en-US', 'key', 3)).toBe('Not two');

			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 0, ordinal: true })).toBe('Exact zero');
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 1, ordinal: true })).toBe('Exact one');
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 2, ordinal: true })).toBe('Not three');
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 3, ordinal: true })).toBe('Not two');
		});
		it('When plural function not defined, it should return "other" form', () => {
			let localizer = new Localizer({
				localization: {
					'en-US': {
						key: {
							zero: 'Zero',
							one: 'One',
							two: 'Two',
							few: 'Few',
							other: 'Other',
						},
					},
				},
			});
			expect(localizer.ln('en-US', 'key', 0)).toBe('Other');
			expect(localizer.ln('en-US', 'key', 1)).toBe('Other');
			expect(localizer.ln('en-US', 'key', 2)).toBe('Other');

			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 0, ordinal: true })).toBe('Other');
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 1, ordinal: true })).toBe('Other');
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 2, ordinal: true })).toBe('Other');
		});
		it('When plural function defined, it should return form according to this function', () => {
			let localizer = new Localizer({
				pluralRules: {
					'en-US': (count, ordinal) => {
						if (!ordinal) {
							switch (count) {
								case 0:
									return 'zero';
								case 1:
									return 'one';
								case 2:
									return 'two';
								default:
									return 'other';
							}
						} else {
							switch (count) {
								case 0:
									return 'zero';
								case 1:
									return 'one';
								case 2:
									return 'few';
								default:
									return 'other';
							}
						}
					},
				},
				localization: {
					'en-US': {
						key: {
							zero: 'Zero',
							one: 'One',
							two: 'Two',
							few: 'Few',
							other: 'Other',
						},
					},
				},
			});
			expect(localizer.ln('en-US', 'key', 0)).toBe('Zero');
			expect(localizer.ln('en-US', 'key', 1)).toBe('One');
			expect(localizer.ln('en-US', 'key', 2)).toBe('Two');
			expect(localizer.ln('en-US', 'key', 3)).toBe('Other');

			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 0, ordinal: true })).toBe('Zero');
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 1, ordinal: true })).toBe('One');
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 2, ordinal: true })).toBe('Few');
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 3, ordinal: true })).toBe('Other');
		});
		it('When intl=true, it should return form according to Intl.PluralRules', () => {
			let localizer = new Localizer({
				intl: true,
				localization: {
					'en-US': {
						key: {
							zero: 'Zero',
							one: 'One',
							two: 'Two',
							few: 'Few',
							other: 'Other',
						},
					},
				},
			});
			let cardinalRules = new Intl.PluralRules('en-US', { type: 'cardinal' });
			let ordinalRules = new Intl.PluralRules('en-US', { type: 'ordinal' });

			expect(localizer.ln('en-US', 'key', 0)).toBe(localizer.l('en-US', `key.${cardinalRules.select(0)}`));
			expect(localizer.ln('en-US', 'key', 1)).toBe(localizer.l('en-US', `key.${cardinalRules.select(1)}`));
			expect(localizer.ln('en-US', 'key', 2)).toBe(localizer.l('en-US', `key.${cardinalRules.select(2)}`));
			expect(localizer.ln('en-US', 'key', 3)).toBe(localizer.l('en-US', `key.${cardinalRules.select(3)}`));

			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 0, ordinal: true })).toBe(
				localizer.l('en-US', `key.${ordinalRules.select(0)}`)
			);
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 1, ordinal: true })).toBe(
				localizer.l('en-US', `key.${ordinalRules.select(1)}`)
			);
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 2, ordinal: true })).toBe(
				localizer.l('en-US', `key.${ordinalRules.select(2)}`)
			);
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 3, ordinal: true })).toBe(
				localizer.l('en-US', `key.${ordinalRules.select(3)}`)
			);
		});
	});
});
