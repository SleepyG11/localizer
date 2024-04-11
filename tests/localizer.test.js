const { default: Localizer, LocalizerScope } = require('../dist');

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
	describe('Scope', () => {
		it('`scope()` method should create LocalizerScope()', () => {
			const scope = new Localizer().scope('ru-RU');

			expect(scope).toBeInstanceOf(LocalizerScope);
			expect(scope.locale).toBe('ru-RU');
		});
	});
});
