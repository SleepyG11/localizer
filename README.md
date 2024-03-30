# Node.js Localizer
Simple localization module, with [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules) support for pluralization.

## ⚠ Work in Progress
This module is WIP. Breaking changes may appear recently. Full JSDoc and tests will be added later.


## Install
```
npm install @sleepyg11/localizer --save
```

## Basic usage
```js
// CommonJS
const { default: Localizer } = require('@sleepyg11/localizer')

// ESM
import Localizer from '@sleepyg11/localizer';

const localizer = new Localizer({
    defaultLocale: "en-US",
    fallbacks: {
        'en-*': 'en-US',
    }
    localization: {
        'en-US': {
            'hello': "Hello world!",
            'cats': {
                'one': "%s cat",
                'other': "%s cats",
            }
        },
        'ru-RU': {
            'hello': "Привет мир!",
            'cats': {
                'one': "%s кот",
                'few': "%s кота",
                'other': "%s котов",
            }
        }
    }
})

// -- Using data from localization table by key

// Resolving fallback locale
localizer.l('en-UK', 'hello'); // -> Hello world!

// Passing arguments as options object
localizer.l({ locale: "ru-RU", key: "hello" }); // Привет мир!

// Using plural rules
localizer.ln('en-US', 'cats', 1) // -> 1 cat
localizer.ln('en-US', 'cats', 2) // -> 2 cats

// Passing arguments as options object, overriding constructor options available
localizer.ln({
    locale: "ru-RU",
    key: 'cats',
    count: 21,
    ordinal: false,
    intl: true // Use Intl.PluralRules for resolving plural category in this call only
}) // -> 21 кот


// -- Pass own data

// String
localizer.l({ raw: "Hello, %s!" }, 'Kitty') // -> Hello, Kitty!

// Object, usable for plural rules
localizer.ln({ 
    raw: {
        one: "%s apple",
        other: "%s apples"
    },
    fallbacks: "Unknown amount of apples" // Required when raw is object
    count: 2
}) // -> 2 apples

// Shortcut (not suitable for objects)
localizer.insert('Hello, %s!', 'Kitty') // -> Hello, Kitty!
```

