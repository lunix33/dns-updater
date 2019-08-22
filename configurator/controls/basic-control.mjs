import { toDashCase, emptyNode } from "../utils/tools.mjs";

export default class BasicControl {
	static generateTag(config) {
		const controlIdentifier =
			this.controlIdentifier ||
			toDashCase(this.name);
		const tag = document.createElement(controlIdentifier);
		for (let i in config) {
			if (config.hasOwnProperty(i)) {
				if (config[i] != null)
					tag.setAttribute(i, config[i]);
			}
		}
		return tag;
	}

	static init(scope) {
		if (scope == null)
			scope = document;
		const controlIdentifier =
			this.controlIdentifier ||
			toDashCase(this.name);
		const eles = scope.querySelectorAll(controlIdentifier);
		for (let e of eles) {
			if (e.control == null)
				new this(scope.data, e);
		}
	}

	/** @type {HTMLElement} */
	_hook;

	/** @type {Object} */
	__bindExpression = {};

	/** @type {Object} */
	__viewData;

	constructor(viewData, hook) {
		this._hook = hook;
		hook.control = this;

		setTimeout(() => {
			this.__bind(viewData);

			this._init();

			this._html();
		});
	}

	__bind(viewData) {
		this.__viewData = viewData;
		const props = Object.getOwnPropertyNames(this);
		for (let p of props) {
			if (/^\$/.test(p) /* Starts with $ */ ) {
				const ps = p.slice(1);
				// Attribute with _ eval the value.
				let attr = this._hook.getAttribute(`_${ps}`);
				if (attr != null) {
					if (attr.charAt(0) === '!') {
						let exp = attr.slice(1).replace('%', 'viewData');
						this[p] = eval(exp);
					} else {
						this[p] = eval(`viewData.${attr}`);
						this.__bindExpression[p] = attr;
					}
					continue;
				}

				// Attribute without $, copy as-is.
				attr = this._hook.getAttribute(ps);
				if(attr != null)
					this[p] = attr;

				if (this[p] === 'undefined')
					this[p] = null;
				else {
					try {
						this[p] = JSON.parse(this[p])
					} catch (e) { /* Ignore */ }
				}
			}
		}
	}

	_init() { /* Virtual */ }

	_html() { /* Virtual */ }

	rerender() {
		emptyNode(this._hook);
		this._hook.control = null;
		new this.constructor(this.__viewData, this._hook);
	}
}