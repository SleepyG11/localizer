/*

Original code from https://github.com/gajus/fast-printf

Copyright (c) 2021, Gajus Kuizinas (http://gajus.com/)
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
* Redistributions of source code must retain the above copyright
  notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright
  notice, this list of conditions and the following disclaimer in the
  documentation and/or other materials provided with the distribution.
* Neither the name of the Gajus Kuizinas (http://gajus.com/) nor the
  names of its contributors may be used to endorse or promote products
  derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL ANUARY BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

import { get, has, isNil, isObjectLike } from './no-lodash';

// --------------------

type Flag = '+' | '-' | '0' | '++' | '+-' | '+0';
type LiteralToken = {
	type: 'literal';
	literal: string;
};
type PlaceholderToken = {
	key: string | null;
	flag: Flag | null;
	position: number | null;
	precision: number | null;
	width: number | null;

	conversion: string;
	placeholder: string;
	type: 'placeholder';
};
type Token = LiteralToken | PlaceholderToken;
export type PrintfFunction = ((subject: string, ...args: any[]) => string) & {
	cache: Record<string, any[]>;
	useCache: boolean;
};

// --------------------
// Original regexp: /(?:%(?<flag>([+0-]|-\+))?(?<width>\d+)?(?<position>\d+\$)?(?<precision>\.\d+)?(?<conversion>[%bBcCideEfnNosux-]))|(\\%)/g;
const TOKEN_RULE =
	/%(?:(?<position>\d+)\$|\((?<key>[^\(\)]+)\))?(?<flag>\+?[0\+\-])?(?<width>\d+)?(?:\.(?<precision>\d+))?(?<conversion>[%tTjsScCnNboiduxXeEf])|\\%/g;

function parseArgv(args: any[]) {
	if (args.length && isObjectLike(args[args.length - 1])) return [args[args.length - 1], args.slice()];
	return [{}, args.slice()];
}
function padValue(value: string, width: number, flag: Flag | null): string {
	switch (flag) {
		case '+':
			return String(value).padStart(width, ' ');
		case '-':
			return String(value).padEnd(width, ' ');
		case '0':
			return String(value).padStart(width, '0');
		case '++': {
			let n = Number(value);
			if (isNaN(n)) return 'NaN'.padStart(width, ' ');
			return ((n < 0 ? '' : '+') + String(n)).padStart(width, ' ');
		}
		case '+-': {
			let n = Number(value);
			if (isNaN(n)) return 'NaN'.padEnd(width, ' ');
			return ((n < 0 ? '' : '+') + String(n)).padEnd(width, ' ');
		}
		case '+0': {
			let n = Number(value);
			if (isNaN(n)) return 'NaN'.padStart(width, ' ');
			return (n < 0 ? '-' : '+') + String(Math.abs(n)).padStart(width - 1, '0');
		}
		default:
			return value.padStart(width, ' ');
	}
}
function padToken(token: PlaceholderToken, boundValue: any): string {
	return token.width !== null ? padValue(String(boundValue), token.width, token.flag) : String(boundValue);
}
function tokenize(subject: string): Token[] {
	const tokens: Token[] = [];
	let matchResult: RegExpExecArray;

	let argumentIndex = 0;
	let lastIndex = 0;
	let lastToken: Token | null = null;

	while ((matchResult = TOKEN_RULE.exec(subject)) !== null) {
		if (matchResult.index > lastIndex) {
			lastToken = {
				literal: subject.slice(lastIndex, matchResult.index),
				type: 'literal',
			};
			tokens.push(lastToken);
		}

		const match = matchResult[0];
		lastIndex = matchResult.index + match.length;

		if (match === '\\%' || match === '%%') {
			if (lastToken && lastToken.type === 'literal') {
				lastToken.literal += '%';
			} else {
				lastToken = {
					literal: '%',
					type: 'literal',
				};
				tokens.push(lastToken);
			}
		} else if (matchResult.groups) {
			lastToken = {
				key: matchResult.groups.key ?? null,
				conversion: matchResult.groups.conversion,
				flag: (matchResult.groups.flag as Flag) || null,
				placeholder: match,
				position: matchResult.groups.key
					? null
					: matchResult.groups.position
					? Number.parseInt(matchResult.groups.position, 10) - 1
					: argumentIndex++,
				precision: matchResult.groups.precision ? Number.parseInt(matchResult.groups.precision, 10) : null,
				type: 'placeholder',
				width: matchResult.groups.width ? Number.parseInt(matchResult.groups.width, 10) : null,
			};
			tokens.push(lastToken);
		}
	}

	if (lastIndex <= subject.length - 1) {
		if (lastToken && lastToken.type === 'literal') {
			lastToken.literal += subject.slice(lastIndex);
		} else {
			tokens.push({
				literal: subject.slice(lastIndex),
				type: 'literal',
			});
		}
	}

	return tokens;
}
function convertPlaceholderToken(token: PlaceholderToken, boundValue: any, present = false): string {
	if (!present) return token.placeholder;
	if (typeof boundValue === 'function') boundValue = boundValue();
	switch (token.conversion) {
		// Boolean
		case 't': {
			return padToken(token, Boolean(boundValue));
		}

		// Type
		case 'T': {
			return padToken(token, Object.prototype.toString.call(boundValue).slice(8, -1));
		}

		// JSON
		case 'j': {
			try {
				return JSON.stringify(boundValue, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
			} catch (e) {
				return '[Circular]';
			}
		}

		// String
		case 's':
			return padToken(token, boundValue);
		// String (upper case)
		case 'S':
			return padToken(token, String(boundValue).toUpperCase());
		// String (lower case)
		case 'c':
			return padToken(token, String(boundValue).toLowerCase());
		// String (upper case)
		case 'C':
			return padToken(token, String(boundValue).toUpperCase());
		// String (capital first word)
		case 'n': {
			boundValue = String(boundValue);
			return padToken(token, boundValue.substring(0, 1).toUpperCase() + boundValue.substring(1).toLowerCase());
		}
		// String (capital all words)
		case 'N': {
			let splitted = String(boundValue)
				.split(' ')
				.map((s) => s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase());
			return padToken(token, splitted.join(' '));
		}

		// Binary
		case 'b': {
			let result = boundValue === undefined ? 'NaN' : (Number.parseInt(boundValue, 10) >>> 0).toString(2);
			return padToken(token, result);
		}
		// Octal
		case 'o': {
			let result = boundValue === undefined ? 'NaN' : (Number.parseInt(boundValue, 10) >>> 0).toString(8);
			return padToken(token, result);
		}
		// Integer
		case 'i':
			return padToken(token, Math.trunc(boundValue));
		// Signed decimal
		case 'd': {
			let result = boundValue === undefined ? 'NaN' : boundValue >> 0;
			return padToken(token, result);
		}
		// Unsigned decimal
		case 'u': {
			let result = boundValue === undefined ? 'NaN' : Number.parseInt(boundValue, 10) >>> 0;
			return padToken(token, result);
		}
		// Hexadecimal (lower case)
		case 'x': {
			let result = boundValue === undefined ? 'NaN' : (Number.parseInt(boundValue, 10) >>> 0).toString(16);
			return padToken(token, result);
		}
		// Hexadecimal (upper case)
		case 'X': {
			let result = boundValue === undefined ? 'NaN' : (Number.parseInt(boundValue, 10) >>> 0).toString(16).toUpperCase();
			return padToken(token, result);
		}
		// Exponential (lower case)
		case 'e': {
			let precision = isNil(token.precision) ? undefined : token.precision;
			return padToken(token, Number(boundValue).toExponential(precision));
		}
		// Exponential (upper case)
		case 'E': {
			let precision = isNil(token.precision) ? undefined : token.precision;
			let result = Number(boundValue).toExponential(precision);
			return padToken(token, result === 'NaN' ? 'NaN' : result.toUpperCase());
		}
		// Float
		case 'f': {
			if (isNil(token.precision)) return padToken(token, Number(boundValue));
			return padToken(token, Number(boundValue).toFixed(token.precision));
		}

		default:
			throw new Error('Unknown format specifier: ' + token.conversion);
	}
}

export function createPrintf(useCache: boolean = true): PrintfFunction {
	const cache: Record<string, Token[]> = {};
	const func = function printf(subject: string, ...rawArgs: any[]): string {
		subject = String(subject);

		if (!/%/.test(subject)) return subject;
		let [values, args] = parseArgv(rawArgs);
		if (!Object.keys(values).length && !args.length) return subject;

		let tokens = func.useCache ? cache[subject] || (cache[subject] = tokenize(subject)) : tokenize(subject);
		let result = '';
		for (let token of tokens) {
			if (token.type === 'literal') result += token.literal;
			else if (token.key) {
				result += convertPlaceholderToken(token, get(values, token.key), has(values, token.key));
			} else result += convertPlaceholderToken(token, args[token.position], args.length > token.position);
		}
		return result;
	};
	func.useCache = useCache;
	func.cache = cache;
	return func;
}
