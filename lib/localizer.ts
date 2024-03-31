import parseInterval from 'math-interval-parser';
import { PrintfFunction, createPrintf } from './printf';
import { get, isNil, isObjectLike, invert } from './no-lodash';

// ------------------------

export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
export type PluralRules = (count: number, ordinal?: boolean) => PluralCategory;
type SelectedPluralRules = (count: number) => PluralCategory;

export interface LocalizationPluralData extends Partial<Record<PluralCategory, string>> {}
export interface LocalizationRecursiveData extends Record<string, string | LocalizationData> {}
export type LocalizationData = string | LocalizationPluralData | LocalizationRecursiveData;

/**
 * Table that contains localization data for locales.
 *
 * Data can be:
 * - string;
 * - object, which contains:
 *      - another data;
 *      - math intervals as part of [ISO 31-11](https://en.wikipedia.org/wiki/ISO_31-11) *("!" in start can be used to invert)*;
 *      - plural categories defined in [Unicode CLDR](https://cldr.unicode.org/index/cldr-spec/plural-rules);
 * - other type (will be converted to string).
 *
 * `undefined` or `null` are ignored.
 *
 * @example
 * {
 *      'en-US': {
 *          greetings: {
 *              hello: "Hello!",
 *              forFriends: {
 *                  hai: "Hai!",
 *              },
 *          },
 *          fish: {
 *              "![0,]": "Negative fish?!"
 *              "[0]": "No fish",
 *              "[1]": "One fish",
 *              "(4,5)": "More than four and less than five fishes",
 *              "[,9)": "Less than nine fishes",
 *              "[10,]": "More than ten fishes",
 *              "other": "%s fishes"
 *          },
 *          cat: {
 *              "one": "%s cat",
 *              "[21]": "Twenty one cats",
 *              "other": "%s cats"
 *          }
 *      }
 * }
 *
 */
export type LocalizationTable<T extends string = string> = Partial<Record<T, Record<string, LocalizationData>>>;
/**
 * Table that contains {@link PluralRules} functions for locales.
 *
 * This functions have priority over [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules).
 * @example
 * {
 *      'en-US': (count, ordinal = false) => {
 *          if (ordinal) return count === 2 ? 'two' : count === 1 ? 'one' : 'other';
 *          return count === 1 ? 'one' : 'other';
 *      },
 *      'ru-RU': () => 'other'
 * }
 */
export type PluralRulesTable<T extends string = string> = Partial<Record<T, PluralRules>>;
/**
 * Table that contains fallback patterns for locales.
 *
 * When localization data for locale not found, next that matches pattern in table (in order they present) will be used. Repeats until data will be found, or fallback to default locale if nothing matches.
 *
 * `*` can be used as wildcart in patterns.
 *
 * @example
 * {
 *   'ua': 'ru-RU',
 *   'en-*': 'en-US',
 * }
 */
export type FallbacksTable<T extends string = string> = Record<string, T>;

type BasicOptions = {
	/**
	 * Should use cache for localization data from {@link LocalizationTable}.
	 *
	 * Improves speed for already used keys, but can increase memory usage.
	 * @default true
	 */
	cacheLocalization: boolean;
	/**
	 * Should use cache for plural rules functions from {@link PluralRulesTable} or [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules).
	 *
	 * Improves speed for already used locales, but can increase memory usage.
	 * @default true
	 */
	cachePluralRules: boolean;
	/**
	 * Should use cache for fallback locales from {@link FallbacksTable}.
	 *
	 * Improves speed for already used keys, but can increase memory usage.
	 * @default true
	 */
	cacheFallbacks: boolean;
	/**
	 * Should use cache for patterns insertion.
	 *
	 * Improves speed for values with patterns, but can increase memory usage.
	 * @default true
	 */
	cachePrintf: boolean;

	/**
	 * Use [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules) to convert `count` passed to `localizer.ln()` into plural category, when function in {@link PluralRulesTable} not found.
	 * @default false
	 */
	intl: boolean;
	/**
	 * Should `localize.l()` and `localize.ln()` return `null` instead of throwing an error when invalid arguments passed.
	 * @default false
	 */
	safe: boolean;
};

