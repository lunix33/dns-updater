export function profileOpt(d) {
	return Object.keys(d).map(k => {
		return {
			text: k,
			value: k
		}
	});
}

export function zoneIdOpt(d) {
	return Object.values(d)
		.flatMap((v) => {
				const rtn = [];
				for(let n in v) {
					rtn.push({text:`${n} (${v[n]})`, value: v[n]})
				}
				return rtn;
		})
}