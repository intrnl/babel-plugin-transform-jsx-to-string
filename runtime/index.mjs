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

function escape (value) {
	const str = typeof value === 'string' ? value : ('' + value);
	const res = str.replace(/[&"<]/g, (char) => '&#' + char.charCodeAt(0) + ';');

	return res;
}

function attr (attr, value) {
	if (value == null || value === false) {
		return '';
	}

	if (value === true) {
		return ' ' + attr;
	}

	const str = escape(value);

	return ' ' + attr + '="' + str + '"';
}

function spread_attr (attrs) {
	let res = '';

	for (const key in attrs) {
		res += attr(escape_attr(key.toLowerCase()), attrs[key]);
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

	const str = escape(value);

	return str;
}

export { TrustedHTML, html, escape, escape_attr, attr, text, spread_attr };