// ------------------------

type LocalizeBasicOptions = Partial<BasicOptions>;
type LocalizeBasicCountOptions = {
	/**
	 * Number that will be used for resolving math intervals or passed to {@link PluralRules} function.
	 * @default 1
	 */
	count?: number;
	/**
	 * Use `ordinal` plural rules instead of `cardinal`.
	 * @default false
	 */
	ordinal?: boolean;
};
type LocalizeBasicKeyOptions<T extends string = string> = LocalizeBasicOptions & {
	/**
	 * Path to localization data inside of {@link LocalizationTable}.
	 *
	 * `undefined` or `null` are ignored.
	 * @example
	 *  const localizer = new Localizer({
	 *      localization: {
	 *          'en-US': {
	 *              greetings: {
	 *                  hello: "Hello world!",
	 *                  hai: "Hai world!"
	 *              }
	 *          }
	 *      }
	 *  })
	 *
	 * localizer.l('en-US', 'greetings.hello'); // "Hello world!"
	 * localizer.l({ locale: "en-US", key: "greetings.hai" }); // "Hai world!"
	 */
	key: string;
	/**
	 * String that will be returned if localization data is missing.
	 *
	 * @default key value
	 */
	fallback?: string;
	/**
	 * Initial locale for localization data from {@link LocalizationTable} and plural rules.
	 *
	 * @example
	 *  const localizer = new Localizer({
	 *      localization: {
	 *          'en-US': { greeting: "Hello world!" },
	 *          'ru-RU': { greeting: "Привет мир!" }
	 *      }
	 *  })
	 *
	 * localizer.l('en-US', 'greeting'); // "Hello world!"
	 * localizer.l({ locale: "ru-RU", key: "greeting" }); // "Привет мир!"
	 */
	locale?: T;
};
type LocalizeBasicRawOptions<T extends string = string> = LocalizeBasicOptions & {
	/**
	 * Localization data to process. See {@link LocalizationTable} for more info.
	 */
	raw: LocalizationData;
	/**
	 * String that will be returned if localization data invalid. **Required** when raw is object.
	 *
	 * @default key value
	 */
	fallback?: string;
	/**
	 * Initial locale to use for resolving plural rules.
	 */
	locale?: T;
};

export type LocalizeWithoutCountKeyOptions<T extends string = string> = LocalizeBasicKeyOptions<T>;
export type LocalizeWithoutCountRawOptions<T extends string = string> = Omit<LocalizeBasicRawOptions<T>, 'locale'>;

export type LocalizeWithCountKeyOptions<T extends string = string> = LocalizeBasicKeyOptions<T> & LocalizeBasicCountOptions;
export type LocalizeWithCountRawOptions<T extends string = string> = LocalizeBasicRawOptions<T> & LocalizeBasicCountOptions;

// ------------------------

export type LocalizerOptions<T extends string = string> = Partial<
	BasicOptions & {
		/**
		 * Locale to use when invalid locale passed or not found in `fallbacks` table.
		 */
		defaultLocale: T;

		/**
		 * See {@link LocalizationTable}
		 */
		localization: LocalizationTable<T>;
		/**
		 * See {@link FallbacksTable}
		 */
		fallbacks: FallbacksTable<T>;
		/**
		 * See {@link PluralRulesTable}
		 */
		pluralRules: PluralRulesTable<T>;
	}
>;

// ----------------------------------

type CacheKey<T extends string = string> = `${T}.${string}` | string;
type FallbacksArray<T extends string = string> = { regexp: RegExp; fallback: T }[];

type ProcessDataOptions<T extends string = string> = {
	locale?: T;
	data?: LocalizationData;
	fallback: string;
	args: any[];
};
type ProcessPluralOptions = {
	count?: number;
	ordinal?: boolean;
};
type ProcessOverrideOptions = {
	cacheLocalization?: boolean;
	cacheFallbacks?: boolean;
	cachePluralRules?: boolean;
	cachePrintf?: boolean;
	intl?: boolean;
	safe?: boolean;
};

