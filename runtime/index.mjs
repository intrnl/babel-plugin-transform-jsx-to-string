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

function escape (value) {
	const str = '' + value;
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

function text (value) {
	if (value == null || value === false) {
		return '';
	}

	if (value instanceof TrustedHTML) {
		return value.toString();
	}

	const str = escape(value);

	return str;
}

export { html, escape, attr, text };
