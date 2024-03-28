export function isNil(v) {
	return v == null;
}

export function get(obj: any, path: string | string[], defaultValue?: any): any;
export function get(obj: any, path: string | string[], ...args: any[]): any {
	let input = Array.isArray(path) ? path : String.prototype.split.call(path, '.');
	let result = input.filter(Boolean).reduce((res, key) => (!isNil(res) ? res[key] : res), obj);
	if (!args.length) return result;
	return isNil(result) ? args[0] : result;
}
export function has(obj, key: string | string[]): boolean {
	if (isNil(obj)) return false;
	let keyParts: string[] = Array.isArray(key) ? key : key.split('.');
	return keyParts.length > 1 ? has(obj[keyParts[0]], keyParts.slice(1)) : Object.prototype.hasOwnProperty.call(obj, key);
}
export function isObjectLike(v): v is object {
	return typeof v === 'object' && v !== null;
}

export function invert(value: boolean, b: boolean = false) {
	return b ? !value : value;
}
