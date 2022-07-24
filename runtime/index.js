class TrustedHTML {
	constructor (html) {
		this.html = html;
	}

	toString () {
		return this.html;
	}
}

function html (html) {
	return new TrustedHTML(html);
}

function escape_attr (value) {
	const str = typeof value === 'string' ? value : ('' + value);
	const res = str.replace(/[^-_$:a-zA-Z0-9]/g, '');

	return res;
}

function escape (value, is_attr = false) {
	const str = '' + value;

	let escaped = '';
	let last = 0;

	for (let idx = 0, len = str.length; idx < len; idx++) {
		const char = str.charCodeAt(idx);

		if (char === 38 || (is_attr ? char === 34 : char === 60)) {
			escaped += str.substring(last, idx) + ('&#' + char + ';');
			last = idx + 1;
		}
	}

	return escaped + str.substring(last);
}

function attr (attr, value) {
	if (value == null || value === false) {
		return '';
	}

	if (value === true) {
		return ' ' + attr;
	}

	const str = escape(value, true);

	return ' ' + attr + '="' + str + '"';
}

function spread_attr (attrs) {
	let res = '';

	for (const key in attrs) {
		res += attr(escape_attr(key), attrs[key]);
	}

	return res;
}

function text (value) {
	if (value == null || value === false) {
		return '';
	}

	if (value instanceof TrustedHTML) {
		return value.toString();
	}

	if (Array.isArray(value)) {
		let res = '';

		for (let i = 0; i < value.length; i++) {
			res += text(value[i]);
		}

		return res;
	}

	const str = escape(value, false);

	return str;
}

exports.TrustedHTML = TrustedHTML;
exports.html = html;
exports.escape = escape;
exports.escape_attr = escape_attr;
exports.attr = attr;
exports.text = text;
exports.spread_attr = spread_attr;
