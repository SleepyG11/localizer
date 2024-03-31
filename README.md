# Node.js Localizer
Simple localization module with [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules) support for pluralization.

## ⚠ Work in Progress
This module is WIP. Breaking changes may appear recently. Full JSDoc and tests will be provided later.

## Install
```
npm install @sleepyg11/localizer --save
```

## Table of content
- [Basic usage](#basic-usage)
- [Main structures](#main-structures)
  - [Localization Table](#localization-table)
  - [Fallbacks Table](#fallbacks-table)
  - [Plural Rules Table](#plural-rules-table)
- [`Localizer` class](#localizer-class)
- [`LocalizerScope` class](#localizerscope-class)
- [Localize methods](#localize-methods)
  - [`l()`](#l)
  - [`ln()`](#ln)
- [Values insertion](#values-insertion)
  - [Utility formatters](#utility-formatters)
  - [String formatters](#string-formatters)
  - [Number formatters](#number-formatters)
  - [Insertion order](#insertion-order)
  - [Combined](#combined)
  - [No value](#no-value)
  - [Calculating value](#calculating-value)
---

## Basic usage
```js
// CommonJS
const { default: Localizer } = require('@sleepyg11/localizer')
// ESM
import Localizer from '@sleepyg11/localizer'

const localizer = new Localizer({
    intl: true,
    localization: {
        'en-US': {
            'hello': 'Hello world!',
            'cats': {
                'one': '%s cat',
                'other': '%s cats',
            },
        },
        'ru-RU': {
            'hello': 'Привет мир!',
            'cats': {
                'one': '%s кот',
                'few': '%s кота',
                'other': '%s котов',
            },
        },
    },
})

// Assign localize functions to variables is fine
const l = localizer.l
const ln = localizer.ln

// Get localization data by locale and key.
l('en-US', 'hello');    // -> Hello world!
l('ru-RU', 'hello');    // -> Привет мир!

// Using plural rules
ln('en-US', 'cats', 1)  // -> 1 cat
ln('en-US', 'cats', 2)  // -> 2 cats

ln('ru-RU', 'cats', 1)  // -> 1 кот
ln('ru-RU', 'cats', 2)  // -> 2 кота
ln('ru-RU', 'cats', 5)  // -> 5 котов

// Create scope with pre defined locale
const scope = localizer.scope('ru-RU')

scope.l('hello')        // -> Привет мир!
scope.ln('cats', 2)     // -> 2 кота
```

## Main structures
### Localization table
JSON object with key-value localization data for all locales.
For each key, value can be:
- String
- Nested data
- Object with specific keys usable for pluralization:
  - plural categories defined in [Unicode CLDR](https://cldr.unicode.org/index/cldr-spec/plural-rules)
    ```
    zero, one, two, few, many, other
    ```
  - math intervals as part of [ISO 31-11](https://en.wikipedia.org/wiki/ISO_31-11)
    - leading `!` invert interval
    - have priority over plural categories
    ```
    [3]         Match number 3 only
    [3,5]       Match all numbers between 3 and 5 (both inclusive)
    (3,5)       Match all numbers between 3 and 5 (both exclusive)
    [3,5)       Match all numbers between 3 (inclusive) and 5 (exclusive)
    [3,]        Match all numbers bigger or equal 3
    [,5)        Match all numbers less than 5
    ![3]        Match all numbers except 3
    ![3,5]      Match all numbers less than 3 or bigger than 5
    ```
- `undefined` or `null` are **ignored**
-  Any other type will be converted to string

**Example**
```js
{
    // Locale
    'en-US': {
        // String
        hello: 'Hello world!',

        // Nested data
        food: {
            apple: 'Red Apple',
        },

        // Specific keys
        cats: {
            '[21]': 'Twenty one cats',
            '(50,]': 'More than 50 cats',
            'one': '%s cat',
            'other': '%s cats',
        },
    },
}
```

### Fallbacks table
Object with fallback locales for all locales.
When localization data for initial locale not found, next that matches pattern in table (in order they present) will be used. Repeats until data will be found. 
`*` can be used as wildcard in patterns.

**Example**
```js
{
  // For all English locales, fallback to `en-UK`
  'en-*': 'en-UK',
  // If `en-UK` localization missing, use `en-US` instead
  'en-UK': 'en-US',
}
```

### Plural Rules table
Table that contains plural rules functions for locales.
Each function take 2 arguments:
- `count` (*number*) - number to pluralize
- `ordinal` (*boolean*) - use ordinal form (1st, 2nd, 3rd, etc.) instead of cardinal (1, 2, 3, etc.)

As result it should return one of plural category:
```
zero, one, two, few, many, other
```

**Example**
```js
{
    'en-US': (count, ordinal = false) => {
        if (ordinal) return count === 2 ? 'two' : count === 1 ? 'one' : 'other'
        return count === 1 ? 'one' : 'other'
    },
    // Using rules from `Intl.PluralRules` for custom locales.
    // Not recommended.
    'russian': (count, ordinal = false) => {
        return new Intl.PluralRules('ru-RU', { 
            type: ordinal ? 'ordinal' : 'cardinal',
        }).select(count)
    }
}
```

## `Localizer` class
The main class that provide localization methods.
```js
const localizer = new Localizer()
```

Constructor options (all *optional*):
- `safe`: Should localize methods returns null instead of throw error when invalid arguments passed (default: `false`).
- `intl`: Use [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules) to resolve plural category (default: `false`).
- `localization`: [Localization Table](#localization-table).
- `fallbacks`: [Fallbacks Table](#fallbacks-table).
- `pluralRules`: [Plural Rules Table](#plural-rules-table). Have priority over [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules).
- `defaultLocale`: Locale to use when data for all fallback locales not found (default: `null`).
- `cacheLocalization`: Should cache localization data for all used keys (default: `true`).
- `cachePluralRules`: Should cache plural rules functions for all used locales (default: `true`).
- `cacheFallbacks`: Should cache fallback locales for all used keys (default: `true`).
- `cachePrintf`: Should use cache for patterns insertion (default: `true`).

*All cache options increase localization speed for frequently used locales, keys and data.*
*Each individual can be disabled, which reduce memory usage by cost of speed.*

Using constructor without options equals to:
```js
const localizer = new Localizer({
    safe: false,
    intl: false,
    localization: {},
    fallbacks: {},
    pluralRules: {},
    defaultLocale: null,
    cacheLocalization: true,
    cachePluralRules: true,
    cacheFallbacks: true,
    cachePrintf: true,
})
```

All options can be updated in any time:
```js
localizer.intl = true
localizer.cacheFallbacks = false
localizer.localization = {
    'en-US': {},
}
```

## `LocalizerScope` class
Can be taken from `Localizer.scope(locale)` method.
```js
const scope = localizer.scope('ru-RU')
```

Scope have similar `l()` and `ln()` methods, except they automatically use locale, defined in constructor.
All other options (like caching, fallbacks, etc.) inherit from `Localizer` class where was created.

## Localize methods
### `l()`
Main function to resolve localization.
```ts
localizer.l(locale: string, key: string, ...args)
scope.l(key: string, ...args)
// or
localizer.l(options, ...args)
scope.l(options, ...args)
```

Search process:
- Using `options.raw` or resolve data by using `locale` and `key`;
- If data is string, it will be used;
- If data is object, `one` or `other` form will be used;
- If data has other type, it will be converted to string and used;
- If data is `null` or `undefined`, or key not found, it's ignored;
- Process repeats for all fallback locales until some data will be found;
- If nothing found, `options.fallback` or initial `key` returned instead.

```js
const localizer = new Localizer({
    localization: {
        'en-US': {
            'items': {
                'apple': 'Red Apple',
            },
            'cats': {
                'one': '%s cat',
                'other': '%s cats',
            },
        },
    },
})

// Can be assigned to variable, will work fine.
const l = localizer.l

// Basic usage:
l('en-US', 'items.apple') // -> 'Red Apple'
l('en-US', 'cats', "Nick's") // -> 'Nick's cats'

// Options argument:
l({
    locale: 'en-US',
    key: 'items.apple',

    // Can override constructor options for this call only.
    safe: true,
    cacheLocalization: false,
}) // -> Red Apple

// Raw data:
l({
    raw: {
        one: 'One Pineapple',
        other: 'A lot of Pineapples',
    },
    fallback: 'Pineapple', // *Required* when raw is object.
}) // -> One Pineapple
```

### `ln()`
Function to resolve localization with count argument and using plural rules.
```ts
localizer.ln(locale: string, key: string, count: number, ...args)
scope.ln(key: string, count: number, ...args)
// or
localizer.ln(options, ...args)
scope.ln(options, ...args)
```

Search process:
- Using `options.raw` or resolve data by using `locale` and `key`;
- If data is string, it will be used;
- If data is object, then will be used:
  - First interval match;
  - Or, plural rules will be applied to determine plural category:
    - Function from [Plural Rules Table](#plural-rules-table);
    - Or [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules) if `localizer.intl = true`;
    - Or, `other` form returned;
- If data has other type, it will be converted to string and used;
- If data is `null` or `undefined`, or key not found, it's ignored;
- Process repeats for all fallback locales until some data will be found;
- If nothing found, `options.fallback` or initial `key` returned instead.

```js
const localizer = new Localizer({
    localization: {
        'en-US': {
            'cats': {
                '[3,5]': 'From 3 to 5 cats',
                'one': '%s cat in %s',
                'other': '%s cats',
            },
        },
    },
})

// Can be assigned to variable, will work fine.
const ln = localizer.ln;

// Basic usage:
ln('en-US', 'cats', 1, 'my home') // -> '1 cat in my home'
ln('en-US', 'cats', 2) // -> '2 cats'
ln('en-US', 'cats', 3) // -> 'From 3 to 5 cats'

// Options argument:
l({
    locale: 'en-US',
    key: 'cats',
    count: 2,
    ordinal: true, // Use ordinal form instead of cardinal
}) // -> 2 cats

// Raw data:
l({
    raw: {
        one: '%s Pineapple',
        other: '%s Pineapples',
    },
    fallback: 'Pineapple', // Required when raw is object.
    locale: 'en-US', // Locale to use for plural rules. *Optional*.
    count: 2
}) // -> 2 Pineapples
```

This method always prepend count to arguments list:
```js
ln({ raw: '%s', count: 10 }) // -> 10
```

## Values insertion
Localization data supports values insertion similar to [sprintf-js](https://www.npmjs.com/package/sprintf-js) does, with additional formatters which can be more useful for localization purposes.

**Example:**
```js
const localizer = new Localizer({
    localization: {
        'en-US': { 
            hello: 'Hello, %s!',
        }
    }
})
const l = localizer.l

l('en-US', 'hello', 'Kitty') // -> Hello, Kitty!
l({ raw: 'Goodbye, %S!' }, 'Kitty') // -> Goodbye, KITTY!
```

*In examples below,* `printf()` *function used instead of* `l()` *and* `ln()`*; insertion works identical for all of them.*
```js
import { printf } from '@sleepyg11/localizer'
```

### Utility formatters

#### `%t`: insert value as boolean
```js
printf('%t', 1) // -> true
printf('%t', 0) // -> false
```

#### `%T`: insert value type (name of constructor)
```js
printf('%T', undefined)    // -> Undefined
printf('%T', null)         // -> Null
printf('%T', true)         // -> Boolean
printf('%T', 0)            // -> Number
printf('%T', 0n)           // -> BigInt
printf('%T', 'Hello')      // -> String
printf('%T', [1, 2, 3])    // -> Array
printf('%T', { a: 1 })     // -> Object
printf('%T', new Date())   // -> Date
```

#### `%j`: insert value as JSON.
- [JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) will be used.
- `BigInt` converts to string.
- If JSON contains circular, `[Circular]` string will be returned.
```js
printf('%j', { a: 1, b: 1n }) // -> {'a':1,'b':'1'}

let withCircular = {};
withCircular.repeat = withCircular;
printf('%j', withCircular) // -> [Circular]
```

### String formatters
All passed values will be converted to string.

#### `%s`: insert value as string
```js
printf('%s', 'New YEAR') // -> New YEAR
```

#### `%S`: insert value as string in upper case
```js
printf('%S', 'New YEAR') // -> NEW YEAR
```

#### `%c`: insert value as string in lower case
```js
printf('%c', 'New YEAR') // -> new year
```

#### `%C`: insert value as string in upper case (similar to `%S`)
```js
printf('%C', 'New YEAR') // -> NEW YEAR
```

#### `%n`: insert value as string, first word capitalized, others in lower case
```js
printf('%n', 'New YEAR') // -> New year
```

#### `%N`: insert value as string, all words capitalized
```js
printf('%N', 'New YEAR') // -> New Year
```

### Number formatters
All passed values will be converted to number.
- `undefined` treated as `NaN`;
- `null` treated as `0` (zero).
- For some formats, precision can be applied: `%.<precision><format>`. See examples below.

#### `%b`: insert value as binary
```js
printf('%b', 13)          // -> 1101
```

#### `%o`: insert value as octal
```js
printf('%b', 13)          // -> 15
```

#### `%i`: insert value as integer
```js
printf('%i', 13.5)        // -> 13
printf('%i', 2147483648)  // -> 2147483648
```

#### `%d`: insert value as signed decimal
```js
printf('%d', 1)           // -> 15
printf('%d', -1)          // -> -1
printf('%d', 2147483648)  // -> -2147483648
```

#### `%u`: insert value as unsigned decimal
```js
printf('%d', 1)           // -> 1
printf('%d', -1)          // -> 4294967295
```

#### `%x`: insert value as hexadecimal in lower case
```js
printf('%x', 255)         // -> ff
```

#### `%X`: insert value as hexadecimal in upper case
```js
printf('%X', 255)         // -> FF
```

#### `%e`: insert value in exponential form with lower e (precision can be specified)
```js
printf('%e', 12345)       // -> 1.2345e+4
printf('%.1e', 12345)     // -> 1.2e+4
```

#### `%e`: insert value in exponential form with upper e (precision can be specified)
```js
printf('%E', 12345)       // -> 1.2345E+4
printf('%.1E', 12345)     // -> 1.2E+4
```

#### `%f`: insert value as float (precision can be specified)
```js
printf('%f', 13.579)      // -> 13.579
printf('%.2f', 13.579)    // -> 13.57
printf('%.1f', 13)        // -> 13.0
```

### Insertion order

```js
// Insert arguments in order they present
printf('%s, %s and %s', 'One', 'Two', 'Three') // -> 'One, Two and Three'

// Insert arguments in specific order
printf('%2$s, %3$s and %1$s', 'One', 'Two', 'Three') // -> 'Two, Three and One'

// Insert values from object
printf(
    '%(first)s, %(second)s and %(third)s',
    { first: 'fish', second: 'cat', third: 'fox' }
) // -> 'fish, cat and fox'

// Combined
printf(
    '%(first)s %s, %(second)s %s and %(third)s %s',
    'Fishcl', 'Kitty', 'Foxy',
    { first: 'fish', second: 'cat', third: 'fox' }
) // -> 'fish Fishlc, cat Kitty and fox Foxy'
```

### Pad values
All (except `%j`) processed values can be padded to match minimal width.

```js
//  +{width}: add whitespaces to left
printf('%+4s', 'hi')      // -> '  hi'
printf('%+4s', 'goodbye') // -> 'goodbye'

//  -{width}: add whitespaces to right
printf('%-4s', 'hi')      // -> 'hi  '
printf('%-4s', 'goodbye') // -> 'goodbye'

//  0{width}: add zeroes to left
printf('%04s', 'hi')      // -> '00hi'
printf('%04s', 'goodbye') // -> 'goodbye'
printf('%04s', '23')      // -> '0023'
printf('%04s', '-23')     // -> '0-23', don't do any sign checks!

// ++{width}: add sign for number and whitespaces to left
printf('%++5s', 23)       // -> '  +23'
printf('%++5s', -23)      // -> '  -23'

// +-{width}: add sign for number and whitespaces to right
printf('%+-5s', 23)       // -> '+23  '
printf('%+-5s', -23)      // -> '-23  '

// +0{width}: add sign for number and zeroes to left
printf('%+05s', 23)       // -> '+0023', sign checks applied!
printf('%+05s', -23)      // -> '-0023'
```

### Combined
Some examples of complex but powerful patterns:
```js
printf('%2$+08.2f -> %1$+08.2f', 1.2345, -54.321) // -> '-0054.32 -> +0001.23'
printf('#%+06X', 16753920) // -> '#FFA500', orange color in hex
printf(
    "I'm live in %(city)N with my %(animal.type)s %(animal.name)n. %(animal.pronounce.0)n %(animal.feeling)S this place.",
    {
        city: "new york",
        animal: {
            pronounce: ['she', 'her'],
            type: "cat",
            name: "kitty",
            feeling: "love",
        },
    },
) // -> "I'm live in New York with my cat Kitty. She LOVE this place."
```

### No value
If value not provided, pattern will be returned unchanged.

```js
printf('%s and %s', 'fish') // -> fish and %s
printf('%(hello)s and %(goodbye)s', { hello: 'Hola' }) // -> Hola and %(goodbye)s
```

### Calculating value
If value is function, in will be called without arguments and returned value will be used in pattern.

```js
// Most common usage example: Date. Will be displayed current date
printf('%s', () => new Date())
printf('%(date)s', { date: () => new Date() })
```
