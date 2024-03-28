declare module '@sleepy.g11/localizer' {
	export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
	export type PluralRules = (count: number, ordinal?: boolean) => PluralCategory;

	// ----------------------------------

	export interface LocalizationPluralData extends Partial<Record<PluralCategory, string>> {}
	export interface LocalizationRecursiveData extends Record<string, string | LocalizationData> {}
	export type LocalizationData = string | LocalizationPluralData | LocalizationRecursiveData;

	// ----------------------------------

	export type LocalizationTable<T extends string = string> = Partial<Record<T, Record<string, LocalizationData>>>;
	export type PluralRulesTable<T extends string = string> = Partial<Record<T, PluralRules>>;
	export type FallbacksTable<T extends string = string> = Record<string, T>;

	// ----------------------------------

	export type LocalizeBaseOptions = {
		cacheLocalization: boolean;
		cachePluralRules: boolean;
		cacheFallbacks: boolean;
		cachePrintf: boolean;

		intl: boolean;
		safe: boolean;
		fallback: string;
	};

	// ----------------------------------

	export type LocalizeWithoutCountBaseOptions = Partial<LocalizeBaseOptions>;
	export type LocalizeWithoutCountKeyOptions<T extends string = string> = LocalizeWithoutCountBaseOptions & {
		key: string;
		locale?: T;
	};
	export type LocalizeWithoutCountRawOptions<T extends string = string> = LocalizeWithoutCountBaseOptions & {
		raw: LocalizationData;
	};

	export type LocalizeWithCountBaseOptions = Partial<
		LocalizeBaseOptions & {
			count: number;
			ordinal: boolean;
		}
	>;
	export type LocalizeWithCountKeyOptions<T extends string = string> = LocalizeWithCountBaseOptions & {
		key: string;
		locale?: T;
	};
	export type LocalizeWithCountRawOptions<T extends string = string> = LocalizeWithCountBaseOptions & {
		raw: LocalizationData;
		locale?: T;
	};

	// ----------------------------------

	export type LocalizerOptions<T extends string = string> = Partial<{
		safe: boolean;
		intl: boolean;

		cacheLocalization: boolean;
		cachePluralRules: boolean;
		cacheFallbacks: boolean;
		cachePrintf: boolean;

		defaultLocale: T;

		fallbacks: FallbacksTable<T>;
		plurals: PluralRulesTable<T>;
		localization: LocalizationTable<T>;
	}>;
}
