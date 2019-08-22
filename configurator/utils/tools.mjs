//#region **** JS Tools ****
/**
 * Transform a Pascal Case string to dash case
 * eg: ThisString => this-string
 * @param str The string to transform
 * @returns {string} The resulting string.
 */
export function toDashCase(str) {
	str = str.replace(/[A-Z]/g,
		(x) => { return `-${x.toLowerCase()}` });
	return (str.charAt(0) === '-') ? str.slice(1) : str;
}

/**
 * Get a static unbounded object.
 * @param {Object} obj The object to recompose.
 * @returns {Object} The recomposed object.
 */
export function objectRecompose(obj) {
	const rtn = {};
	const propDesc = Object.getOwnPropertyDescriptors(obj);
	for (let d in propDesc) {
		rtn[d] = (propDesc[d].get instanceof Function) ?
			propDesc[d].get() :
			propDesc[d].value;

		// Set null value from text.
		if (rtn[d] === 'null')
			rtn[d] = null;
		else if (rtn[d] === 'undefined')
			rtn[d] = undefined;
	}
	return rtn;
}
//#endregion

//#region **** Effect ****
/**
 *
 * @param {number} timeout The duration before done is called.
 * @param {HTMLElement} input The element on which the gradiant will be applied.
 * @param {string} [colora] A valid css color.
 * @param {string} [colorb] A valid css color.
 * @param {number} [gradSpace] The length of the gradian.
 * @param {Function} done
 */
export function backgroundTimeout(
		timeout, input,
		colora, colorb,
		gradSpace, done) {
	if (input.intervalTimer) {
		clearInterval(input.intervalTimer);
		input.style.backgroundImage = input.originalBg;
	}

	colora = (colora) ? colora : 'hsla(0, 0%, 0%, .25)';
	colorb = (colorb) ? colorb : 'hsla(0, 0%, 100%, 0)';
	gradSpace = (gradSpace) ? gradSpace : 20;

	const maxIter = 100 + gradSpace;
	const step = timeout / maxIter;
	input.originalBg = input.style.backgroundImage;

	let iter = 0;
	input.intervalTimer = setInterval(() => {
		const low = iter - gradSpace;
		const high = iter;
		input.style.backgroundImage =
			`linear-gradient(to right, ${colora} ${low}%, ${colorb} ${high}%)`;

		if (iter >= maxIter) {
			clearInterval(input.intervalTimer);
			input.intervalTimer = null;
			input.style.backgroundImage = input.originalBg;
			input.originalBg = null;
			done();
			return;
		}
		iter++;
	}, step);
}

/**
 * Make an element blink with a class.
 * @param input The element to blink.
 * @param className The call to be blinked.
 * @param blinkms The time before the class is removed.
 */
export function blinkInput(input, className, blinkms) {
	input.classList.add(className);
	setTimeout(() => {
		input.classList.remove(className);
	}, (blinkms || 1000));
}
//#endregion

//#region **** HTML Control ****
/** @type {Array<BasicControl>} */
let controlList = [];

/**
 * Register a new control for initialization.
 * This function makes sure the control isn't registered multiple times.
 * @param {BasicControl} control The control to register.
 */
export function registerControl(control) {
	const controlNames = controlList.map(x => x.name);
	if (!controlNames.includes(control.name))
		controlList.push(control);
}

/**
 * Initialize all the controls within a scope.
 * @param {HTMLElement} scope The element from which the initialization should be done.
 */
export function initControls(scope) {
	if (scope == null)
		scope = document;
	for (let c of controlList) {
		c.init(scope);
	}
}

/**
 * Remove all the child node within a node.
 * @param {HTMLElement} node
 */
export function emptyNode(node) {
	while (node.firstChild)
		node.removeChild(node.firstChild);
}
//#endregion

/**
 * Display a dialog
 * @param {HTMLElement|string} content The body content of the dialog.
 * @param {string} [title='Message'] The title displayed in the modal.
 * @param {HTMLElement|string|null} [foot] The footer content of the dialog.
 */
export function dialog(content, title = 'Message', foot) {
	const modal = document.querySelector('.modal') || generateModal(),
		contentdiv = modal.querySelector('.modal-content'),
		header = contentdiv.querySelector('.modal-title'),
		body = contentdiv.querySelector('.modal-body');
	let footer = contentdiv.querySelector('.modal-footer');

	// Set the header
	header.innerText = title;

	// Set the body.
	if (content instanceof HTMLElement) {
		emptyNode(body);
		body.appendChild(content);
	} else
		body.innerHTML = content;

	// Set the footer.
	if (!footer && foot) {
		footer = document.createElement('div');
		footer.classList.add('modal-footer');
		contentdiv.appendChild(footer);
	} else if (footer && !foot) {
		contentdiv.removeChild(footer);
		footer = null;
	}

	if (footer) {
		if (foot instanceof HTMLElement) {
			emptyNode(footer);
			footer.appendChild(foot);
		} else
			footer.innerHTML = foot;
	}

	$(modal).modal('show');
}

/**
 * Display an error dialog message.
 * @param {Error} err The error occurred.
 * @param {boolean} [showStack=true] If true, the error stack will be displayed.
 */
export function errorDialog(err, showStack = true) {
	const body = document.createElement('div');

	const message = document.createElement('p');
	message.classList.add('whitespace');
	message.innerText = err.message;

	body.appendChild(message);

	if (showStack) {
		const stack = document.createElement('p');
		const code = document.createElement('code');
		code.classList.add('whitespace');
		code.innerText = err.stack;

		stack.appendChild(code);
		body.appendChild(stack);
	}

	dialog(body, 'Error');
}

/**
 * Generate the modal element and add it to the body.
 * @returns {HTMLDivElement} The content node of the modal.
 */
function generateModal() {
	const divmodal = document.createElement('div');
	divmodal.classList.add('modal', 'fade');
	divmodal.tabIndex = -1;
	divmodal.role = 'dialog';

	const divmodaldoc = document.createElement('div');
	divmodaldoc.classList.add('modal-dialog', 'modal-lg');
	divmodaldoc.role = 'document';

	const divmodalcontent = document.createElement('div');
	divmodalcontent.classList.add('modal-content');

	const divmodalheader = document.createElement('div');
	divmodalheader.classList.add('modal-header');

	const h5headertitle = document.createElement('h5');
	h5headertitle.classList.add('modal-title');

	const closebtn = document.createElement('button');
	closebtn.type = 'button';
	closebtn.classList.add('close');
	closebtn.dataset.dismiss = 'modal';
	closebtn.setAttribute('aria-label', 'Close');
	closebtn.innerText = '\xD7'; // &times;

	const divmodalbody = document.createElement('div');
	divmodalbody.classList.add('modal-body');

	divmodalheader.appendChild(h5headertitle);
	divmodalheader.appendChild(closebtn);
	divmodalcontent.appendChild(divmodalheader);
	divmodalcontent.appendChild(divmodalbody);
	divmodaldoc.appendChild(divmodalcontent);
	divmodal.appendChild(divmodaldoc);
	document.querySelector('body').appendChild(divmodal);

	return divmodal;
}