// ----------------------------------

const noCachePrintf = createPrintf(false);

function fallbackPluralSelector(count: number, ordinal?: boolean): PluralCategory {
	return 'other';
}

// ----------------------------------

export const printf = noCachePrintf;

export class LocalizerScope<T extends string = string> {
	localizer: Localizer<T>;
	locale: T;

	private static insertLocaleInOptions<T extends string = string>(locale: T, withCount: boolean = false, keyOrOptions, args: any[]): any {
		if (typeof keyOrOptions === 'string') {
			let resultOptions: any = {
				key: keyOrOptions,
				locale,
			};
			if (withCount && args.length) resultOptions.count = args.shift();
			return [resultOptions, ...args];
		} else if (isObjectLike(keyOrOptions)) {
			return [
				{
					locale,
					...keyOrOptions,
				},
				...args,
			];
		} else {
			return [keyOrOptions, ...args];
		}
	}

	constructor(localizer: Localizer<T>, locale: T) {
		this.localizer = localizer;
		this.locale = locale;

		let self = this;
		this.l = (...args) => LocalizerScope.prototype.l.apply(self, args);
		this.ln = (...args) => LocalizerScope.prototype.ln.apply(self, args);
		this.scope = (...args) => LocalizerScope.prototype.scope.apply(self, args);
	}

	l(key: string, ...args: any[]): string;
	l(options: LocalizeWithoutCountKeyOptions, ...args: any[]): string;
	l(options: LocalizeWithCountRawOptions, ...args: any[]): string;
	l(keyOrOptions: string | LocalizeWithoutCountKeyOptions | LocalizeWithoutCountRawOptions, ...args: any[]): string {
		let [resultOptions, resultArgs] = LocalizerScope.insertLocaleInOptions(this.locale, false, keyOrOptions, args);
		return this.localizer.l(resultOptions, ...resultArgs);
	}

	ln(key: string, count?: number, ...args: any[]): string;
	ln(options: LocalizeWithCountKeyOptions, ...args: any[]): string;
	ln(options: LocalizeWithCountRawOptions, ...args: any[]): string;
	ln(keyOrOptions: string | LocalizeWithCountKeyOptions | LocalizeWithCountRawOptions, ...args: any[]): string {
		let [resultOptions, resultArgs] = LocalizerScope.insertLocaleInOptions(this.locale, true, keyOrOptions, args);
		return this.localizer.ln(resultOptions, ...resultArgs);
	}

	scope(locale: T): LocalizerScope {
		return this.localizer.scope(locale);
	}
}
export default class Localizer<T extends string = string> {
	private _cacheLocalization: boolean;
	private _cachePluralRules: boolean;
	private _cacheFallbacks: boolean;
	private _cachePrintf: boolean;
	private _safe: boolean;
	private _intl: boolean;

	private _defaultLocale: T;

	private _localization: LocalizationTable<T>;
	private _localizationCache: Map<CacheKey, LocalizationData> = new Map();

	private _fallbacks: FallbacksTable<T>;
	private _fallbacksArray: FallbacksArray<T>;
	private _fallbacksCache: Map<CacheKey, T> = new Map();

	private _plurals: PluralRulesTable<T>;
	private _pluralsCache: Map<string, PluralRules> = new Map();

	private _printf: PrintfFunction;

