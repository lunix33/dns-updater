import { emptyNode, blinkInput, errorDialog } from '/utils/tools.mjs';
import { config } from '/main.js';
import Ajax from '/utils/ajax.mjs';

export default async function MorePageFragment(viewData) {
	const fetchBtn = document.querySelector('#fetch');
	fetchBtn.addEventListener('click', onFetch);

	displayInfos();
}

async function onFetch() {
	const fetchReq = new Ajax(Ajax.verbs.GET, '/route53/data');
	if (!config.plugins)
		config.plugins = {};
	try {
		config.plugins.route53 = await fetchReq.execute();
		blinkInput(document.querySelector('#fetch'), 'btn-success', 1000);
		displayInfos();
	} catch (err) {
		blinkInput(document.querySelector('#fetch'), 'btn-danger', 1000);
		errorDialog(err);
	}
}

function displayInfos() {
	const awsdata = document.querySelector('#awsdata');
	emptyNode(awsdata);
	if (!config.plugins ||
		!config.plugins.route53 ||
		Object.keys(config.plugins.route53).length === 0) {
		const li = document.createElement('li');
		li.innerText = 'No data loaded';
		awsdata.appendChild(li);
	} else {
		for (let p in config.plugins.route53) {
			const profileli = document.createElement('li');
			const profilep = document.createElement('p');
			profilep.innerText = p;

			const zoneul = document.createElement('ul');
			for (let z in config.plugins.route53[p]) {
				const zoneli = document.createElement('li');
				const zonespan = document.createElement('span');
				zonespan.innerText = z;
				const zonesmall = document.createElement('small');
				zonesmall.innerText = `(${config.plugins.route53[p][z]})`;
				zonesmall.classList.add('text-muted');

				zoneli.appendChild(zonespan);
				zoneli.appendChild(zonesmall);
				zoneul.appendChild(zoneli);
			}

			profileli.appendChild(profilep);
			profileli.appendChild(zoneul);
			awsdata.appendChild(profileli);
		}
	}
}
