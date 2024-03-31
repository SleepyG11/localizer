const { default: Localizer } = require('../dist');

describe('Localizer class', () => {
	describe('Constructor', () => {
		it.each([undefined, null])('When empty argument passed, data should be not null', (opt) => {
			let localizer = new Localizer(opt);
			expect(localizer.localization).toBeInstanceOf(Object);
			expect(localizer.pluralRules).toBeInstanceOf(Object);
			expect(localizer.fallbacks).toBeInstanceOf(Object);
			expect(localizer.cacheLocalization).toBe(true);
			expect(localizer.cacheFallbacks).toBe(true);
			expect(localizer.cachePluralRules).toBe(true);
			expect(localizer.cachePrintf).toBe(true);
			expect(localizer.intl).toBe(false);
			expect(localizer.safe).toBe(false);
		});
		it.each([1, 'true', []])('When invalid argument passed, data should be not null', (opt) => {
			let localizer = new Localizer(opt);
			expect(localizer.localization).toBeInstanceOf(Object);
			expect(localizer.pluralRules).toBeInstanceOf(Object);
			expect(localizer.fallbacks).toBeInstanceOf(Object);
			expect(localizer.cacheLocalization).toBe(true);
			expect(localizer.cacheFallbacks).toBe(true);
			expect(localizer.cachePluralRules).toBe(true);
			expect(localizer.cachePrintf).toBe(true);
			expect(localizer.intl).toBe(false);
			expect(localizer.safe).toBe(false);
		});
		it.each([undefined, null])('When object with empty values passed, data should be not null', (opt) => {
			let localizer = new Localizer({ fallbacks: opt, localization: opt, pluralRules: opt });
			expect(localizer.localization).toBeInstanceOf(Object);
			expect(localizer.pluralRules).toBeInstanceOf(Object);
			expect(localizer.fallbacks).toBeInstanceOf(Object);
		});
		it.each([1, 'true', []])('When object with invalid values passed, data should be not null', (opt) => {
			let localizer = new Localizer({ fallbacks: opt, localization: opt, pluralRules: opt });
			expect(localizer.localization).toBeInstanceOf(Object);
			expect(localizer.pluralRules).toBeInstanceOf(Object);
			expect(localizer.fallbacks).toBeInstanceOf(Object);
		});
		it.each([1, 'true', []])('When anything except boolean passed to cache, intl or safe, it should be converted to boolean', (opt) => {
			let localizer = new Localizer({ cacheLocalization: opt, cachePluralRules: opt, cacheFallbacks: opt, safe: opt, intl: opt });
			expect(localizer.cacheLocalization).toBe(true);
			expect(localizer.cacheFallbacks).toBe(true);
			expect(localizer.cachePluralRules).toBe(true);
			expect(localizer.cachePrintf).toBe(true);
			expect(localizer.intl).toBe(true);
			expect(localizer.safe).toBe(true);
		});
	});
	describe('Passing invalid input', () => {
		it.each([undefined, null, 1, [], {}])(
			'When invalid first argument passed, l() and ln() should throw an error (safe=false) or return null (safe=true)',
			(arg) => {
				let localizer = new Localizer();
				let safeLocalizer = new Localizer({ safe: true });

				expect(() => localizer.l(arg)).toThrow();
				expect(() => localizer.ln(arg)).toThrow();

				expect(safeLocalizer.l(arg)).toBeNull();
				expect(safeLocalizer.ln(arg)).toBeNull();
			}
		);
		it('When locale passed without key, l() and ln() should throw an error (safe=false) or return null (safe=true)', () => {
			let localizer = new Localizer();
			let safeLocalizer = new Localizer({ safe: true });

			expect(() => localizer.l('en-US')).toThrow();
			expect(() => localizer.l({ locale: 'en-US' })).toThrow();
			expect(() => localizer.ln('en-US')).toThrow();
			expect(() => localizer.ln({ locale: 'en-US' })).toThrow();
			expect(() => safeLocalizer.l({ locale: 'en-US', safe: false })).toThrow();
			expect(() => safeLocalizer.ln({ locale: 'en-US', safe: false })).toThrow();

			expect(safeLocalizer.l('en-US')).toBeNull();
			expect(safeLocalizer.l({ locale: 'en-US' })).toBeNull();
			expect(safeLocalizer.ln('en-US')).toBeNull();
			expect(safeLocalizer.ln({ locale: 'en-US' })).toBeNull();
			expect(localizer.l({ locale: 'en-US', safe: true })).toBeNull();
			expect(localizer.ln({ locale: 'en-US', safe: true })).toBeNull();
		});
	});
	describe('Getting key', () => {
		it("When key doesn't exist, null or undefined, l() and ln() should return key", () => {
			let localizer = new Localizer({
				localization: {
					'en-US': {
						key1: null,
						key2: undefined,
					},
				},
			});

			expect(localizer.l('en-US', 'no.key')).toBe('no.key');
			expect(localizer.ln('en-US', 'no.key')).toBe('no.key');

			expect(localizer.l('en-US', 'key1')).toBe('key1');
			expect(localizer.ln('en-US', 'key1')).toBe('key1');
			expect(localizer.l({ raw: undefined, fallback: 'key1' })).toBe('key1');
			expect(localizer.ln({ raw: undefined, fallback: 'no.key' })).toBe('no.key');

			expect(localizer.l('en-US', 'key2')).toBe('key2');
			expect(localizer.ln('en-US', 'key2')).toBe('key2');
			expect(localizer.l({ raw: null, fallback: 'key2' })).toBe('key2');
			expect(localizer.ln({ raw: null, fallback: 'key2' })).toBe('key2');
		});
		it('When value is not object or string, l() and ln() should return value as string', () => {
			let localizer = new Localizer({
				localization: {
					'en-US': {
						1: 1,
						2: false,
					},
				},
			});

			expect(localizer.l('en-US', '1')).toBe('1');
			expect(localizer.ln('en-US', '1')).toBe('1');
			expect(localizer.l({ raw: 1, fallback: 'key1' })).toBe('1');
			expect(localizer.ln({ locale: 'en-US', raw: 1, fallback: 'no.key' })).toBe('1');

			expect(localizer.l('en-US', '2')).toBe('false');
			expect(localizer.ln('en-US', '2')).toBe('false');
			expect(localizer.l({ raw: false, fallback: 'key1' })).toBe('false');
			expect(localizer.ln({ raw: false, fallback: 'no.key' })).toBe('false');
		});
		it('When value is string, l() and ln() should return value', () => {
			let localizer = new Localizer({
				localization: {
					'en-US': {
						key: 'Value',
					},
				},
			});

			expect(localizer.l('en-US', 'key')).toBe('Value');
			expect(localizer.ln('en-US', 'key')).toBe('Value');
			expect(localizer.l({ raw: 'Value', fallback: 'key' })).toBe('Value');
			expect(localizer.ln({ raw: 'Value', fallback: 'key' })).toBe('Value');
		});
		it('When value is object, l() and ln() should return "other" form', () => {
			let first = {
				other: 'First Other',
			};
			let localizer = new Localizer({
				localization: {
					'en-US': {
						first,
					},
				},
			});

			expect(localizer.l('en-US', 'first')).toBe('First Other');
			expect(localizer.ln('en-US', 'first')).toBe('First Other');
			expect(localizer.l({ raw: first, fallback: 'no.key' })).toBe('First Other');
			expect(localizer.ln({ raw: first, fallback: 'no.key' })).toBe('First Other');
		});
	});
	describe('Getting key with count', () => {
		it('When intervals present, it should be applied firstly according to ISO 31-11 + inverting with "!"', () => {
			let localizer = new Localizer({
				localization: {
					'en-US': {
						key: {
							zero: 'Zero',
							one: 'One',
							other: 'Other',
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
	describe('Insertion', () => {
		it('When pattern present without arguments, l() should return pattern', () => {
			let localizer = new Localizer({
				localization: {
					'en-US': {
						order: '%s',
						key: '%(value)s',
					},
				},
			});

			expect(localizer.l('en-US', 'order')).toBe('%s');
			expect(localizer.l({ locale: 'en-US', key: 'order' })).toBe('%s');

			expect(localizer.l('en-US', 'key')).toBe('%(value)s');
			expect(localizer.l({ locale: 'en-US', key: 'key' })).toBe('%(value)s');
		});
		it('When pattern present, ln() should use count as first argument', () => {
			let localizer = new Localizer({
				localization: {
					'en-US': {
						order: '%s',
						key: '%(value)s',
					},
				},
			});

			expect(localizer.ln('en-US', 'order')).toBe('1');
			expect(localizer.ln('en-US', 'order', 10)).toBe('10');
			expect(localizer.ln({ locale: 'en-US', key: 'order' })).toBe('1');
			expect(localizer.ln({ locale: 'en-US', key: 'order', count: 10 })).toBe('10');

			expect(localizer.ln('en-US', 'key')).toBe('%(value)s');
			expect(localizer.ln('en-US', 'key', 10)).toBe('%(value)s');
			expect(localizer.ln({ locale: 'en-US', key: 'key' })).toBe('%(value)s');
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 10 })).toBe('%(value)s');
		});
		it('When pattern with key present, l() and ln() should use value from last object', () => {
			let localizer = new Localizer({
				localization: {
					'en-US': {
						key: '%(value)s',
						noKey: '%(noValue)s',
						undefKey: '%(undefValue)s',
						nullKey: '%(nullValue)s',
					},
				},
			});

			let namedValues = {
				value: 'Value',
				undefValue: undefined,
				nullValue: null,
			};

			// ------------------------

			expect(localizer.l('en-US', 'key', namedValues)).toBe('Value');
			expect(localizer.l({ locale: 'en-US', key: 'key' }, namedValues)).toBe('Value');
			expect(localizer.l({ locale: 'en-US', key: 'key' }, 1, { value: 24 }, 2, namedValues)).toBe('Value');
			expect(localizer.l({ locale: 'en-US', key: 'key' }, 1, namedValues, 2)).toBe('%(value)s');

			expect(localizer.l('en-US', 'noKey', namedValues)).toBe('%(noValue)s');
			expect(localizer.l({ locale: 'en-US', key: 'noKey' }, namedValues)).toBe('%(noValue)s');

			expect(localizer.l('en-US', 'undefKey', namedValues)).toBe('undefined');
			expect(localizer.l({ locale: 'en-US', key: 'undefKey' }, namedValues)).toBe('undefined');

			expect(localizer.l('en-US', 'nullKey', namedValues)).toBe('null');
			expect(localizer.l({ locale: 'en-US', key: 'nullKey' }, namedValues)).toBe('null');

			// ------------------------

			expect(localizer.ln('en-US', 'key', 1, namedValues)).toBe('Value');
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 1 }, namedValues)).toBe('Value');
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 1 }, 1, { value: 24 }, 2, namedValues)).toBe('Value');
			expect(localizer.ln({ locale: 'en-US', key: 'key', count: 1 }, 1, namedValues, 2)).toBe('%(value)s');

			expect(localizer.ln('en-US', 'noKey', 1, namedValues)).toBe('%(noValue)s');
			expect(localizer.ln({ locale: 'en-US', key: 'noKey', count: 1 }, namedValues)).toBe('%(noValue)s');

			expect(localizer.ln('en-US', 'undefKey', 1, namedValues)).toBe('undefined');
			expect(localizer.ln({ locale: 'en-US', key: 'undefKey', count: 1 }, namedValues)).toBe('undefined');

			expect(localizer.ln('en-US', 'nullKey', 1, namedValues)).toBe('null');
			expect(localizer.ln({ locale: 'en-US', key: 'nullKey', count: 1 }, namedValues)).toBe('null');
		});
	});
});
