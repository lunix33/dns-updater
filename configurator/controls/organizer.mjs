import BasicControl from "./basic-control.mjs";

export default class Organizer extends BasicControl{
	//#region **** Fields ****
	/** @type {Array<*>|null} */
	$elements = null;

	/** @type {Array<*>} */
	$active = [];

	/** @type {string|null} */
	$text = null;

	/**
	 * @type {Array}
	 * @private
	 */
	_inactive = [];

	/**
	 * @type {boolean}
	 * @private
	 */
	_toggleable = false;
	//#endregion

	_init() {
		if (this.$elements != null) {
			this._inactive = this.$elements.filter(x => this.$active.indexOf(x) === -1);
			this._toggleable = true;
		}
	}

	_html() {
		this._hook.classList.toggle('row', true);

		const activeContainer = document.createElement('div');
		const active = document.createElement('ul');
		active.classList.add('list-group', 'active-list');
		if (this._toggleable) {
			activeContainer.classList.add('col-6');

			const activeTitle = document.createElement('h5');
			activeTitle.innerText = 'Active';
			activeContainer.appendChild(activeTitle);
		}

		this._generateListElements(this.$active, active, true);
		activeContainer.appendChild(active);
		this._hook.appendChild(activeContainer);

		if (this._toggleable) {
			const inactiveContainer = document.createElement('div');
			inactiveContainer.classList.add('col-6');

			const inactive = document.createElement('ul');
			inactive.classList.add('list-group', 'inactive-list');

			const inactiveTitle = document.createElement('h5');
			inactiveTitle.innerText = 'Inactive';

			inactiveContainer.appendChild(inactiveTitle);

			this._generateListElements(this._inactive, inactive, false);

			inactiveContainer.appendChild(inactive);
			this._hook.appendChild(inactiveContainer);
		}
	}

	/**
	 * Generate all the list element for a specific list.
	 * @param {Array<*>} list The list of element to generate.
	 * @param {HTMLUListElement} hook The hook in which the element should be added.
	 * @param {boolean}isActive True if the element is considered active.
	 * @private
	 */
	_generateListElements(list, hook, isActive) {
		for (let e of list) {
			const element = document.createElement('li');
			element.$data = e;
			element.classList.add('list-group-item', 'd-flex', 'align-items-center', 'justify-content-between');

			// Text on the list element
			const text = document.createElement('p');
			text.innerText = e[this.$text] || e;
			element.appendChild(text);

			// The button container.
			const btnContainer = document.createElement('div');
			btnContainer.classList.add('btn-group');

			const btnsDef = [{
				cls: 'b-en',
				icon: 'chevron-left',
				fn: this._onEnable.bind(this),
				color: 'success',
				hide: isActive,
				tooltip: 'Enable'
			}, {
				cls: 'b-up',
				icon: 'chevron-up',
				fn: this._onMoveUp.bind(this),
				color: 'primary',
				hide: (this._toggleable && !isActive),
				disable: Object.is(e, list[0]),
			}, {
				cls: 'b-down',
				icon: 'chevron-down',
				fn: this._onMoveDown.bind(this),
				color: 'primary',
				hide: (this._toggleable && !isActive),
				disable: Object.is(e, list[list.length - 1]),
			}, {
				cls: 'b-dis',
				icon: 'chevron-right',
				fn: this._onDisable.bind(this),
				color: 'danger',
				hide: !isActive,
				tooltip: 'Disable'
			}];

			for (let b of btnsDef) {
				const btn = document.createElement('button');
				btn.type = 'button';
				btn.disabled = b.disable;
				btn.addEventListener('click', b.fn);
				btn.classList.add('btn', 'btn-sm', `btn-${b.color}`, b.cls);
				if (b.hide)
					btn.classList.add('d-none');

				if (b.tooltip)
					$(btn).tooltip({ title: b.tooltip });


				const btnIcon = document.createElement('i');
				btnIcon.classList.add('fas', `fa-${b.icon}`);
				btn.appendChild(btnIcon);

				btnContainer.appendChild(btn);
			}

			element.appendChild(btnContainer);

			hook.appendChild(element);
		}
	}

	/**
	 * Action when an element is enabled.
	 * @param {Event} e The event.
	 * @private
	 */
	_onEnable(e) {
		const li = e.target.parentNode.parentNode;
		const active = this._hook.querySelector('.active-list');
		const inactive = this._hook.querySelector('.inactive-list');

		$(li).tooltip('hide');
		active.appendChild(li);

		this._toggleBtns(li);
		this._setBtnsState();

		this.$active.push(li.$data);
	}

	/**
	 * Action when an element is disabled.
	 * @param {Event} e The event.
	 * @private
	 */
	_onDisable(e) {
		const li = e.target.parentNode.parentNode;
		const active = this._hook.querySelector('.active-list');
		const inactive = this._hook.querySelector('.inactive-list');

		$(li).tooltip('hide');
		inactive.appendChild(li);

		this._toggleBtns(li);
		this._setBtnsState();

		const idx = this.$active.indexOf(li.$data);
		this.$active.splice(idx, 1);
	}

	/**
	 * Action when an element move up the list.
	 * @param {Event} e The event.
	 * @private
	 */
	_onMoveUp(e) {
		const li = e.target.parentNode.parentNode;
		const list = li.parentNode;
		const prevLi = li.previousSibling;

		// Swap data
		list.insertBefore(li, prevLi);
		const curIdx = this.$active.indexOf(li.$data);
		this._swap(this.$active, curIdx, (curIdx - 1));

		// Set new buttons state
		this._setBtnsState();
	}

	/**
	 * Action when an element move down the list.
	 * @param {Event} e The event
	 * @private
	 */
	_onMoveDown(e) {
		const li = e.target.parentNode.parentNode;
		const list = li.parentNode;
		const nextLi = li.nextSibling.nextSibling;

		// Swap data.
		list.insertBefore(li, nextLi);
		const curIdx = this.$active.indexOf(li.$data);
		this._swap(this.$active, curIdx, (curIdx - 1));

		// Set the new buttons state.
		this._setBtnsState();
	}

	/**
	 * Toggle the display status of the buttons.
	 * @param {HTMLLIElement} li The list element
	 * @private
	 */
	_toggleBtns(li) {
		const btns = li.querySelectorAll('button');
		for(let b of btns) {
			b.classList.toggle('d-none');
			b.disabled = false;
		}
	}

	/**
	 * Set the state of all the buttons in the active list.
	 * @private
	 */
	_setBtnsState() {
		const active = this._hook.querySelector('.active-list');
		for (let e of active.childNodes) {
			const btnUp = e.querySelector('.b-up');
			const btnDown = e.querySelector('.b-down');
			btnUp.disabled = (e === active.childNodes[0]);
			btnDown.disabled = (e === active.childNodes[active.childNodes.length - 1]);
		}
	}

	/**
	 * Swap two elements in an array.
	 * @param {Array<*>} arr The array in which the swap occur.
	 * @param {number} a The index of the first element.
	 * @param {number} b The index of the second element.
	 * @private
	 */
	_swap(arr, a, b) {
		let t = arr[a];
		arr[a] = arr[b];
		arr[b] = t;
	}
}