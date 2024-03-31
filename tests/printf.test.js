const { createPrintf } = require('../dist/printf');

describe('Printf function', () => {
	describe('No insertion', () => {
		it('When zero or one argument passed, it should return string', () => {
			const printf = createPrintf();

			expect(printf('Test string')).toBe('Test string');
			expect(printf(0)).toBe('0');
			expect(printf(null)).toBe('null');
			expect(printf(undefined)).toBe('undefined');
			expect(printf()).toBe('undefined');
		});
	});
	describe('Values as object insertion', () => {
		it('When patterns with key present, it should insert value from values object', () => {
			const printf = createPrintf();

			expect(printf('%(1)s, %(2)s and %(3.value)s', { 1: 'One', 2: 'Two', 3: { value: 'Three' } })).toBe('One, Two and Three');
			expect(printf('%(3.value)s, %(1)s and %(2)s', { 1: 'One', 2: 'Two', 3: { value: 'Three' } })).toBe('Three, One and Two');

			expect(printf('%(1)s, %(2)s and %(3)s', { 1: null, 2: undefined, 3: 0 })).toBe('null, undefined and 0');
			expect(printf('%(1)s, %(2)s and %(3)s', { 1: 'One' })).toBe('One, %(2)s and %(3)s');
		});
	});
	describe('Values as arguments insertion', () => {
		it('When patterns without position present, it should be inserted in order', () => {
			const printf = createPrintf();

			expect(printf('%s, %s and %s', 'One', 'Two', 'Three')).toBe('One, Two and Three');
		});
		it('When patterns with position present, it should be inserted according by this position', () => {
			const printf = createPrintf();

			expect(printf('%3$s, %2$s and %1$s', 'One', 'Two', 'Three')).toBe('Three, Two and One');
			expect(printf('%2$s, %2$s and %1$s', 'One', 'Two', 'Three')).toBe('Two, Two and One');
		});
		it('When both present, patterns with position should not affect order for patterns without position', () => {
			const printf = createPrintf();

			expect(printf('%s, %s and %1$s', 'One', 'Two', 'Three')).toBe('One, Two and One');
			expect(printf('%3$s, %s and %s', 'One', 'Two', 'Three')).toBe('Three, One and Two');
		});
	});
	describe('Formatting during insertion', () => {
		it('%t: insert value as boolean', () => {
			const printf = createPrintf();

			expect(printf('%t', true)).toBe('true');
			expect(printf('%t', false)).toBe('false');
			expect(printf('%t', null)).toBe('false');
			expect(printf('%t', undefined)).toBe('false');
		});

		it('%T: insert type of value', () => {
			const printf = createPrintf();

			expect(printf('%T', true)).toBe('Boolean');
			expect(printf('%T', 'first')).toBe('String');
			expect(printf('%T', 0)).toBe('Number');
			expect(printf('%T', new Date())).toBe('Date');
			expect(printf('%T', [])).toBe('Array');
			expect(printf('%T', null)).toBe('Null');
			expect(printf('%T', undefined)).toBe('Undefined');
		});

		it('%j: insert value as JSON', () => {
			const printf = createPrintf();

			expect(printf('%j', true)).toBe('true');
			expect(printf('%j', 'first')).toBe('"first"');
			expect(printf('%j', 0)).toBe('0');
			expect(printf('%j', { a: 1, b: 2 })).toBe('{"a":1,"b":2}');
			expect(printf('%j', [1, 2, 3])).toBe('[1,2,3]');
			expect(printf('%j', null)).toBe('null');
			expect(printf('%j', undefined)).toBe('undefined');
		});

		it('%s: insert value as string', () => {
			const printf = createPrintf();

			expect(printf('%s', 'Value')).toBe('Value');
			expect(printf('%s', false)).toBe('false');
			expect(printf('%s', null)).toBe('null');
			expect(printf('%s', undefined)).toBe('undefined');
		});
		it('%S: insert value as string in upper case', () => {
			const printf = createPrintf();

			expect(printf('%S', 'Value')).toBe('VALUE');
			expect(printf('%S', false)).toBe('FALSE');
			expect(printf('%S', null)).toBe('NULL');
			expect(printf('%S', undefined)).toBe('UNDEFINED');
		});
		it('%c: insert value as string in lower case', () => {
			const printf = createPrintf();

			expect(printf('%c', 'Value')).toBe('value');
			expect(printf('%c', false)).toBe('false');
			expect(printf('%c', null)).toBe('null');
			expect(printf('%c', undefined)).toBe('undefined');
		});
		it('%C: insert value as string in upper case', () => {
			const printf = createPrintf();

			expect(printf('%C', 'Value')).toBe('VALUE');
			expect(printf('%C', false)).toBe('FALSE');
			expect(printf('%C', null)).toBe('NULL');
			expect(printf('%C', undefined)).toBe('UNDEFINED');
		});
		it('%n: insert value as string and make first letter upper case', () => {
			const printf = createPrintf();

			expect(printf('%n', 'vErY bIg VaLuE')).toBe('Very big value');
			expect(printf('%n', null)).toBe('Null');
			expect(printf('%n', undefined)).toBe('Undefined');
		});
		it('%N: insert value as string and make first letter in every word upper case', () => {
			const printf = createPrintf();

			expect(printf('%N', 'vErY bIg VaLuE')).toBe('Very Big Value');
			expect(printf('%N', null)).toBe('Null');
			expect(printf('%N', undefined)).toBe('Undefined');
		});

		it('%b: insert value as binary', () => {
			const printf = createPrintf();

			expect(printf('%b', 7)).toBe('111');
			expect(printf('%b', 7.25)).toBe('111');
			expect(printf('%b', null)).toBe('0');
			expect(printf('%b', undefined)).toBe('NaN');
		});
		it('%o: insert value as octal', () => {
			const printf = createPrintf();

			expect(printf('%o', 12345)).toBe('30071');
			expect(printf('%o', 12345.678)).toBe('30071');
			expect(printf('%o', null)).toBe('0');
			expect(printf('%o', undefined)).toBe('NaN');
		});
		it('%i: insert value as integer', () => {
			const printf = createPrintf();

			expect(printf('%i', 12)).toBe('12');
			expect(printf('%i', 12.34)).toBe('12');
			expect(printf('%i', -1)).toBe('-1');
			expect(printf('%i', 999999999999999)).toBe('999999999999999');
			expect(printf('%i', null)).toBe('0');
			expect(printf('%i', undefined)).toBe('NaN');
		});
		it('%d: insert value as signed decimal', () => {
			const printf = createPrintf();

			expect(printf('%d', 12)).toBe('12');
			expect(printf('%d', 12.34)).toBe('12');
			expect(printf('%d', -1)).toBe('-1');
			expect(printf('%d', 999999999999999)).toBe('-1530494977');
			expect(printf('%d', null)).toBe('0');
			expect(printf('%d', undefined)).toBe('NaN');
		});
		it('%u: insert value as unsigned decimal', () => {
			const printf = createPrintf();

			expect(printf('%u', 1)).toBe('1');
			expect(printf('%u', 1.2345)).toBe('1');
			expect(printf('%u', -1.2345)).toBe('4294967295');
			expect(printf('%u', null)).toBe('0');
			expect(printf('%u', undefined)).toBe('NaN');
		});
		it('%x: insert value as hexadecimal in lower case', () => {
			const printf = createPrintf();

			expect(printf('%x', 255)).toBe('ff');
			expect(printf('%x', false)).toBe('0');
			expect(printf('%x', null)).toBe('0');
			expect(printf('%x', undefined)).toBe('NaN');
		});
		it('%X: insert value as hexadecimal in upper case', () => {
			const printf = createPrintf();

			expect(printf('%X', 255)).toBe('FF');
			expect(printf('%X', false)).toBe('0');
			expect(printf('%X', null)).toBe('0');
			expect(printf('%X', undefined)).toBe('NaN');
		});
		it('%e: insert value in exponential form with lower e', () => {
			const printf = createPrintf();

			expect(printf('%e', 12345)).toBe('1.2345e+4');
			expect(printf('%.1e', 12345)).toBe('1.2e+4');
			expect(printf('%e', null)).toBe('0e+0');
			expect(printf('%.1e', null)).toBe('0.0e+0');
			expect(printf('%e', undefined)).toBe('NaN');
		});
		it('%E: insert value in exponential form with upper E', () => {
			const printf = createPrintf();

			expect(printf('%E', 12345)).toBe('1.2345E+4');
			expect(printf('%.1E', 12345)).toBe('1.2E+4');
			expect(printf('%E', null)).toBe('0E+0');
			expect(printf('%.1E', null)).toBe('0.0E+0');
			expect(printf('%E', undefined)).toBe('NaN');
		});
		it('%f: insert value as float', () => {
			const printf = createPrintf();

			expect(printf('%f', 123)).toBe('123');
			expect(printf('%f', 123.456)).toBe('123.456');
			expect(printf('%.1f', 123.456)).toBe('123.5');
			expect(printf('%f', null)).toBe('0');
			expect(printf('%.1f', null)).toBe('0.0');
			expect(printf('%f', undefined)).toBe('NaN');
		});
	});
	describe('Pad value', () => {
		it(' +: add whitespaces to left', () => {
			const printf = createPrintf();

			expect(printf('%+4s', 'II')).toBe('  II');
			expect(printf('%+4s', 'IIIIII')).toBe('IIIIII');
		});
		it(' -: add whitespaces to right', () => {
			const printf = createPrintf();

			expect(printf('%-4s', 'II')).toBe('II  ');
			expect(printf('%-4s', 'IIIIII')).toBe('IIIIII');
		});
		it(' 0: add zeroes to left', () => {
			const printf = createPrintf();

			expect(printf('%04s', 'II')).toBe('00II');
			expect(printf('%04s', 'IIIIII')).toBe('IIIIII');
		});
		it('++: add sign for number and whitespaces to left', () => {
			const printf = createPrintf();

			expect(printf('%++4s', 'II')).toBe(' NaN');
			expect(printf('%++4s', 'IIIIII')).toBe(' NaN');
			expect(printf('%++4s', '23')).toBe(' +23');
			expect(printf('%++4s', '-5')).toBe('  -5');
			expect(printf('%++4s', '123456')).toBe('+123456');
			expect(printf('%++4s', '-123456')).toBe('-123456');
		});
		it('+-: add sign for number and whitespaces to right', () => {
			const printf = createPrintf();

			expect(printf('%+-4s', 'II')).toBe('NaN ');
			expect(printf('%+-4s', 'IIIIII')).toBe('NaN ');
			expect(printf('%+-4s', '23')).toBe('+23 ');
			expect(printf('%+-4s', '-5')).toBe('-5  ');
			expect(printf('%+-4s', '123456')).toBe('+123456');
			expect(printf('%+-4s', '-123456')).toBe('-123456');
		});
		it('+0: add sign for number and zeroes to left', () => {
			const printf = createPrintf();

			expect(printf('%+04s', 'II')).toBe(' NaN');
			expect(printf('%+04s', 'IIIIII')).toBe(' NaN');
			expect(printf('%+04s', '23')).toBe('+023');
			expect(printf('%+04s', '-5')).toBe('-005');
			expect(printf('%+04s', '123456')).toBe('+123456');
			expect(printf('%+04s', '-123456')).toBe('-123456');
		});
	});
	describe('Patterns intersection', () => {
		it('When pattern placed one by one, all should be processed correctly', () => {
			const printf = createPrintf();

			expect(printf('%s%s%s', 'One', 'Two', 'Three')).toBe('OneTwoThree');
			expect(printf('%3$s%2$s%1$s', 'One', 'Two', 'Three')).toBe('ThreeTwoOne');
			expect(printf('%(1)s%(2)s%(3.value)s', { 1: 'One', 2: 'Two', 3: { value: 'Three' } })).toBe('OneTwoThree');

			// Looks complicated, isn't it?
			expect(printf('%1$05.1f%1$05.2f%1$05.3f', 1.2345)).toBe('001.201.231.234');

			expect(
				printf(
					"I'm live in %(city)N with my %(animal.type)s %(animal.name)n. %(animal.pronounce.0)n %(animal.feeling)S this place.",
					{
						city: 'new york',
						animal: {
							pronounce: ['she', 'her'],
							type: 'cat',
							name: 'kitty',
							feeling: 'love',
						},
					}
				)
			).toBe("I'm live in New York with my cat Kitty. She LOVE this place.");
		});
	});
});
