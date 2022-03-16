const babel = require('@babel/core');
const jsx = require('@babel/plugin-syntax-jsx');

const { text: escapeText, attr: escapeAttr } = require('../runtime');

const MODULE = '@intrnl/babel-plugin-transform-jsx-to-string/runtime';
const RID = Math.random().toString(36).slice(2, 2 + 4);

const HTML_IDENT = '$' + RID + '$html';
const ATTR_IDENT = '$' + RID + '$attr';
const TEXT_IDENT = '$' + RID + '$text';
const SPREAD_ATTR_IDENT = '$' + RID + '$spread_attr';

/**
 * @param {typeof babel & babel.ConfigAPI} api
 * @returns {babel.PluginObj}
 */
module.exports = function (api, options) {
	const { types: t } = api;
	const { module: mod = MODULE } = options;

	const importDecl = t.importDeclaration([
		t.importSpecifier(t.identifier(HTML_IDENT), t.identifier('html')),
		t.importSpecifier(t.identifier(ATTR_IDENT), t.identifier('attr')),
		t.importSpecifier(t.identifier(TEXT_IDENT), t.identifier('text')),
		t.importSpecifier(t.identifier(SPREAD_ATTR_IDENT), t.identifier('spread_attr')),
	], t.stringLiteral(mod));

	let nodes = null;
	let isRuntimeRequired = false;

	function expr (value) {
		nodes.push(value);
		nodes.push(t.stringLiteral(''));
	}

	function text (str) {
		const last = nodes[nodes.length - 1];
		last.value += str;
	}

	function buildNodes (nodes) {
		return nodes.reduce((prev, next) => t.binaryExpression('+', prev, next));
	}

	function isJSXComponentName (node) {
		if (t.isJSXIdentifier(node)) {
			const code = node.name.charCodeAt(0);
			return code >= 65 && code <= 90;
		}
		else if (t.isJSXMemberExpression(node)) {
			return true;
		}

		return false;
	}

	function getNameExpression (node) {
		if (t.isJSXNamespacedName(node)) {
			return t.identifier(node.namespace.name + ':' + node.name.name);
		}

		if (t.isJSXMemberExpression(node)) {
			return t.memberExpression(getNameExpression(node.object), getNameExpression(node.property));
		}

		return t.identifier(node.name);
	}

	function handleJSXVisit (path, isFragment) {
		const nodesBefore = nodes;

		nodes = [t.stringLiteral('')];

		if (isFragment) {
			processChildren(path);

			isRuntimeRequired = true;
			const expr = buildNodes(nodes);
			path.replaceWith(t.callExpression(t.identifier(HTML_IDENT), [expr]));
		}
		else {
			processNode(path, true);
		}

		nodes = nodesBefore;
	}

	function processNode (path, isRoot) {
		const node = path.node;
		const open = node.openingElement;
		const name = open.name;

		if (isJSXComponentName(name)) {
			// <Button color='red'>Hello world</Button>
			// Button({ color: 'red', children: 'Hello world' })
			const ident = getNameExpression(name);
			const props = t.objectExpression([]);;

			for (const attr of open.attributes) {
				if (t.isJSXSpreadAttribute(attr)) {
					const spread = t.spreadElement(attr.argument);
					props.properties.push(spread);
					continue;
				}

				const prop = t.objectProperty(t.identifier(attr.name.name), t.nullLiteral());
				const value = attr.value;

				if (t.isJSXExpressionContainer(value)) {
					prop.value = value.expression;
				}
				else if (t.isStringLiteral(value)) {
					prop.value = t.stringLiteral(value.value);
				}
				else {
					prop.value = t.booleanLiteral(true);
				}

				props.properties.push(prop);
			}

			if (node.children.length > 0) {
				const fragment = t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), node.children);
				const prop = t.objectProperty(t.identifier('children'), fragment);

				props.properties.push(prop);
			}

			expr(
				t.callExpression(t.identifier(TEXT_IDENT), [
					t.callExpression(ident, [props])
				]),
			);
		}
		else {
			const tagName = getNameExpression(name).name;

			text('<');
			text(tagName);

			for (const attr of open.attributes) {
				if (t.isJSXSpreadAttribute(attr)) {
					expr(t.callExpression(t.identifier(SPREAD_ATTR_IDENT), [attr.argument]));
					continue;
				}

				const attrName = attr.name.name;
				const value = attr.value;

				if (t.isJSXExpressionContainer(value)) {
					const vexpr = value.expression;

					if (t.isNullLiteral(vexpr) || (t.isIdentifier(vexpr) && vexpr.name === 'undefined')) {
						// do nothing
					}
					else if (t.isLiteral(vexpr)) {
						text(escapeAttr(attrName, vexpr.value));
					}
					else {
						expr(t.callExpression(t.identifier(ATTR_IDENT), [t.stringLiteral(attrName), vexpr]));
					}
				}
				else {
					text(escapeAttr(attrName, t.isStringLiteral(value) ? value.value : true));
				}
			}

			if (open.isSelfClosing) {
				text('/>');
			}
			else {
				text('>');
				processChildren(path);
				text('</' + tagName + '>');
			}
		}


		if (isRoot) {
			isRuntimeRequired = true;
			const expr = buildNodes(nodes);
			path.replaceWith(t.callExpression(t.identifier(HTML_IDENT), [expr]));
		}
	}

	function processChildren (path) {
		for (const child of path.get('children')) {
			if (t.isJSXText(child)) {
				const str = cleanJSXLiteral(child.node.value);
				text(escapeText(str));
			}
			else if (t.isJSXElement(child)) {
				processNode(child, false);
			}
			else if (t.isJSXExpressionContainer(child)) {
				const cexpr = child.node.expression;

				if (t.isNullLiteral(cexpr) || (t.isIdentifier(cexpr) && cexpr.name === 'undefined')) {
					// do nothing
				}
				else if (t.isLiteral(cexpr)) {
					text(escapeText(cexpr.value));
				}
				else {
					expr(t.callExpression(t.identifier(TEXT_IDENT), [cexpr]));
				}
			}
			else if (t.isJSXEmptyExpression(child)) {
				continue;
			}
			else if (t.isJSXSpreadChild(child)) {
				// this is unsupported
				text(escapeText('[<spread children>]'));
			}
		}
	}

	return {
		name: 'transform-jsx-to-string',
		inherits: jsx.default || jsx,
		visitor: {
			Program: {
				enter () {
					isRuntimeRequired = false;
				},
				exit (path) {
					if (isRuntimeRequired) {
						path.unshiftContainer('body', importDecl);
					}
				},
			},

			JSXElement (path) {
				handleJSXVisit(path, false);
			},
			JSXFragment (path) {
				handleJSXVisit(path, true);
			},
		},
	};
}

function cleanJSXLiteral (str) {
  const lines = str.split(/\r\n|\n|\r/);

  let lastNonEmptyLine = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/[^ \t]/)) {
      lastNonEmptyLine = i;
    }
  }

  let res = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const isFirstLine = i === 0;
    const isLastLine = i === lines.length - 1;
    const isLastNonEmptyLine = i === lastNonEmptyLine;

    // replace rendered whitespace tabs with spaces
    let trimmedLine = line.replace(/\t/g, ' ');

    // trim whitespace touching a newline
    if (!isFirstLine) {
      trimmedLine = trimmedLine.replace(/^[ ]+/, '');
    }

    // trim whitespace touching an endline
    if (!isLastLine) {
      trimmedLine = trimmedLine.replace(/[ ]+$/, '');
    }

    if (trimmedLine) {
      if (!isLastNonEmptyLine) {
        trimmedLine += " ";
      }

      res += trimmedLine;
    }
  }

  return res;
}