## Values insertion
Localization data supports values insertion similar to [sprintf-js](https://www.npmjs.com/package/sprintf-js) does, with additional formatters which can be more useful for localization purposes.

Example:
```js
const localizer = new Localizer({
    localization: {
        'en-US': { hello: "Hello, %s!" }
    }
})

localizer.l('en-US', 'hello', 'Kitty') // -> Hello, Kitty!
localizer.l({ raw: "Goodbye, %s!" }, 'Kitty') // -> Goodbye, Kitty!
```

### Insertion formatters

**Utilities**

```js
// %t: insert value as boolean
localizer.insert('%t', 1) // -> true
localizer.insert('%t', 0) // -> false

// %T: insert value type (name of constructor)
localizer.insert('%T', undefined)    // -> Undefined
localizer.insert('%T', null)         // -> Null
localizer.insert('%T', true)         // -> Boolean
localizer.insert('%T', 0)            // -> Number
localizer.insert('%T', 0n)           // -> BigInt
localizer.insert('%T', 'Hello')      // -> String
localizer.insert('%T', [1, 2, 3])    // -> Array
localizer.insert('%T', { a: 1 })     // -> Object
localizer.insert('%T', new Date())   // -> Date

// %j: insert value as JSON by using JSON.stringify(). BigInt converts to string.
localizer.insert('%j', { a: 1, b: 1n }) // -> {"a":1,"b":"1"}

// If JSON contains circular, '[Circular]' string will be returned.
let withCircular = {};
withCircular.repeat = withCircular;
localizer.insert('%j', withCircular) // -> [Circular]
```

**Strings**

Any passed value will be converted to string.

```js
// %s: insert value as string
localizer.insert('%s', 'New YEAR') // -> New YEAR

// %S: insert value as string in upper case
localizer.insert('%S', 'New YEAR') // -> NEW YEAR

// %c: insert value as string in lower case
localizer.insert('%c', 'New YEAR') // -> new year

// %C: insert value as string in upper case (similar to %S)
localizer.insert('%C', 'New YEAR') // -> NEW YEAR

// %n: insert value as string, first word capitalized, other in lower case
localizer.insert('%n', 'New YEAR') // -> New year

// %N: insert value as string, all words capitalized
localizer.insert('%N', 'New YEAR') // -> New Year
```

**Numbers**

Any passed value will be converted to number.
- For some formats, precision can be applied (see examples below);
- `undefined` treated as `NaN`;
- `null` treated as `0` (zero).

```js
// %b: insert value as binary
localizer.insert('%b', 13)          // -> 1101

// %o: insert value as octal
localizer.insert('%b', 13)          // -> 15

// %i: insert value as JavaScript integer
localizer.insert('%i', 13.5)        // -> 13

// %d: insert value as signed decimal
localizer.insert('%d', 1)           // -> 15
localizer.insert('%d', -1)          // -> -1
localizer.insert('%d', 2147483648)  // -> -2147483648

// %u: insert value as unsigned decimal
localizer.insert('%d', 1)           // -> 1
localizer.insert('%d', -1)          // -> 4294967295

// %x: insert value as hexadecimal in lower case
localizer.insert('%x', 255)         // -> ff

// %X: insert value as hexadecimal in upper case
localizer.insert('%X', 255)         // -> FF

// %e: insert value in exponential form with lower e (precision applied)
localizer.insert('%e', 12345)       // -> 1.2345e+4
localizer.insert('%.1e', 12345)     // -> 1.2e+4

// %e: insert value in exponential form with upper e (precision applied)
localizer.insert('%E', 12345)       // -> 1.2345E+4
localizer.insert('%.1E', 12345)     // -> 1.2E+4

// %f: insert value as float (precision applied)
localizer.insert('%f', 13.579)      // -> 13.579
localizer.insert('%.2f', 13.579)    // -> 13.57
localizer.insert('%.1f', 13)        // -> 13.0
```

### Insertion order

```js
// Insert arguments in order they present
localizer.insert('%s, %s and %s', 'One', 'Two', 'Three') // -> One, Two and Three

// Insert arguments in specific order
localizer.insert('%2$s, %3$s and %1$s', 'One', 'Two', 'Three') // -> Two, Three and One

// Insert values from object
localizer.insert(
    '%(first)s, %(second)s and %(third)s',
    { first: "fish", second: 'cat', third: "fox" }
) // -> fish, cat and fox

// Combined
localizer.insert(
    '%(first)s %s, %(second)s %s and %(third)s %s',
    'Fishcl', 'Kitty', 'Foxy',
    { first: "fish", second: 'cat', third: "fox" }
) // -> fish Fishlc, cat Kitty and fox Foxy
```

### Pad values
All (except `%j`) processed values can be padded to match minimal width.

```js
//  +{width}: add whitespaces to left
localizer.insert('%+4s', 'hi')      // -> "  hi"
localizer.insert('%+4s', 'goodbye') // -> "goodbye"

//  -{width}: add whitespaces to right
localizer.insert('%-4s', 'hi')      // -> "hi  "
localizer.insert('%-4s', 'goodbye') // -> "goodbye"

//  0{width}: add zeroes to left
localizer.insert('%04s', 'hi')      // -> "00hi"
localizer.insert('%04s', 'goodbye') // -> "goodbye"
localizer.insert('%04s', '23')      // -> "0023"
localizer.insert('%04s', '-23')     // -> "0-23", don't do any sign checks!

// ++{width}: add sign for number and whitespaces to left
localizer.insert('%++4s', 23)       // -> " +23"
localizer.insert('%++4s', -23)      // -> " -23"

// ++{width}: add sign for number and whitespaces to right
localizer.insert('%+-4s', 23)       // -> "+23 "
localizer.insert('%+-4s', -23)      // -> "-23 "

// +0{width}: add sign for number and zeroes to left
localizer.insert('%+04s', 23)       // -> "+023", sign checks applied!
localizer.insert('%+04s', -23)      // -> "-023"
```

### No value
If value for pattern not provided, it will be returned unchanged.

```js
localizer.insert('%s and %s', 'fish') // -> fish and %s
localizer.insert('%(hello)s and %(goodbye)s', { hello: "Hola" }) // -> Hola and %(goodbye)s
```

### Calculating value
If value is function, in will be called without arguments and returned value will be used instead.

```js
// Most common example usage: Date. Will be displayed current date
localizer.insert('%s', () => new Date())
localizer.insert('%(date)s', { date: () => new Date() })
```