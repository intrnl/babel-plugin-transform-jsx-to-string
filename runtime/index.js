function html (value) {
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

	const str = html(value);

	return ' ' + attr + '="' + str + '"';
}

function text (value) {
	if (value == null || value === false) {
		return '';
	}

	const str = html(value);

	return str;
}


exports.html = html;
exports.attr = attr;
exports.text = text;
