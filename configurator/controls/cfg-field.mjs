import BasicControl from './basic-control.mjs';

export default class CfgField extends BasicControl {
	/** @type {string}*/
	$print = '';

	/** @type {string} */
	$tooltip = null;

	/** @type {string}*/
	$name = '';

	/** @type {string} */
	$type = 'text';

	/** @type {Object|null} */
	$options = [];

	/** @type {*} */
	$value = '';

	/** @type {*|null} */
	$default = null;

	/** @type {boolean} */
	$readonly = false;

	/** @type {boolean} */
	$required = false;

	/** @type {boolean} */
	$bound = false;

	$validation = () => { return true; };

	/** @type {HTMLElement} */
	_input;

	/**
	 * The current value of the input.
	 * @returns {*} The current value.
	 */
	get value() {
		if (!this.$value)
			return this.$default;
		return this.$value;
	}

	/**
	 * Apply the value to the input.
	 * @param v The new value.
	 */
	set value(v) {
		if (this.$type === 'checkbox') {
			this.$value = (v == true);
			this._input.checked = this.$value;
		} else if (this.$type === 'select') {
			for (let n of this._input.childNodes)
				n.selected = (n.value == v);

			if (this._input.selectedOptions.length === 0)
				this.$value = null;
			else
				this.$value = v;
		} else {
			this._input.value = v;
			this.$value = v;
		}
	}

	/**
	 * Validate if the field is valid.
	 * @return {boolean} True if the field is valid, otherwise false.
	 */
	get valid() {
		// Validate if the number is valid.
		let validNum = true;
		if (this.$type === 'number') {
			const val = parseFloat(this.value);
			if (Number.isNaN(val))
				validNum = false;
		}

		// Validate if the field is present if required.
		let reqSatisfied = true;
		if (this.$required) {
			if (!this.value)
				reqSatisfied = false;
		}

		// Passes the validation, the number is valid and required is satisfied.
		return this.$validation(this.value) && validNum && reqSatisfied;
	}

	_init() {
		this.$value = (this.$value) ? this.$value : null;
		if (!this.$value)
			this.$value = (this.$default) ? this.$default : null;
		this.$bound = (this.$bound === '');
		this.$required = (this.$required === '');

		// Assign property binding.
		if (this.$bound && this.__bindExpression.$value) {
			const {obj, prop} = this._resolveBind();
			Object.defineProperty(obj, prop, {
				set: (v) => {
					this.value = v;
				},
				get: () => {
					return this.value;
				},
				configurable: true
			})
		}
	}

	_html() {
		const container = document.createElement('div');
		container.classList = (this.$type !== 'checkbox') ? 'form-group' : 'form-check';

		let input;
		if (this.$type === 'checkbox' && !this.$readonly) {
			input = document.createElement('input');
			input.name = this.$name;
			input.id = this.$name;
			input.type = this.$type;
			input.checked = this.$value;
			input.classList.add('form-check-input');
			container.appendChild(input);
		}

		if (this.$print) {
			const label = document.createElement('label');
			if (this.$type === 'checkbox')
				label.classList.add('form-check-label');
			label.for = this.$name;
			label.innerText = this.$print;

			if (this.$required) {
				const reqStar = document.createElement('span');
				reqStar.classList.add('text-danger');
				reqStar.innerText = '*';
				label.appendChild(reqStar);
			}

			if (this.$tooltip) {
				$(label).tooltip({
					title: this.$tooltip,
					html: true
				});
			}

			container.appendChild(label);
		}

		if (this.$readonly) {
			const element = document.createElement(p);
			element.classList.add('form-text');
			element.innerText = this.$value;
			container.appendChild(element);
		} else if(this.$type !== 'checkbox') {
			if (this.$type === 'select') {
				input = document.createElement('select');
				for (let o of this.$options) {
					const option = document.createElement('option');
					option.innerText = o.text;
					option.value = o.value || null;
					input.appendChild(option)
				}
			} else {
				input = document.createElement('input');
				input.type = this.$type;
			}

			input.name = this.$name;
			input.id = this.$name;
			input.value = this.$value;
			input.classList.add('form-control');
			container.appendChild(input);
		}

		if (input && this.$required)
			input.required = true;

		this._hook.appendChild(container);
		this._input = input;

		if (input)
			input.addEventListener('input', this._onInput.bind(this));
	}

	/**
	 * Unbind a bounded countrol.
	 */
	unbind() {
		if (this.$bound) {
			const {obj, prop} = this._resolveBind();
			Object.defineProperty(obj, prop, {
				value: this.$value,
				writable: true,
				configurable: true
			});
			this.$bound = false;
			return {obj, prop};
		}
	}

	/**
	 * Resolve the object and property bounded with the control.
	 * @returns {{obj: Object, prop: string}}
	 * @private
	 */
	_resolveBind() {
		const match = /(.+)\.(\w+)/.exec(this.__bindExpression.$value) || [];
		const objectPath = match[1] || '';
		const prop = match[2] || this.__bindExpression.$value;
		const objstr = (objectPath !== '') ?
			`this.__viewData.${objectPath}` : 'this.__viewData';
		const obj = eval(objstr);

		return { obj, prop };
	}

	/**
	 * Fired when a change to the input field is made.
	 * @param {InputEvent} event The fired event.
	 * @private
	 */
	_onInput(event) {
		const t = event.target;
		this.$value =
			(this.$type === 'checkbox') ? t.checked :
			(this.$type === 'number') ? parseFloat(t.value) : t.value;
		t.classList.toggle('border-danger', !this.valid);
	}
}

/**
 * @typedef {Object} SelectOption
 * @property {string} text The displayed text.
 * @property {*} value The value of the option.
 */