	private static setDefaultLocale<T extends string = string>(target: Localizer<T>, defaultLocale: T): boolean {
		defaultLocale = typeof defaultLocale === 'string' ? defaultLocale : null;
		if (target._defaultLocale === defaultLocale) return false;
		target._defaultLocale = defaultLocale;
		return true;
	}
	private static setLocalization<T extends string = string>(target: Localizer<T>, localization: LocalizationTable<T>): boolean {
		if (!isObjectLike(localization)) localization = {};
		if (target._localization === localization) return false;
		target._localization = localization;
		Object.freeze(target._localization);
		return true;
	}
	private static setFallbacks<T extends string = string>(target: Localizer<T>, fallbacks: FallbacksTable<T>): boolean {
		if (!isObjectLike(fallbacks)) fallbacks = {};
		if (target._fallbacks === fallbacks) return false;
		target._fallbacks = fallbacks;
		Object.freeze(target._fallbacks);
		return true;
	}
	private static setPlurals<T extends string = string>(target: Localizer<T>, plurals: PluralRulesTable<T>): boolean {
		if (!isObjectLike(plurals)) plurals = {};
		if (target._plurals === plurals) return false;
		target._plurals = plurals;
		Object.freeze(target._plurals);
		return true;
	}
	private static setFallbacksArray<T extends string = string>(target: Localizer<T>): boolean {
		let result: FallbacksArray<T> = [];
		for (let pattern in target._fallbacks) {
			let rawRegexp = '^' + pattern.replace(/[/\-\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '(?:.*)') + '$';
			result.push({
				regexp: new RegExp(rawRegexp),
				fallback: target._fallbacks[pattern],
			});
		}
		if (target._defaultLocale) {
			result.push({
				regexp: new RegExp('*'),
				fallback: target._defaultLocale,
			});
		}
		target._localizationCache.clear();
		target._fallbacksArray = result;
		return true;
	}

	constructor(options?: LocalizerOptions<T>) {
		this._safe = Boolean(get(options, 'safe', false));
		this._intl = Boolean(get(options, 'intl', false));
		this._cacheLocalization = Boolean(get(options, 'cacheLocalization', true));
		this._cacheFallbacks = Boolean(get(options, 'cacheFallbacks', true));
		this._cachePluralRules = Boolean(get(options, 'cachePluralRules', true));
		this._cachePrintf = Boolean(get(options, 'cachePrintf', true));
		this._printf = createPrintf(true);

		Localizer.setDefaultLocale(this, get(options, 'defaultLocale', null));
		Localizer.setLocalization(this, get(options, 'localization', {}) as LocalizationTable<T>);
		Localizer.setFallbacks(this, get(options, 'fallbacks', {}) as FallbacksTable<T>);
		Localizer.setPlurals(this, get(options, 'pluralRules', {}) as PluralRulesTable<T>);
		Localizer.setFallbacksArray(this);

		let self = this;
		this.l = (...args) => Localizer.prototype.l.apply(self, args);
		this.ln = (...args) => Localizer.prototype.ln.apply(self, args);
		this.scope = (...args) => Localizer.prototype.scope.apply(self, args);
	}

	/**
	 * Locale to use when invalid locale passed or not found in `fallbacks` table.
	 *
	 * Can be set (will purge fallbacks cache).
	 */
	get defaultLocale() {
		return this._defaultLocale;
	}
	set defaultLocale(value: T) {
		if (Localizer.setDefaultLocale(this, value)) this._fallbacksCache.clear();
	}

	/**
	 * Should `localize.l()` and `localize.ln()` return `null` instead of throwing an error when invalid arguments passed.
	 *
	 * Can be set.
	 */
	get safe() {
		return this._safe;
	}
	set safe(value) {
		this._safe = Boolean(value);
	}

	/**
	 * Should use cache for localization data from {@link LocalizationTable}.
	 *
	 * Improves speed for already used keys, but can increase memory usage.
	 *
	 * Can be set (will purge localization cache).
	 */
	get cacheLocalization() {
		return this._cacheLocalization;
	}
	set cacheLocalization(value) {
		this._cacheLocalization = Boolean(value);
		this._localizationCache.clear();
	}
	/**
	 * Should use cache for plural rules functions from {@link PluralRulesTable} or [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules).
	 *
	 * Improves speed for already used locales, but can increase memory usage.
	 *
	 * Can be set (will purge plural rules cache).
	 */
	get cachePluralRules() {
		return this._cachePluralRules;
	}
	set cachePluralRules(value) {
		this._cachePluralRules = Boolean(value);
		this._pluralsCache.clear();
	}
	/**
	 * Should use cache for fallback locales from {@link FallbacksTable}.
	 *
	 * Improves speed for already used keys, but can increase memory usage.
	 *
	 * Can be set (will purge fallbacks cache).
	 */
	get cacheFallbacks() {
		return this._cacheFallbacks;
	}
	set cacheFallbacks(value) {
		this._cacheFallbacks = Boolean(value);
		this._fallbacksCache.clear();
	}
	/**
	 * Should use cache for patterns insertion.
	 *
	 * Improves speed for values with patterns, but can increase memory usage.
	 *
	 * Can be set (will purge printf cache).
	 */
	get cachePrintf() {
		return this._cachePrintf;
	}
	set cachePrintf(value) {
		this._cachePrintf = Boolean(value);
		this._printf.cache = {};
	}

	/**
	 * Use [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules) to convert `count` passed to `localizer.ln()` into plural category, when function in {@link PluralRulesTable} not found.
	 *
	 * Can be set (will purge plural rules cache).
	 */
	get intl() {
		return this._intl;
	}
	set intl(value) {
		this._intl = Boolean(value);
		this._pluralsCache.clear();
	}

	/**
	 * See {@link FallbacksTable}
	 *
	 * Can be set (will purge fallbacks cache).
	 */
	get fallbacks() {
		return this._fallbacks;
	}
	set fallbacks(value: FallbacksTable<T>) {
		if (Localizer.setFallbacks(this, value as FallbacksTable<T>)) this._fallbacksCache.clear();
	}

	/**
	 * See {@link LocalizationTable}
	 *
	 * Can be set (will purge localization abd fallbacks cache).
	 */
	get localization() {
		return this._localization;
	}
	set localization(value: LocalizationTable<T>) {
		if (Localizer.setLocalization(this, value as LocalizationTable<T>)) {
			this._localizationCache.clear();
			this._fallbacksCache.clear();
		}
	}

	/**
	 * See {@link PluralRulesTable}
	 *
	 * Can be set (will purge plural rules cache).
	 */
	get pluralRules() {
		return this._plurals;
	}
	set pluralRules(value: PluralRulesTable<T>) {
		if (Localizer.setPlurals(this, value as PluralRulesTable<T>)) this._pluralsCache.clear();
	}

	// -----------------

	/**
	 * Check is locale present in {@link LocalizationTable}.
	 */
	hasLocale(locale: T): boolean {
		return locale in this._localization;
	}

	// -----------------

	private getOverrideOptions(options: any): ProcessOverrideOptions {
		let result = {};
		for (let key of ['safe', 'intl', 'cacheLocalization', 'cachePluralRules', 'cacheFallbacks', 'cachePrintf']) {
			result[key] = Boolean(key in options ? options[key] : this[key]);
		}
		return result;
	}

	private getKey(locale: T, key: string): CacheKey {
		return (locale + '.' + key) as CacheKey;
	}
	private search(locale: T, key: string, override: ProcessOverrideOptions): { locale: T; value: LocalizationData | null } {
		let isDefaultLocale = false;
		// Input
		if (typeof locale !== 'string') {
			locale = this._defaultLocale;
			isDefaultLocale = true;
		}
		let startKey = this.getKey(locale, key);
		// Locale from cache
		let resultLocale = (override.cacheFallbacks && !isDefaultLocale ? this._fallbacksCache.get(startKey) : null) ?? locale;
		// If cache data present - return it
		let resultKey = this.getKey(resultLocale, key);
		if (override.cacheLocalization && this._localizationCache.has(resultKey))
			return {
				locale: resultLocale,
				value: this._localizationCache.get(resultKey),
			};
		// If localization data present - cache and return it
		let result = get(this._localization, resultKey);
		if (!isNil(result)) {
			if (override.cacheLocalization) this._localizationCache.set(resultKey, result);
			return {
				locale: resultLocale,
				value: result,
			};
		}
		if (!isDefaultLocale) {
			// Start fallback calculation
			for (let pattern of this._fallbacksArray) {
				if (pattern.regexp.test(resultLocale)) {
					resultLocale = pattern.fallback;
					resultKey = this.getKey(resultLocale, key);
					result = get(this._localization, resultKey);
					if (!isNil(result)) {
						if (override.cacheFallbacks) this._fallbacksCache.set(startKey, resultLocale);
						if (override.cacheLocalization) this._localizationCache.set(resultKey, result);
						return {
							locale: resultLocale,
							value: result,
						};
					}
				}
			}
		}
		if (override.cacheLocalization) this._localizationCache.set(startKey, null);
		return {
			locale,
			value: null,
		};
	}

	// -----------------

	private setPluralToCache(
		locale: T,
		ordinal: boolean = false,
		func: SelectedPluralRules,
		override: ProcessOverrideOptions
	): SelectedPluralRules {
		if (override.cachePluralRules) this._pluralsCache.set(locale + ':' + (ordinal ? '1' : '0'), func);
		return func;
	}

	private getPluralFromCache(locale: T, ordinal: boolean = false, override: ProcessOverrideOptions): SelectedPluralRules | null {
		return override.cachePluralRules ? this._pluralsCache.get(locale + ':' + (ordinal ? '1' : '0')) : null;
	}
	private getPluralFromTable(locale: T, ordinal: boolean = false, override: ProcessOverrideOptions): SelectedPluralRules | null {
		let func = this._plurals[locale];
		if (typeof func !== 'function') return null;
		return this.setPluralToCache(locale, ordinal, (count: number) => func(count, ordinal), override);
	}
	private getPluralFromIntl(locale: T, ordinal: boolean = false, override: ProcessOverrideOptions): SelectedPluralRules | null {
		if (!override.intl) return null;
		try {
			let intl = new Intl.PluralRules(locale, { type: ordinal ? 'ordinal' : 'cardinal' });
			return this.setPluralToCache(locale, ordinal, (count: number) => intl.select(count), override);
		} catch (e) {
			return null;
		}
	}
	private getPluralFallback(locale: T, ordinal: boolean = false, override: ProcessOverrideOptions): SelectedPluralRules {
		if (!locale) return (count: number) => fallbackPluralSelector(count, ordinal);
		return this.setPluralToCache(locale, ordinal, fallbackPluralSelector, override);
	}

	// -----------------

	private renderPrintf(msg: string, args: any[], override: ProcessOverrideOptions): string {
		return (override.cachePrintf ? this._printf : noCachePrintf)(msg, ...args.map((arg) => (isNil(arg) ? 'null' : arg)));
	}
	private matchInterval(count: number, str: string): boolean {
		let inverted = false;
		if (str.indexOf('!') === 0) {
			inverted = true;
			str = str.substring(1);
		}
		let interval = parseInterval(str);
		if (!interval || typeof count !== 'number') return false;
		if (interval.from.value === count) return invert(interval.from.included, inverted);
		if (interval.to.value === count) return invert(interval.to.included, inverted);
		return invert(
			Math.min(interval.from.value, count) === interval.from.value && Math.max(interval.to.value, count) === interval.to.value,
			inverted
		);
	}

	// -----------------

	private process(input: ProcessDataOptions<T>, override: ProcessOverrideOptions): string {
		if (isObjectLike(input.data)) {
			input.data = (input.data as LocalizationPluralData).one ?? (input.data as LocalizationPluralData).other;
		}
		if (isNil(input.data)) return String(input.fallback);
		return this.renderPrintf(String(input.data), input.args, override);
	}
	private processWithCount(input: ProcessDataOptions<T>, plural: ProcessPluralOptions, override: ProcessOverrideOptions): string {
		if (isObjectLike(input.data)) {
			let interval = Object.keys(input.data).find((interval) => this.matchInterval(plural.count, interval));
			if (interval) {
				input.data = input.data[interval];
			} else {
				let selector: PluralRules;
				let locale = input.locale;
				let ordinal = plural.ordinal;
				if (input.locale) {
					selector =
						this.getPluralFromCache(locale, ordinal, override) ||
						this.getPluralFromTable(locale, ordinal, override) ||
						this.getPluralFromIntl(locale, ordinal, override);
				}
				if (!selector) selector = this.getPluralFallback(locale, ordinal, override);
				input.data = input.data[selector(plural.count)] ?? (input.data as LocalizationPluralData).other;
			}
		}
		if (isNil(input.data)) return String(input.fallback);
		return this.renderPrintf(String(input.data), [plural.count, ...input.args], override);
	}

	// -----------------

	l(locale: T, key: string, ...args: any[]): string;
	l(options: LocalizeWithoutCountKeyOptions<T>, ...args: any[]): string;
	l(options: LocalizeWithoutCountRawOptions<T>, ...args: any[]): string;
	l(localeOrOptions: T | LocalizeWithoutCountKeyOptions<T> | LocalizeWithoutCountRawOptions<T>, ...args: any[]): string {
		let override: ProcessOverrideOptions;
		if (typeof localeOrOptions === 'string') {
			override = this.getOverrideOptions({});
			let key = args.shift();
			if (typeof key === 'string') {
				let result = this.search(localeOrOptions, key, override);
				return this.process(
					{
						locale: result.locale,
						data: result.value,
						fallback: key,
						args,
					},
					override
				);
			}
		} else if (isObjectLike(localeOrOptions)) {
			override = this.getOverrideOptions(localeOrOptions);
			if ('raw' in localeOrOptions) {
				if (!isObjectLike(localeOrOptions.raw) || !isNil(localeOrOptions.fallback))
					return this.process(
						{
							locale: null,
							data: localeOrOptions.raw,
							fallback: localeOrOptions.fallback,
							args,
						},
						override
					);
			} else if (typeof localeOrOptions.key === 'string') {
				let result = this.search(localeOrOptions.locale, localeOrOptions.key, override);
				return this.process(
					{
						locale: result.locale,
						data: result.value,
						fallback: localeOrOptions.fallback ?? localeOrOptions.key,
						args,
					},
					override
				);
			}
		} else {
			override = this.getOverrideOptions({});
		}
		if (override.safe) return null;
		// TODO: Make it more useful
		throw new Error('Cannot localize');
	}

	ln(locale: T, key: string, count: number, ...args: any[]): string;
	ln(options: LocalizeWithCountKeyOptions<T>, ...args: any[]): string;
	ln(options: LocalizeWithCountRawOptions<T>, ...args: any[]): string;
	ln(localeOrOptions: T | LocalizeWithCountKeyOptions<T> | LocalizeWithCountRawOptions<T>, ...args: any[]): string {
		let override: ProcessOverrideOptions;
		if (typeof localeOrOptions === 'string') {
			override = this.getOverrideOptions({});
			let key = args.shift();
			if (typeof key === 'string') {
				let count = args.length ? Number(args.shift()) : 1;
				let result = this.search(localeOrOptions, key, override);
				return this.processWithCount(
					{
						locale: result.locale,
						data: result.value,
						fallback: key,
						args,
					},
					{
						count,
						ordinal: false,
					},
					override
				);
			}
		} else if (isObjectLike(localeOrOptions)) {
			override = this.getOverrideOptions(localeOrOptions);
			if ('raw' in localeOrOptions) {
				if (!isObjectLike(localeOrOptions.raw) || !isNil(localeOrOptions.fallback))
					return this.processWithCount(
						{
							locale: localeOrOptions.locale,
							data: localeOrOptions.raw,
							fallback: localeOrOptions.fallback,
							args,
						},
						{
							count: localeOrOptions.count ?? 1,
							ordinal: Boolean(localeOrOptions.ordinal),
						},
						override
					);
			} else if (typeof localeOrOptions.key === 'string') {
				let result = this.search(localeOrOptions.locale, localeOrOptions.key, override);
				return this.processWithCount(
					{
						locale: result.locale,
						data: result.value,
						fallback: localeOrOptions.fallback ?? localeOrOptions.key,
						args,
					},
					{
						count: localeOrOptions.count ?? 1,
						ordinal: Boolean(localeOrOptions.ordinal),
					},
					override
				);
			}
		} else {
			override = this.getOverrideOptions({});
		}
		if (override.safe) return null;
		// TODO: Make it more useful
		throw new Error('Cannot localize');
	}

	scope(locale: T) {
		return new LocalizerScope(this, locale);
	}
}
